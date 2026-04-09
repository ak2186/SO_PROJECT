"""
Chat Controller
Handles chatbot logic using Google Gemini
"""

from fastapi import HTTPException
from datetime import datetime
from bson import ObjectId
from google import genai
from google.genai import types
from app.config.settings import settings
from app.config.database import Database
from app.utils.encryption import encrypt_field, decrypt_field, decrypt_dict_fields


# Configure Gemini client
client = genai.Client(api_key=settings.GEMINI_API_KEY)


SYSTEM_PROMPT = """You are HEALIX Assistant, a helpful health monitoring app assistant.

Your responsibilities:
1. Answer general health questions in simple, friendly language
2. Help users understand their biomarker readings (heart rate, SpO2, steps, calories, blood pressure)
3. Help users with their appointments (remind them of upcoming ones, suggest booking)
4. Explain their prescriptions and dosages
5. For any serious medical concerns, ALWAYS advise the user to contact their doctor

Important rules:
- Never diagnose medical conditions
- Never recommend specific medications or dosages beyond what is already prescribed
- Always remind users to consult their doctor for medical advice
- Be friendly, clear and concise
- If asked about something outside health/app topics, politely redirect

The patient's current health data will be provided to you at the start of each conversation.
Use this data to give personalized responses.
"""


async def get_patient_context(user_id: str) -> str:
    """Fetch anonymized patient health data to give Gemini context.

    PII (name, exact identity) is intentionally excluded. Only clinical
    data needed for personalized health responses is included.
    """
    db = Database.get_db()

    # Get patient info — no name or identifying fields sent to Gemini
    patient = await db.users.find_one({"_id": ObjectId(user_id)})
    if not patient:
        return ""

    health_conditions = patient.get("health_conditions") or "None reported"
    context = f"""
PATIENT PROFILE (anonymized):
- Age: {patient.get('age', 'Not provided')}
- Gender: {patient.get('gender', 'Not provided')}
- Health Conditions: {health_conditions}
"""

    # Get latest biomarkers
    cursor = db.biomarkers.find({"user_id": user_id}).sort("recorded_at", -1).limit(5)
    biomarkers = await cursor.to_list(length=5)

    _bio_types = {"heart_rate": float, "spo2": float, "steps": float, "calories": float, "sleep_hours": float}
    if biomarkers:
        context += "\nLATEST BIOMARKER READINGS:\n"
        for b in biomarkers:
            decrypt_dict_fields(b, _bio_types)
            recorded = b.get("recorded_at", "")
            if isinstance(recorded, datetime):
                recorded = recorded.strftime("%Y-%m-%d")
            if "heart_rate" in b:
                context += f"- Heart Rate: {b['heart_rate']} bpm (recorded {recorded})\n"
            if "spo2" in b:
                context += f"- SpO2: {b['spo2']}% (recorded {recorded})\n"
            if "steps" in b:
                context += f"- Steps: {b['steps']} (recorded {recorded})\n"
            if "calories" in b:
                context += f"- Calories: {b['calories']} kcal (recorded {recorded})\n"
            if b.get("alerts"):
                context += f"  Alerts: {', '.join(b['alerts'])}\n"

    # Get upcoming appointments — provider name excluded, only timing and status
    now = datetime.utcnow()
    cursor = db.appointments.find({
        "patient_id": user_id,
        "appointment_date": {"$gte": now},
        "status": {"$in": ["pending", "confirmed"]}
    }).sort("appointment_date", 1).limit(3)
    appointments = await cursor.to_list(length=3)

    if appointments:
        context += f"\nUPCOMING APPOINTMENTS: {len(appointments)} scheduled\n"
        for a in appointments:
            date = a.get("appointment_date", "")
            if isinstance(date, datetime):
                date = date.strftime("%Y-%m-%d")
            context += f"- {date} ({a.get('status', '').capitalize()})\n"

    # Get active prescriptions — medication details included as they are needed for clinical context
    cursor = db.prescriptions.find({"patient_id": user_id, "status": "active"}).limit(5)
    prescriptions = await cursor.to_list(length=5)

    _rx_types = {"medication_name": str, "dosage": str, "frequency": str, "duration": str, "notes": str}
    if prescriptions:
        context += f"\nACTIVE PRESCRIPTIONS: {len(prescriptions)} medication(s)\n"
        for p in prescriptions:
            decrypt_dict_fields(p, _rx_types)
            context += f"- {p['medication_name']} {p['dosage']} - {p['frequency']} for {p['duration']}\n"

    return context


async def send_message(user_id: str, message: str):
    """Send a message to Gemini and get a response"""
    db = Database.get_db()

    # Get conversation history (last 10 messages)
    cursor = db.chat_history.find({"user_id": user_id}).sort("timestamp", -1).limit(10)
    history_docs = await cursor.to_list(length=10)
    history_docs.reverse()

    # Get patient context
    patient_context = await get_patient_context(user_id)

    # Build contents for Gemini (decrypt stored messages)
    contents = []
    for msg in history_docs:
        contents.append(types.Content(
            role=msg["role"],
            parts=[types.Part(text=decrypt_field(msg["content"]))]
        ))
    contents.append(types.Content(
        role="user",
        parts=[types.Part(text=message)]
    ))

    # Send message to Gemini
    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT + "\n\n" + patient_context
            )
        )

        reply = response.text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {str(e)}")

    # Save user message to history (encrypted)
    await db.chat_history.insert_one({
        "user_id": user_id,
        "role": "user",
        "content": encrypt_field(message),
        "timestamp": datetime.utcnow()
    })

    # Save assistant reply to history (encrypted)
    await db.chat_history.insert_one({
        "user_id": user_id,
        "role": "model",
        "content": encrypt_field(reply),
        "timestamp": datetime.utcnow()
    })

    return {
        "reply": reply,
        "timestamp": datetime.utcnow()
    }


async def get_chat_history(user_id: str, page: int = 1, limit: int = 20):
    """Get chat history for a user"""
    db = Database.get_db()

    skip = (page - 1) * limit
    total = await db.chat_history.count_documents({"user_id": user_id})
    cursor = db.chat_history.find({"user_id": user_id}).sort("timestamp", 1).skip(skip).limit(limit)
    messages = await cursor.to_list(length=limit)

    for m in messages:
        m["_id"] = str(m["_id"])
        m["content"] = decrypt_field(m["content"])

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "messages": messages
    }


async def clear_chat_history(user_id: str):
    """Clear chat history for a user"""
    db = Database.get_db()
    await db.chat_history.delete_many({"user_id": user_id})
    return {"message": "Chat history cleared successfully"}