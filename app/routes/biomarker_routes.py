"""
Biomarker Routes
API endpoints for health data
"""

from fastapi import APIRouter, Depends, Query
from datetime import datetime
from typing import Optional
from app.models.biomarker import BiomarkerCreate
from app.middleware.auth_middleware import get_current_user_token, require_role
from app.controllers.biomarker_controller import (
    record_biomarker, get_current_readings, get_biomarker_history, get_alerts
)

router = APIRouter(prefix="/api/biomarkers", tags=["Biomarkers"])


@router.post("")
async def create_biomarker(
    data: BiomarkerCreate,
    current_user=Depends(get_current_user_token),
):
    require_role(current_user, ["patient", "admin"])
    return await record_biomarker(current_user.user_id, data)


@router.get("/current")
async def current_readings(
    current_user=Depends(get_current_user_token),
):
    require_role(current_user, ["patient", "admin", "provider"])
    return await get_current_readings(current_user.user_id)


@router.get("/history")
async def biomarker_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user=Depends(get_current_user_token),
):
    require_role(current_user, ["patient", "admin", "provider"])
    return await get_biomarker_history(current_user.user_id, page, limit, date_from, date_to)


@router.get("/alerts")
async def biomarker_alerts(
    current_user=Depends(get_current_user_token),
):
    require_role(current_user, ["patient", "admin", "provider"])
    return await get_alerts(current_user.user_id)