from fastapi import APIRouter, Depends, Query
from app.middleware.auth_middleware import get_current_user_token, require_role
from app.controllers.permission_controller import (
    get_patient_permissions,
    respond_to_permission,
    get_provider_patients,
)

router = APIRouter(prefix="/api/permissions", tags=["Permissions"])


@router.get("/my")
async def get_my_permission_requests(current_user=Depends(get_current_user_token)):
    """Patient: get their pending permission requests."""
    require_role(current_user, ["patient"])
    return await get_patient_permissions(current_user.user_id)


@router.get("/patients")
async def get_permitted_patients(current_user=Depends(get_current_user_token)):
    """Provider: get all patients who granted them access."""
    require_role(current_user, ["provider"])
    return await get_provider_patients(current_user.user_id)


@router.patch("/{permission_id}")
async def respond(
    permission_id: str,
    action: str = Query(..., description="'granted' or 'denied'"),
    current_user=Depends(get_current_user_token),
):
    """Patient: respond to a permission request."""
    require_role(current_user, ["patient"])
    return await respond_to_permission(permission_id, current_user.user_id, action)
