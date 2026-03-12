"""
Appointment Routes
API endpoints for appointment management
"""

from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.models.appointment import AppointmentCreate
from app.middleware.auth_middleware import get_current_user_token, require_role
from app.controllers.appointment_controller import (
    create_appointment, get_patient_appointments,
    get_provider_appointments, cancel_appointment, confirm_appointment,
    list_providers
)

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])


@router.get("/providers")
async def get_providers(
    current_user=Depends(get_current_user_token),
):
    """List all available providers for booking"""
    require_role(current_user, ["patient"])
    return await list_providers()


@router.post("")
async def book_appointment(
    data: AppointmentCreate,
    current_user=Depends(get_current_user_token),
):
    require_role(current_user, ["patient"])
    return await create_appointment(current_user.user_id, data)


@router.get("/my")
async def my_appointments(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    current_user=Depends(get_current_user_token),
):
    require_role(current_user, ["patient"])
    return await get_patient_appointments(current_user.user_id, page, limit, status)


@router.get("/provider")
async def provider_appointments(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    current_user=Depends(get_current_user_token),
):
    require_role(current_user, ["provider"])
    return await get_provider_appointments(current_user.user_id, page, limit, status)


@router.patch("/{appointment_id}/cancel")
async def cancel(
    appointment_id: str,
    current_user=Depends(get_current_user_token),
):
    require_role(current_user, ["patient", "provider", "admin"])
    return await cancel_appointment(appointment_id, current_user.user_id, current_user.role)


@router.patch("/{appointment_id}/confirm")
async def confirm(
    appointment_id: str,
    current_user=Depends(get_current_user_token),
):
    require_role(current_user, ["provider"])
    return await confirm_appointment(appointment_id, current_user.user_id)