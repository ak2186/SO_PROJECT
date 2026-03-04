"""
Google Fit Routes
Handles OAuth flow and data sync
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from app.middleware.auth_middleware import get_current_user_token
from app.controllers.googlefit_controller import (
    get_auth_url, handle_callback, sync_googlefit_data
)

router = APIRouter(prefix="/api/googlefit", tags=["Google Fit"])


@router.get("/connect")
async def connect_google_fit(current_user=Depends(get_current_user_token)):
    """Step 1: Redirect user to Google login"""
    url = get_auth_url(current_user.user_id)
    return {"auth_url": url}


@router.get("/callback")
async def google_fit_callback(code: str, state: str):
    """Step 2: Google redirects back here with auth code"""
    return await handle_callback(code, state)


@router.post("/sync")
async def sync_data(current_user=Depends(get_current_user_token)):
    """Step 3: Pull latest data from Google Fit"""
    return await sync_googlefit_data(current_user.user_id)