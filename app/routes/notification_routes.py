"""
Notification Routes
API endpoints for user notifications
"""

from fastapi import APIRouter, Depends, Query
from app.middleware.auth_middleware import get_current_user_token
from pydantic import BaseModel
from typing import Optional
from app.controllers.notification_controller import (
    get_user_notifications,
    mark_notification_read,
    mark_all_read,
    create_notification,
)

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("")
async def read_notifications(
    unread_only: bool = Query(False),
    current_user=Depends(get_current_user_token),
):
    """Get current user's notifications."""
    notifs = await get_user_notifications(current_user.user_id, unread_only)
    return {"notifications": notifs}


class NotificationCreate(BaseModel):
    title: str
    message: str
    type: Optional[str] = "general"


@router.post("")
async def create_self_notification(
    data: NotificationCreate,
    current_user=Depends(get_current_user_token),
):
    """Create a notification for the current user (e.g. reminders)."""
    return await create_notification(
        user_id=current_user.user_id,
        title=data.title,
        message=data.message,
        notif_type=data.type,
    )


@router.patch("/read-all")
async def read_mark_all(
    current_user=Depends(get_current_user_token),
):
    """Mark all notifications as read."""
    return await mark_all_read(current_user.user_id)


@router.patch("/{notification_id}/read")
async def read_mark_notification(
    notification_id: str,
    current_user=Depends(get_current_user_token),
):
    """Mark a single notification as read."""
    return await mark_notification_read(notification_id, current_user.user_id)
