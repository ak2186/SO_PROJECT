from datetime import datetime
from typing import Optional
from app.config.database import get_database
from bson import ObjectId
from fastapi import HTTPException
from datetime import datetime

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
    return {"message": f"User {user['email']} deleted successfully"}


async def update_user_role(user_id: str, new_role: str):
    db = await get_database()

    if new_role not in ["patient", "provider", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be patient, provider, or admin")

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": new_role, "updated_at": datetime.utcnow()}}
    )

    return {"message": f"User {user['email']} role updated to {new_role}"}

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
        "health_conditions": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await db.users.insert_one(provider)
    provider["_id"] = str(result.inserted_id)
    del provider["hashed_password"]

    return {"message": "Provider account created successfully", "provider": provider}