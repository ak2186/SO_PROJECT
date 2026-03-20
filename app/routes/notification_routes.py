"""
Notification Routes
API endpoints for user notifications
"""

from fastapi import APIRouter, Depends, Query
from app.middleware.auth_middleware import get_current_user_token
from app.controllers.notification_controller import (
    get_user_notifications,
    mark_notification_read,
    mark_all_read,
)

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("")
async def read_notifications(
    unread_only: bool = Query(False),
    current_user=Depends(get_current_user_token),
):
    """Get current user's notifications."""
    return await get_user_notifications(current_user.user_id, unread_only)


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
