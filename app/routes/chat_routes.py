"""
Chat Routes
API endpoints for chatbot
"""

from fastapi import APIRouter, Depends, Query
from app.models.chat import ChatRequest
from app.middleware.auth_middleware import get_current_user_token, require_role
from app.controllers.chat_controller import send_message, get_chat_history, clear_chat_history

router = APIRouter(prefix="/api/chat", tags=["Chatbot"])


@router.post("")
async def chat(
    body: ChatRequest,
    current_user=Depends(get_current_user_token),
):
    require_role(current_user, ["patient"])
    return await send_message(current_user.user_id, body.message)


@router.get("/history")
async def history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user_token),
):
    require_role(current_user, ["patient"])
    return await get_chat_history(current_user.user_id, page, limit)


@router.delete("/history")
async def clear_history(
    current_user=Depends(get_current_user_token),
):
    require_role(current_user, ["patient"])
    return await clear_chat_history(current_user.user_id)