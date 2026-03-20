"""
Notification Model
Defines the structure of notification documents in MongoDB
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class NotificationCreate(BaseModel):
    """Data for creating a notification"""
    user_id: str
    title: str
    message: str
    type: str = "general"  # general, appointment, prescription, goal, provider_message


class NotificationResponse(BaseModel):
    """Notification data returned in API responses"""
    id: str
    user_id: str
    title: str
    message: str
    type: str
    read: bool = False
    created_at: datetime
