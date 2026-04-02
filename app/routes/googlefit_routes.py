"""
Google Fit Routes
Handles OAuth flow and data sync
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse, HTMLResponse
from app.middleware.auth_middleware import get_current_user_token
from app.controllers.googlefit_controller import (
    get_auth_url, handle_callback, sync_googlefit_data, get_today_timeseries, get_week_summary
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
    result = await handle_callback(code, state)
    # Return an HTML page that notifies the opener and closes the popup
    html = """
    <!DOCTYPE html>
    <html>
    <head><title>Google Fit Connected</title></head>
    <body style="background:#060d1a;color:#f1f5f9;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <div style="text-align:center;">
            <div style="font-size:48px;margin-bottom:16px;">✅</div>
            <h2>Google Fit Connected!</h2>
            <p style="color:#64748b;">You can close this window and click "Sync Now" in Settings.</p>
        </div>
        <script>
            if (window.opener) {
                window.opener.postMessage({ type: 'GFIT_CONNECTED' }, '*');
            }
            setTimeout(() => window.close(), 2000);
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html)


@router.post("/sync")
async def sync_data(
    tz_offset: int = Query(0, description="Browser timezone offset in minutes (e.g. -330 for IST)"),
    current_user=Depends(get_current_user_token),
):
    """Step 3: Pull latest data from Google Fit"""
    return await sync_googlefit_data(current_user.user_id, tz_offset)


@router.get("/today")
async def today_data(
    tz_offset: int = Query(0, description="Browser timezone offset in minutes"),
    current_user=Depends(get_current_user_token),
):
    """Get today's full timeseries data (from last sync)"""
    return await get_today_timeseries(current_user.user_id, tz_offset)


@router.get("/week")
async def week_data(
    tz_offset: int = Query(0, description="Browser timezone offset in minutes"),
    current_user=Depends(get_current_user_token),
):
    """Get past 7 days summary (daily averages/totals)"""
    return await get_week_summary(current_user.user_id, tz_offset)