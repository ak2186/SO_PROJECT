"""
Google Fit Controller
Handles OAuth2 flow and data fetching
"""

from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from app.config.settings import settings
from app.config.database import Database
from app.controllers.biomarker_controller import record_biomarker
from app.models.biomarker import BiomarkerCreate
from fastapi import HTTPException
from datetime import datetime, timedelta
from bson import ObjectId
import json


SCOPES = [
    "https://www.googleapis.com/auth/fitness.heart_rate.read",
    "https://www.googleapis.com/auth/fitness.oxygen_saturation.read",
    "https://www.googleapis.com/auth/fitness.activity.read",
    "https://www.googleapis.com/auth/fitness.body.read",
]


def get_flow():
    """Create OAuth2 flow"""
    return Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_FIT_CLIENT_ID,
                "client_secret": settings.GOOGLE_FIT_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.GOOGLE_FIT_REDIRECT_URI],
            }
        },
        scopes=SCOPES,
        redirect_uri=settings.GOOGLE_FIT_REDIRECT_URI,
    )


def get_auth_url(user_id: str) -> str:
    """Generate Google OAuth URL"""
    flow = get_flow()
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        state=user_id,  # Pass user_id as state so we know who's connecting
        prompt="consent"
    )
    return auth_url


async def handle_callback(code: str, state: str):
    """Exchange auth code for tokens and save them"""
    db = Database.get_db()

    try:
        flow = get_flow()
        flow.fetch_token(code=code)
        credentials = flow.credentials

        # Save tokens to database
        await db.googlefit_tokens.update_one(
            {"user_id": state},
            {"$set": {
                "user_id": state,
                "token": credentials.token,
                "refresh_token": credentials.refresh_token,
                "token_uri": credentials.token_uri,
                "client_id": credentials.client_id,
                "client_secret": credentials.client_secret,
                "scopes": list(credentials.scopes),
                "connected_at": datetime.utcnow(),
            }},
            upsert=True
        )

        return {"message": "Google Fit connected successfully! You can now sync your data."}

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to connect Google Fit: {str(e)}")


async def get_credentials(user_id: str) -> Credentials:
    """Get stored credentials for a user"""
    db = Database.get_db()

    token_doc = await db.googlefit_tokens.find_one({"user_id": user_id})
    if not token_doc:
        raise HTTPException(
            status_code=400,
            detail="Google Fit not connected. Please connect first via /api/googlefit/connect"
        )

    return Credentials(
        token=token_doc["token"],
        refresh_token=token_doc["refresh_token"],
        token_uri=token_doc["token_uri"],
        client_id=token_doc["client_id"],
        client_secret=token_doc["client_secret"],
        scopes=token_doc["scopes"],
    )


async def sync_googlefit_data(user_id: str):
    """Pull last 24 hours of data from Google Fit and save as biomarkers"""
    credentials = await get_credentials(user_id)

    # Build the Google Fit service
    service = build("fitness", "v1", credentials=credentials)

    # Time range: last 24 hours in nanoseconds
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=24)
    start_ns = int(start_time.timestamp() * 1e9)
    end_ns = int(end_time.timestamp() * 1e9)

    biomarker_data = {}

    # Data source IDs
    data_types = {
        "heart_rate": "derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm",
        "spo2": "derived:com.google.oxygen_saturation:com.google.android.gms:merged",
        "steps": "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps",
        "calories": "derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended",
    }

    for field, data_source in data_types.items():
        try:
            dataset = f"{start_ns}-{end_ns}"
            result = service.users().dataSources().datasets().get(
                userId="me",
                dataSourceId=data_source,
                datasetId=dataset
            ).execute()

            points = result.get("point", [])
            if points:
                # Get the most recent value
                latest = points[-1]
                value = latest["value"][0]
                if field == "steps":
                    biomarker_data[field] = int(value.get("intVal", 0))
                else:
                    biomarker_data[field] = round(float(value.get("fpVal", 0)), 2)

        except Exception:
            # Skip if data type not available
            continue

    if not biomarker_data:
        return {"message": "No data found in Google Fit for the last 24 hours"}

    # Save as biomarker
    biomarker = BiomarkerCreate(**biomarker_data)
    result = await record_biomarker(user_id, biomarker)

    return {
        "message": "Google Fit data synced successfully",
        "synced_data": biomarker_data,
        "alerts": result.get("alerts", [])
    }