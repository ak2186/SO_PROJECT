"""
Biomarker Routes
API endpoints for health data
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from datetime import datetime
from typing import Optional
from app.models.biomarker import BiomarkerCreate
from app.middleware.auth_middleware import get_current_user_token, require_role
from app.controllers.biomarker_controller import (
    record_biomarker, get_current_readings, get_biomarker_history, get_alerts,
    get_patient_data_for_provider,
)
from app.controllers.pdf_controller import generate_health_report
from app.utils.audit_logger import AuditLogger

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


@router.get("/report/pdf")
async def get_health_report_pdf(current_user=Depends(get_current_user_token)):
    """Patient: generate their own health report PDF"""
    return await generate_health_report(current_user.user_id)


@router.get("/report/pdf/{patient_id}")
async def get_patient_report_pdf(
    patient_id: str,
    current_user=Depends(get_current_user_token),
):
    """Provider: generate a patient's health report PDF (requires granted permission)"""
    require_role(current_user, ["provider"])
    from app.controllers.permission_controller import check_provider_has_permission
    has_perm = await check_provider_has_permission(current_user.user_id, patient_id)
    if not has_perm:
        raise HTTPException(status_code=403, detail="Permission not granted")
    await AuditLogger.log_provider_access(
        provider_id=current_user.user_id,
        patient_id=patient_id,
        action="PROVIDER_GENERATE_REPORT",
    )
    return await generate_health_report(patient_id)


@router.get("/patient/{patient_id}")
async def provider_patient_biomarkers(
    patient_id: str,
    current_user=Depends(get_current_user_token),
):
    require_role(current_user, ["provider"])
    await AuditLogger.log_provider_access(
        provider_id=current_user.user_id,
        patient_id=patient_id,
        action="PROVIDER_VIEW_PATIENT_DATA",
    )
    return await get_patient_data_for_provider(current_user.user_id, patient_id)