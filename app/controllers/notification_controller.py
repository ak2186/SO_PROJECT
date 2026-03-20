"""
Notification Controller
Handles notification CRUD operations
"""

from datetime import datetime
from typing import Optional
from bson import ObjectId
from app.config.database import Database


async def get_user_notifications(user_id: str, unread_only: bool = False):
    """Get notifications for a user."""
    db = Database.get_db()
    query = {"user_id": user_id}
    if unread_only:
        query["read"] = False

    cursor = db.notifications.find(query).sort("created_at", -1).limit(50)
    notifications = await cursor.to_list(length=50)

    for n in notifications:
        n["id"] = str(n["_id"])
        del n["_id"]

    return notifications


async def mark_notification_read(notification_id: str, user_id: str):
    """Mark a notification as read."""
    db = Database.get_db()
    result = await db.notifications.update_one(
        {"_id": ObjectId(notification_id), "user_id": user_id},
        {"$set": {"read": True}}
    )
    if result.modified_count == 0:
        return {"message": "Notification not found or already read"}
    return {"message": "Notification marked as read"}


async def mark_all_read(user_id: str):
    """Mark all notifications as read for a user."""
    db = Database.get_db()
    await db.notifications.update_many(
        {"user_id": user_id, "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All notifications marked as read"}


async def create_notification(user_id: str, title: str, message: str, notif_type: str = "general"):
    """Create a new notification for a user."""
    db = Database.get_db()
    doc = {
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": notif_type,
        "read": False,
        "created_at": datetime.utcnow(),
    }
    result = await db.notifications.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc
