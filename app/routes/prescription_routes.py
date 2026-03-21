"""
Prescription Routes
API endpoints for prescription management
"""

from fastapi import APIRouter, Depends, Query
from typing import Optional
from pydantic import BaseModel
from app.models.prescription import PrescriptionCreate, SelfPrescriptionCreate
from app.middleware.auth_middleware import get_current_user_token, require_role
from app.controllers.prescription_controller import (
    create_prescription, create_self_prescription, get_patient_prescriptions,
    get_provider_prescriptions, request_refill, review_refill
)

router = APIRouter(prefix="/api/prescriptions", tags=["Prescriptions"])


class RefillRequestBody(BaseModel):
    notes: Optional[str] = None


class ReviewRefillBody(BaseModel):
    action: str  # approved or denied
    notes: Optional[str] = None


@router.post("")
async def new_prescription(
    data: PrescriptionCreate,
    current_user=Depends(get_current_user_token),
):
    require_role(current_user, ["provider"])
    return await create_prescription(current_user.user_id, data)


@router.post("/self")
async def add_self_prescription(
    data: SelfPrescriptionCreate,
    current_user=Depends(get_current_user_token),
):
    """Patient adds their own existing medication"""
    require_role(current_user, ["patient"])
    return await create_self_prescription(current_user.user_id, data)


@router.get("/my")
async def my_prescriptions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    current_user=Depends(get_current_user_token),
):
    require_role(current_user, ["patient"])
    return await get_patient_prescriptions(current_user.user_id, page, limit, status)


@router.get("/provider")
async def provider_prescriptions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    current_user=Depends(get_current_user_token),
):
    require_role(current_user, ["provider"])
    return await get_provider_prescriptions(current_user.user_id, page, limit, status)


@router.post("/{prescription_id}/refill")
async def refill_request(
    prescription_id: str,
    body: RefillRequestBody,
    current_user=Depends(get_current_user_token),
):
    require_role(current_user, ["patient"])
    return await request_refill(prescription_id, current_user.user_id, body.notes)


@router.patch("/{prescription_id}/refill/{refill_id}")
async def review_refill_request(
    prescription_id: str,
    refill_id: str,
    body: ReviewRefillBody,
    current_user=Depends(get_current_user_token),
):
    require_role(current_user, ["provider"])
    return await review_refill(prescription_id, refill_id, current_user.user_id, body.action, body.notes)