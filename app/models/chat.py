"""
Chat Model
Defines the structure of chat messages in MongoDB
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ChatMessage(BaseModel):
    """A single chat message"""
    role: str  # user or assistant
    content: str
    timestamp: datetime = None


class ChatRequest(BaseModel):
    """Incoming chat request from user"""
    message: str


class ChatResponse(BaseModel):
    """Response from chatbot"""
    reply: str
    timestamp: datetime