"""
Biomarker Controller
Handles health data recording and retrieval
"""

from fastapi import HTTPException
from datetime import datetime
from typing import Optional
from bson import ObjectId
from app.config.database import Database
from app.models.biomarker import BiomarkerCreate
from app.utils.encryption import encrypt_dict_fields, decrypt_dict_fields

# Sensitive biomarker fields and their original types (for decryption casting)
_SENSITIVE_FIELDS = ["heart_rate", "spo2", "steps", "calories", "sleep_hours"]
_FIELD_TYPES = {
    "heart_rate": float,
    "spo2": float,
    "steps": float,
    "calories": float,
    "sleep_hours": float,
}


# Alert thresholds
ALERTS = {
    "heart_rate": {
        "low": 50, "high": 100,
        "msg_low": "Low heart rate detected ({value} BPM)",
        "msg_high": "High heart rate detected ({value} BPM)",
    },
    "spo2": {
        "low": 95,
        "msg_low": "Low blood oxygen detected ({value}%)",
    },
    "sleep_hours": {
        "low": 6,
        "msg_low": "Low sleep detected ({value}h — recommended 7-8h)",
    },
}


def check_alerts(data: dict) -> list:
    """Check biomarker values against alert thresholds"""
    triggered = []

    for field, thresholds in ALERTS.items():
        value = data.get(field)
        if value is None:
            continue
        if "low" in thresholds and value < thresholds["low"]:
            triggered.append(thresholds["msg_low"].format(value=value))
        elif "high" in thresholds and value > thresholds["high"]:
            triggered.append(thresholds["msg_high"].format(value=value))

    return triggered


async def _notify_on_alerts(user_id: str, alerts: list):
    """Send notifications to the patient and all their linked providers when alerts fire."""
    from app.controllers.notification_controller import create_notification

    if not alerts:
        return

    db = Database.get_db()
    alert_summary = "; ".join(alerts)

    # Notify the patient
    await create_notification(
        user_id=user_id,
        title="Health Alert",
        message=alert_summary,
        notif_type="goal",   # reuse goal type for the warning icon style
    )

    # Find all providers linked to this patient
    cursor = db.permissions.find({"patient_id": user_id, "status": "granted"})
    perms = await cursor.to_list(length=50)

    # Get patient name for provider notification
    patient = await db.users.find_one({"_id": ObjectId(user_id)}, {"first_name": 1, "last_name": 1})
    patient_name = f"{patient.get('first_name', '')} {patient.get('last_name', '')}".strip() if patient else "A patient"

    for perm in perms:
        await create_notification(
            user_id=perm["provider_id"],
            title=f"Patient Alert — {patient_name}",
            message=alert_summary,
            notif_type="provider_message",
        )


async def record_biomarker(user_id: str, data: BiomarkerCreate):
    """Record a new biomarker reading"""
    db = Database.get_db()

    biomarker_dict = data.model_dump(exclude_none=True)
    alerts = check_alerts(biomarker_dict)

    document = {
        **biomarker_dict,
        "user_id": user_id,
        "recorded_at": datetime.utcnow(),
        "alerts": alerts,
    }

    # Encrypt sensitive fields before storing
    encrypt_dict_fields(document, _SENSITIVE_FIELDS)

    result = await db.biomarkers.insert_one(document)

    # Send notifications if alerts triggered
    if alerts:
        await _notify_on_alerts(user_id, alerts)

    # Decrypt for the response
    decrypt_dict_fields(document, _FIELD_TYPES)
    document["_id"] = str(result.inserted_id)

    return {
        "message": "Biomarker recorded successfully",
        "id": str(result.inserted_id),
        "alerts": alerts,
        "data": document,
    }


async def get_current_readings(user_id: str):
    """Get the most recent reading for each biomarker type"""
    db = Database.get_db()

    latest = {}
    fields = ["heart_rate", "spo2", "steps", "calories", "sleep_hours"]

    for field in fields:
        doc = await db.biomarkers.find_one(
            {"user_id": user_id, field: {"$exists": True}},
            sort=[("recorded_at", -1)]
        )
        if doc:
            decrypt_dict_fields(doc, _FIELD_TYPES)
            latest[field] = {
                "value": doc[field],
                "recorded_at": doc["recorded_at"],
                "alerts": doc.get("alerts", [])
            }

    return {"current_readings": latest}


async def get_biomarker_history(
    user_id: str,
    page: int = 1,
    limit: int = 20,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
):
    """Get historical biomarker readings"""
    db = Database.get_db()

    query = {"user_id": user_id}
    if date_from or date_to:
        query["recorded_at"] = {}
        if date_from:
            query["recorded_at"]["$gte"] = date_from
        if date_to:
            query["recorded_at"]["$lte"] = date_to

    skip = (page - 1) * limit
    total = await db.biomarkers.count_documents(query)
    cursor = db.biomarkers.find(query).sort("recorded_at", -1).skip(skip).limit(limit)
    readings = await cursor.to_list(length=limit)

    for r in readings:
        decrypt_dict_fields(r, _FIELD_TYPES)
        r["_id"] = str(r["_id"])

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "readings": readings,
    }


async def get_alerts(user_id: str):
    """Get all readings that triggered alerts"""
    db = Database.get_db()

    cursor = db.biomarkers.find(
        {"user_id": user_id, "alerts": {"$ne": []}}
    ).sort("recorded_at", -1).limit(50)

    alerts = await cursor.to_list(length=50)
    for a in alerts:
        decrypt_dict_fields(a, _FIELD_TYPES)
        a["_id"] = str(a["_id"])

    return {"alerts": alerts, "total": len(alerts)}


async def get_patient_data_for_provider(provider_id: str, patient_id: str):
    """Provider fetches a patient's current readings + recent history. Requires granted permission."""
    from app.controllers.permission_controller import check_provider_has_permission
    from fastapi import HTTPException
    has_perm = await check_provider_has_permission(provider_id, patient_id)
    if not has_perm:
        raise HTTPException(status_code=403, detail="You do not have permission to view this patient's data")
    current = await get_current_readings(patient_id)
    history = await get_biomarker_history(patient_id, page=1, limit=20)
    return {
        "current_readings": current["current_readings"],
        "history": history["readings"],
    }