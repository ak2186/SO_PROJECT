from datetime import datetime
from typing import Optional
from app.config.database import get_database
from bson import ObjectId
from fastapi import HTTPException
from app.utils.audit_logger import AuditLogger
from app.utils.encryption import decrypt_dict_fields

_RX_FIELD_TYPES = {
    "medication_name": str, "dosage": str, "frequency": str, "duration": str, "notes": str,
}

async def get_audit_logs(
    page: int = 1,
    limit: int = 20,
    action: Optional[str] = None,
    user_id: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
):
    db = await get_database()
    query = {}

    if action:
        query["action"] = action
    if user_id:
        query["user_id"] = user_id
    if date_from or date_to:
        query["timestamp"] = {}
        if date_from:
            query["timestamp"]["$gte"] = date_from
        if date_to:
            query["timestamp"]["$lte"] = date_to

    skip = (page - 1) * limit
    total = await db.audit_logs.count_documents(query)
    cursor = db.audit_logs.find(query).sort("timestamp", -1).skip(skip).limit(limit)
    logs = await cursor.to_list(length=limit)

    # Convert ObjectId to string
    for log in logs:
        log["_id"] = str(log["_id"])

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "logs": logs,
    }

async def get_all_users(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    role: Optional[str] = None,
):
    db = await get_database()
    query = {}

    if search:
        query["$or"] = [
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    if role:
        query["role"] = role

    skip = (page - 1) * limit
    total = await db.users.count_documents(query)
    cursor = db.users.find(query, {"hashed_password": 0}).sort("created_at", -1).skip(skip).limit(limit)
    users = await cursor.to_list(length=limit)

    for user in users:
        user["_id"] = str(user["_id"])

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "users": users,
    }

async def delete_user(user_id: str, current_admin_id: str):
    db = await get_database()

    # Prevent admin from deleting themselves
    if user_id == current_admin_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.users.delete_one({"_id": ObjectId(user_id)})

    await AuditLogger.log_admin_action(
        admin_id=current_admin_id,
        action="ADMIN_DELETE_USER",
        target_user_id=user_id,
        details={"deleted_email": user["email"], "deleted_role": user.get("role")},
    )

    return {"message": f"User {user['email']} deleted successfully"}


async def update_user_role(user_id: str, new_role: str):
    db = await get_database()

    if new_role not in ["patient", "provider", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be patient, provider, or admin")

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_role = user.get("role")
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": new_role, "updated_at": datetime.utcnow()}}
    )

    await AuditLogger.log_admin_action(
        admin_id="system",
        action="ADMIN_CHANGE_ROLE",
        target_user_id=user_id,
        details={"email": user["email"], "old_role": old_role, "new_role": new_role},
    )

    return {"message": f"User {user['email']} role updated to {new_role}"}

async def get_all_appointments(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
):
    """Admin: get all appointments across all providers/patients"""
    db = await get_database()
    query = {}
    if status:
        query["status"] = status

    skip = (page - 1) * limit
    total = await db.appointments.count_documents(query)
    cursor = db.appointments.find(query).sort("appointment_date", -1).skip(skip).limit(limit)
    appointments = await cursor.to_list(length=limit)

    for a in appointments:
        a["_id"] = str(a["_id"])
        provider = await db.users.find_one({"_id": ObjectId(a["provider_id"])})
        if provider:
            a["provider_name"] = f"{provider['first_name']} {provider['last_name']}"
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


async def get_all_prescriptions(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
):
    """Admin: get all prescriptions across all providers/patients"""
    db = await get_database()
    query = {}
    if status:
        query["status"] = status

    skip = (page - 1) * limit
    total = await db.prescriptions.count_documents(query)
    cursor = db.prescriptions.find(query).sort("created_at", -1).skip(skip).limit(limit)
    prescriptions = await cursor.to_list(length=limit)

    for p in prescriptions:
        decrypt_dict_fields(p, _RX_FIELD_TYPES)
        p["_id"] = str(p["_id"])
        # Resolve provider name (skip for self-added medications)
        if p.get("provider_id") == "self" or p.get("source") == "self":
            p["provider_name"] = "Self-added"
        else:
            try:
                provider = await db.users.find_one({"_id": ObjectId(p["provider_id"])})
                if provider:
                    p["provider_name"] = f"{provider['first_name']} {provider['last_name']}"
            except Exception:
                p["provider_name"] = "Unknown"
        try:
            patient = await db.users.find_one({"_id": ObjectId(p["patient_id"])})
            if patient:
                p["patient_name"] = f"{patient['first_name']} {patient['last_name']}"
        except Exception:
            p["patient_name"] = "Unknown"

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "prescriptions": prescriptions,
    }


async def create_provider(user_data: dict):
    db = await get_database()

    # Check if email already exists
    existing = await db.users.find_one({"email": user_data["email"]})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    from app.utils.password import hash_password
    hashed_password = hash_password(user_data["password"])

    provider = {
        "email": user_data["email"],
        "first_name": user_data["first_name"],
        "last_name": user_data["last_name"],
        "hashed_password": hashed_password,
        "role": "provider",
        "status": "active",
        "age": user_data.get("age"),
        "gender": user_data.get("gender"),
        "specialty": user_data.get("specialty"),
        "available_hours": user_data.get("available_hours"),
        "working_days": user_data.get("working_days"),
        "health_conditions": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await db.users.insert_one(provider)
    provider["_id"] = str(result.inserted_id)
    del provider["hashed_password"]

    await AuditLogger.log_admin_action(
        admin_id="system",
        action="ADMIN_CREATE_PROVIDER",
        target_user_id=str(result.inserted_id),
        details={"email": provider["email"], "name": f"{provider['first_name']} {provider['last_name']}"},
    )

    return {"message": "Provider account created successfully", "provider": provider}