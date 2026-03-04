"""
Appointment Controller
Handles appointment booking and management
"""

from fastapi import HTTPException
from datetime import datetime, timedelta
from typing import Optional
from bson import ObjectId
from app.config.database import Database
from app.models.appointment import AppointmentCreate


async def create_appointment(patient_id: str, data: AppointmentCreate):
    """Book a new appointment"""
    db = Database.get_db()

    # Check provider exists and is actually a provider
    provider = await db.users.find_one({"_id": ObjectId(data.provider_id)})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    if provider["role"] != "provider":
        raise HTTPException(status_code=400, detail="Selected user is not a provider")

    # Prevent double booking - check if provider is already booked at that time
    # Allow 30 minute windows around the appointment time
    window_start = data.appointment_date - timedelta(minutes=30)
    window_end = data.appointment_date + timedelta(minutes=30)

    existing = await db.appointments.find_one({
        "provider_id": data.provider_id,
        "status": {"$in": ["pending", "confirmed"]},
        "appointment_date": {
            "$gte": window_start,
            "$lte": window_end
        }
    })

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Provider already has an appointment at this time. Please choose a different time."
        )

    # Create appointment document
    appointment = {
        "patient_id": patient_id,
        "provider_id": data.provider_id,
        "appointment_date": data.appointment_date,
        "status": "pending",
        "reason": data.reason,
        "notes": data.notes,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await db.appointments.insert_one(appointment)
    appointment["_id"] = str(result.inserted_id)

    return {
        "message": "Appointment booked successfully",
        "appointment": appointment
    }


async def get_patient_appointments(
    patient_id: str,
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
):
    """Get all appointments for a patient"""
    db = Database.get_db()

    query = {"patient_id": patient_id}
    if status:
        query["status"] = status

    skip = (page - 1) * limit
    total = await db.appointments.count_documents(query)
    cursor = db.appointments.find(query).sort("appointment_date", 1).skip(skip).limit(limit)
    appointments = await cursor.to_list(length=limit)

    for a in appointments:
        a["_id"] = str(a["_id"])

        # Get provider name
        provider = await db.users.find_one({"_id": ObjectId(a["provider_id"])})
        if provider:
            a["provider_name"] = f"{provider['first_name']} {provider['last_name']}"

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "appointments": appointments,
    }


async def get_provider_appointments(
    provider_id: str,
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
):
    """Get all appointments for a provider"""
    db = Database.get_db()

    query = {"provider_id": provider_id}
    if status:
        query["status"] = status

    skip = (page - 1) * limit
    total = await db.appointments.count_documents(query)
    cursor = db.appointments.find(query).sort("appointment_date", 1).skip(skip).limit(limit)
    appointments = await cursor.to_list(length=limit)

    for a in appointments:
        a["_id"] = str(a["_id"])

        # Get patient name
        patient = await db.users.find_one({"_id": ObjectId(a["patient_id"])})
        if patient:
            a["patient_name"] = f"{patient['first_name']} {patient['last_name']}"

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "appointments": appointments,
    }


async def cancel_appointment(appointment_id: str, user_id: str, role: str):
    """Cancel an appointment"""
    db = Database.get_db()

    appointment = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Only the patient who booked or the provider or admin can cancel
    if role == "patient" and appointment["patient_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this appointment")

    if appointment["status"] == "cancelled":
        raise HTTPException(status_code=400, detail="Appointment already cancelled")

    await db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": "cancelled", "updated_at": datetime.utcnow()}}
    )

    return {"message": "Appointment cancelled successfully"}


async def confirm_appointment(appointment_id: str, provider_id: str):
    """Provider confirms an appointment"""
    db = Database.get_db()

    appointment = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if appointment["provider_id"] != provider_id:
        raise HTTPException(status_code=403, detail="Not authorized to confirm this appointment")

    await db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": "confirmed", "updated_at": datetime.utcnow()}}
    )

    return {"message": "Appointment confirmed successfully"}