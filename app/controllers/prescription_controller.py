"""
Prescription Controller
Handles prescription management
"""

from fastapi import HTTPException
from datetime import datetime
from typing import Optional
from bson import ObjectId
from app.config.database import Database
from app.utils.audit_logger import AuditLogger
from app.models.prescription import PrescriptionCreate, SelfPrescriptionCreate
from app.controllers.notification_controller import create_notification
from app.utils.encryption import encrypt_dict_fields, decrypt_dict_fields

# Sensitive prescription fields and their types
_SENSITIVE_FIELDS = ["medication_name", "dosage", "frequency", "duration", "notes"]
_FIELD_TYPES = {
    "medication_name": str,
    "dosage": str,
    "frequency": str,
    "duration": str,
    "notes": str,
}


async def create_self_prescription(patient_id: str, data: SelfPrescriptionCreate):
    """Patient adds their own existing medication"""
    db = Database.get_db()

    prescription = {
        "patient_id": patient_id,
        "provider_id": "self",
        "medication_name": data.medication_name,
        "dosage": data.dosage,
        "frequency": data.frequency,
        "duration": data.duration or "",
        "notes": data.notes,
        "status": "active",
        "refills_allowed": 0,
        "refills_used": 0,
        "refill_requests": [],
        "source": "self",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    # Encrypt sensitive fields before storing
    encrypt_dict_fields(prescription, _SENSITIVE_FIELDS)

    result = await db.prescriptions.insert_one(prescription)

    # Decrypt for the response
    decrypt_dict_fields(prescription, _FIELD_TYPES)
    prescription["_id"] = str(result.inserted_id)

    return {
        "message": "Medication added successfully",
        "prescription": prescription,
    }


async def create_prescription(provider_id: str, data: PrescriptionCreate):
    """Provider creates a prescription for a patient"""
    db = Database.get_db()

    # Check patient exists
    patient = await db.users.find_one({"_id": ObjectId(data.patient_id)})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if patient["role"] != "patient":
        raise HTTPException(status_code=400, detail="Selected user is not a patient")

    prescription = {
        "patient_id": data.patient_id,
        "provider_id": provider_id,
        "medication_name": data.medication_name,
        "dosage": data.dosage,
        "frequency": data.frequency,
        "duration": data.duration,
        "notes": data.notes,
        "status": "active",
        "refills_allowed": data.refills_allowed,
        "refills_used": 0,
        "refill_requests": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    # Encrypt sensitive fields before storing
    encrypt_dict_fields(prescription, _SENSITIVE_FIELDS)

    result = await db.prescriptions.insert_one(prescription)

    # Decrypt for response and notifications
    decrypt_dict_fields(prescription, _FIELD_TYPES)
    prescription["_id"] = str(result.inserted_id)

    # Notify patient about new prescription
    provider = await db.users.find_one({"_id": ObjectId(provider_id)})
    provider_name = f"Dr. {provider['last_name']}" if provider else "Your doctor"
    await create_notification(
        user_id=data.patient_id,
        title="New Prescription",
        message=f"{provider_name} prescribed {data.medication_name}",
        notif_type="prescription",
    )

    await AuditLogger.log_provider_access(
        provider_id=provider_id,
        patient_id=data.patient_id,
        action="PROVIDER_CREATE_PRESCRIPTION",
        details={"medication": data.medication_name, "dosage": data.dosage, "prescription_id": str(result.inserted_id)},
    )

    return {
        "message": "Prescription created successfully",
        "prescription": prescription
    }


async def get_patient_prescriptions(
    patient_id: str,
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
):
    """Get all prescriptions for a patient"""
    db = Database.get_db()

    query = {"patient_id": patient_id}
    if status:
        query["status"] = status

    skip = (page - 1) * limit
    total = await db.prescriptions.count_documents(query)
    cursor = db.prescriptions.find(query).sort("created_at", -1).skip(skip).limit(limit)
    prescriptions = await cursor.to_list(length=limit)

    for p in prescriptions:
        decrypt_dict_fields(p, _FIELD_TYPES)
        p["_id"] = str(p["_id"])
        # Get provider name (skip for self-added medications)
        if p.get("provider_id") == "self" or p.get("source") == "self":
            p["provider_name"] = "Self-added"
        else:
            try:
                provider = await db.users.find_one({"_id": ObjectId(p["provider_id"])})
                if provider:
                    p["provider_name"] = f"{provider['first_name']} {provider['last_name']}"
            except Exception:
                p["provider_name"] = "Unknown"

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "prescriptions": prescriptions,
    }


async def get_provider_prescriptions(
    provider_id: str,
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
):
    """Get all prescriptions issued by a provider"""
    db = Database.get_db()

    query = {"provider_id": provider_id}
    if status:
        query["status"] = status

    skip = (page - 1) * limit
    total = await db.prescriptions.count_documents(query)
    cursor = db.prescriptions.find(query).sort("created_at", -1).skip(skip).limit(limit)
    prescriptions = await cursor.to_list(length=limit)

    for p in prescriptions:
        decrypt_dict_fields(p, _FIELD_TYPES)
        p["_id"] = str(p["_id"])
        # Get patient name
        patient = await db.users.find_one({"_id": ObjectId(p["patient_id"])})
        if patient:
            p["patient_name"] = f"{patient['first_name']} {patient['last_name']}"

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "prescriptions": prescriptions,
    }


