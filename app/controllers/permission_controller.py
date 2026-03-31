from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
from app.config.database import Database


async def create_permission_request(patient_id: str, provider_id: str, appointment_id: str):
    """Called when a provider confirms an appointment. Creates a pending permission request if one doesn't already exist."""
    db = Database.get_db()
    existing = await db.permissions.find_one({
        "patient_id": patient_id,
        "provider_id": provider_id,
        "status": {"$in": ["pending", "granted"]},
    })
    if existing:
        return
    await db.permissions.insert_one({
        "patient_id": patient_id,
        "provider_id": provider_id,
        "appointment_id": appointment_id,
        "status": "pending",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })


async def respond_to_permission(permission_id: str, patient_id: str, action: str):
    """Patient calls this with action='granted' or action='denied'."""
    db = Database.get_db()
    if action not in ("granted", "denied"):
        raise HTTPException(status_code=400, detail="Action must be 'granted' or 'denied'")
    perm = await db.permissions.find_one({
        "_id": ObjectId(permission_id),
        "patient_id": patient_id,
    })
    if not perm:
        raise HTTPException(status_code=404, detail="Permission request not found")
    if perm["status"] != "pending":
        raise HTTPException(status_code=400, detail="Permission already responded to")
    await db.permissions.update_one(
        {"_id": ObjectId(permission_id)},
        {"$set": {"status": action, "updated_at": datetime.utcnow()}},
    )
    if action == "granted":
        from app.controllers.notification_controller import create_notification
        patient = await db.users.find_one({"_id": ObjectId(patient_id)})
        patient_name = f"{patient['first_name']} {patient['last_name']}" if patient else "A patient"
        await create_notification(
            user_id=perm["provider_id"],
            title="Health Data Access Granted",
            message=f"{patient_name} has granted you access to their health data.",
            notif_type="general",
        )
    return {"message": f"Permission {action}"}


async def get_patient_permissions(patient_id: str):
    """Returns all PENDING permission requests for a patient, enriched with provider info."""
    db = Database.get_db()
    cursor = db.permissions.find({"patient_id": patient_id, "status": "pending"}).sort("created_at", -1)
    perms = await cursor.to_list(length=50)
    result = []
    for p in perms:
        p["id"] = str(p.pop("_id"))
        provider = await db.users.find_one(
            {"_id": ObjectId(p["provider_id"])},
            {"first_name": 1, "last_name": 1, "specialty": 1},
        )
        if provider:
            p["provider_name"] = f"Dr. {provider['first_name']} {provider['last_name']}"
            p["provider_specialty"] = provider.get("specialty", "")
        result.append(p)
    return result


async def get_provider_patients(provider_id: str):
    """Returns all patients who have GRANTED access to a provider."""
    db = Database.get_db()
    cursor = db.permissions.find({"provider_id": provider_id, "status": "granted"}).sort("updated_at", -1)
    perms = await cursor.to_list(length=200)
    result = []
    for p in perms:
        patient = await db.users.find_one(
            {"_id": ObjectId(p["patient_id"])},
            {"hashed_password": 0},
        )
        if patient:
            patient["_id"] = str(patient["_id"])
            patient["permission_id"] = str(p["_id"])
            result.append(patient)
    return {"patients": result}


async def check_provider_has_permission(provider_id: str, patient_id: str) -> bool:
    """Returns True if provider has a granted permission for this patient."""
    db = Database.get_db()
    perm = await db.permissions.find_one({
        "provider_id": provider_id,
        "patient_id": patient_id,
        "status": "granted",
    })
    return perm is not None
