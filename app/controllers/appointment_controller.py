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
from app.controllers.notification_controller import create_notification


async def list_providers():
    """List all providers (for patient booking)"""
    db = Database.get_db()
    cursor = db.users.find({"role": "provider", "status": "active"}, {"hashed_password": 0})
    providers = await cursor.to_list(length=200)
    for p in providers:
        p["_id"] = str(p["_id"])
    return {"providers": providers}


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

    # Notify the provider about the new appointment
    patient = await db.users.find_one({"_id": ObjectId(patient_id)})
    patient_name = f"{patient['first_name']} {patient['last_name']}" if patient else "A patient"
    appt_date = data.appointment_date.strftime("%b %d, %Y at %I:%M %p")
    await create_notification(
        user_id=data.provider_id,
        title="New Appointment Request",
        message=f"{patient_name} booked an appointment for {appt_date}. Please review and confirm.",
        notif_type="appointment",
    )
    # Notify the patient about their booking
    provider_name = f"Dr. {provider['first_name']} {provider['last_name']}"
    await create_notification(
        user_id=patient_id,
        title="Appointment Booked",
        message=f"Your appointment with {provider_name} on {appt_date} is pending confirmation.",
        notif_type="appointment",
    )

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

        # Get provider details
        provider = await db.users.find_one({"_id": ObjectId(a["provider_id"])})
        if provider:
            a["provider_name"] = f"{provider['first_name']} {provider['last_name']}"
            a["specialty"] = provider.get("specialty", "")
            a["available_hours"] = provider.get("available_hours", "")
            a["working_days"] = provider.get("working_days", "")

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

        # Get patient details
        patient = await db.users.find_one({"_id": ObjectId(a["patient_id"])})
        if patient:
            a["patient_name"] = f"{patient['first_name']} {patient['last_name']}"
            a["patient_age"] = patient.get("age", "")
            a["patient_gender"] = patient.get("gender", "")

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

    # Notify the other party about the cancellation
    appt_date = appointment["appointment_date"].strftime("%b %d, %Y at %I:%M %p")
    if role == "patient":
        # Patient cancelled → notify provider
        patient = await db.users.find_one({"_id": ObjectId(user_id)})
        name = f"{patient['first_name']} {patient['last_name']}" if patient else "A patient"
        await create_notification(
            user_id=appointment["provider_id"],
            title="Appointment Cancelled",
            message=f"{name} cancelled their appointment on {appt_date}.",
            notif_type="appointment",
        )
    else:
        # Provider/admin cancelled → notify patient
        provider = await db.users.find_one({"_id": ObjectId(appointment["provider_id"])})
        name = f"Dr. {provider['first_name']} {provider['last_name']}" if provider else "Your doctor"
        await create_notification(
            user_id=appointment["patient_id"],
            title="Appointment Cancelled",
            message=f"{name} cancelled your appointment on {appt_date}.",
            notif_type="appointment",
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

    # Notify the patient that appointment is confirmed
    provider = await db.users.find_one({"_id": ObjectId(provider_id)})
    provider_name = f"Dr. {provider['first_name']} {provider['last_name']}" if provider else "Your doctor"
    appt_date = appointment["appointment_date"].strftime("%b %d, %Y at %I:%M %p")
    await create_notification(
        user_id=appointment["patient_id"],
        title="Appointment Confirmed",
        message=f"{provider_name} confirmed your appointment on {appt_date}.",
        notif_type="appointment",
    )

    # Create a health data permission request for this patient-provider pair
    from app.controllers.permission_controller import create_permission_request
    await create_permission_request(
        patient_id=appointment["patient_id"],
        provider_id=provider_id,
        appointment_id=appointment_id,
    )
    # Notify patient about the permission request
    await create_notification(
        user_id=appointment["patient_id"],
        title="Health Data Access Request",
        message=f"{provider_name} is requesting access to your health data. You can grant or deny this in your dashboard.",
        notif_type="general",
    )

    return {"message": "Appointment confirmed successfully"}