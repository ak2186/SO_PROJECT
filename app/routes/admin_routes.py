from fastapi import APIRouter, Depends, Query
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.middleware.auth_middleware import get_current_user_token, require_role
from app.controllers.admin_controller import get_audit_logs, get_all_users, delete_user, update_user_role, create_provider

router = APIRouter(prefix="/api/admin", tags=["Admin"])

class CreateProviderRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    age: Optional[int] = None
    gender: Optional[str] = None

@router.get("/audit-logs")
async def read_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    action: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user=Depends(get_current_user_token),
):
    require_role(current_user, ["admin"])
    return await get_audit_logs(page, limit, action, user_id, date_from, date_to)

@router.get("/users")
async def read_all_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    current_user=Depends(get_current_user_token),
):
    require_role(current_user, ["admin"])
    return await get_all_users(page, limit, search, role)

@router.delete("/users/{user_id}")
async def remove_user(
    user_id: str,
    current_user=Depends(get_current_user_token),
):
    require_role(current_user, ["admin"])
    return await delete_user(user_id, current_user.user_id)


@router.patch("/users/{user_id}/role")
async def change_user_role(
    user_id: str,
    new_role: str = Query(...),
    current_user=Depends(get_current_user_token),
):
    require_role(current_user, ["admin"])
    return await update_user_role(user_id, new_role)

@router.post("/users/provider")
async def create_provider_account(
    provider_data: CreateProviderRequest,
    current_user=Depends(get_current_user_token),
):
    require_role(current_user, ["admin"])
    return await create_provider(provider_data.model_dump())