async def request_refill(prescription_id: str, patient_id: str, notes: Optional[str] = None):
    """Patient requests a refill"""
    db = Database.get_db()

    prescription = await db.prescriptions.find_one({"_id": ObjectId(prescription_id)})
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    if prescription["patient_id"] != patient_id:
        raise HTTPException(status_code=403, detail="Not authorized to request refill for this prescription")

    if prescription["status"] != "active":
        raise HTTPException(status_code=400, detail="Prescription is not active")

    if prescription["refills_used"] >= prescription["refills_allowed"]:
        raise HTTPException(status_code=400, detail="No refills remaining")

    # Check no pending refill request already exists
    pending = [r for r in prescription["refill_requests"] if r["status"] == "pending"]
    if pending:
        raise HTTPException(status_code=400, detail="You already have a pending refill request")

    refill_request = {
        "id": str(ObjectId()),
        "requested_at": datetime.utcnow(),
        "status": "pending",
        "notes": notes,
        "reviewed_at": None,
    }

    await db.prescriptions.update_one(
        {"_id": ObjectId(prescription_id)},
        {"$push": {"refill_requests": refill_request}}
    )

    # Decrypt for notification text
    decrypt_dict_fields(prescription, _FIELD_TYPES)

    # Notify provider about refill request
    patient = await db.users.find_one({"_id": ObjectId(patient_id)})
    patient_name = f"{patient['first_name']} {patient['last_name']}" if patient else "A patient"
    await create_notification(
        user_id=prescription["provider_id"],
        title="Refill Request",
        message=f"{patient_name} requested a refill for {prescription['medication_name']}",
        notif_type="prescription",
    )

    return {"message": "Refill request submitted successfully", "refill_request": refill_request}


async def review_refill(prescription_id: str, refill_id: str, provider_id: str, action: str, notes: Optional[str] = None):
    """Provider approves or denies a refill request"""
    db = Database.get_db()

    if action not in ["approved", "denied"]:
        raise HTTPException(status_code=400, detail="Action must be 'approved' or 'denied'")

    prescription = await db.prescriptions.find_one({"_id": ObjectId(prescription_id)})
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    if prescription["provider_id"] != provider_id:
        raise HTTPException(status_code=403, detail="Not authorized to review this prescription")

    # Find the refill request
    refill = next((r for r in prescription["refill_requests"] if r["id"] == refill_id), None)
    if not refill:
        raise HTTPException(status_code=404, detail="Refill request not found")

    if refill["status"] != "pending":
        raise HTTPException(status_code=400, detail="Refill request already reviewed")

    # Update the refill request status
    await db.prescriptions.update_one(
        {"_id": ObjectId(prescription_id), "refill_requests.id": refill_id},
        {"$set": {
            "refill_requests.$.status": action,
            "refill_requests.$.reviewed_at": datetime.utcnow(),
            "refill_requests.$.notes": notes,
            "updated_at": datetime.utcnow(),
        }}
    )

    # If approved, increment refills used
    if action == "approved":
        await db.prescriptions.update_one(
            {"_id": ObjectId(prescription_id)},
            {"$inc": {"refills_used": 1}}
        )

    # Decrypt for notification/audit text
    decrypt_dict_fields(prescription, _FIELD_TYPES)

    # Notify patient about refill decision
    status_text = "approved" if action == "approved" else "denied"
    await create_notification(
        user_id=prescription["patient_id"],
        title=f"Refill {status_text.capitalize()}",
        message=f"Your refill request for {prescription['medication_name']} has been {status_text}",
        notif_type="prescription",
    )

    await AuditLogger.log_provider_access(
        provider_id=provider_id,
        patient_id=prescription["patient_id"],
        action="PROVIDER_REVIEW_REFILL",
        details={"prescription_id": prescription_id, "refill_id": refill_id, "decision": action, "medication": prescription["medication_name"]},
    )

    return {"message": f"Refill request {action} successfully"}