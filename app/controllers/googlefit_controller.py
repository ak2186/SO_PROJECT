"""
Google Fit Controller
Handles OAuth2 flow and data fetching
"""

from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from app.config.settings import settings
from app.config.database import Database
from app.controllers.biomarker_controller import record_biomarker, check_alerts
from app.models.biomarker import BiomarkerCreate
from fastapi import HTTPException
from datetime import datetime, timedelta
from bson import ObjectId
import json
import logging
import calendar
import time

logger = logging.getLogger(__name__)


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
    """Get stored credentials for a user, refreshing the token if expired"""
    db = Database.get_db()

    token_doc = await db.googlefit_tokens.find_one({"user_id": user_id})
    if not token_doc:
        raise HTTPException(
            status_code=400,
            detail="Google Fit not connected. Please connect first via /api/googlefit/connect"
        )

    creds = Credentials(
        token=token_doc["token"],
        refresh_token=token_doc.get("refresh_token"),
        token_uri=token_doc["token_uri"],
        client_id=token_doc["client_id"],
        client_secret=token_doc["client_secret"],
        scopes=token_doc["scopes"],
    )

    # Force-refresh the access token using the refresh token
    if creds.refresh_token:
        try:
            creds.refresh(Request())
            # Persist the new access token so subsequent calls don't need to refresh again
            await db.googlefit_tokens.update_one(
                {"user_id": user_id},
                {"$set": {
                    "token": creds.token,
                    "refreshed_at": datetime.utcnow(),
                }}
            )
            logger.info(f"Refreshed Google token for user {user_id}")
        except Exception as e:
            logger.error(f"Failed to refresh Google token for user {user_id}: {e}")
            raise HTTPException(
                status_code=401,
                detail="Google Fit session expired. Please reconnect in Settings → Integrations."
            )

    return creds


async def sync_googlefit_data(user_id: str, tz_offset: int = 0):
    """
    Pull today's data from Google Fit and save as biomarkers.
    tz_offset: browser's getTimezoneOffset() in minutes (e.g. -330 for IST).
    JavaScript returns negative for east-of-UTC, so local = UTC - offset.
    """
    credentials = await get_credentials(user_id)

    # Build the Google Fit service
    service = build("fitness", "v1", credentials=credentials)

    # Convert browser tz_offset (minutes) to a timedelta
    # JS getTimezoneOffset() returns minutes *behind* UTC (IST = -330)
    # So local_time = utc_time - timedelta(minutes=tz_offset)
    tz_delta = timedelta(minutes=-tz_offset)  # negate: -(-330) = +330min = +5:30

    now_utc = datetime.utcnow()
    now_local = now_utc + tz_delta

    # Local midnight today in UTC  (this matches what the Google Fit app uses)
    local_midnight = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
    local_midnight_utc = local_midnight - tz_delta

    # CRITICAL: use calendar.timegm() for UTC timestamps, NOT .timestamp()
    # .timestamp() on naive datetime assumes SERVER's local timezone which is WRONG
    local_midnight_ns = int(calendar.timegm(local_midnight_utc.timetuple()) * 1e9)
    now_ns = int(time.time() * 1e9)  # time.time() is always UTC

    logger.info(
        f"[GoogleFit] tz_offset={tz_offset}min, "
        f"local_midnight={local_midnight.isoformat()}, "
        f"local_midnight_utc={local_midnight_utc.isoformat()}, "
        f"now_local={now_local.isoformat()}"
    )

    biomarker_data = {}
    sync_errors = []
    timeseries = {}  # full arrays for Vitals charts

    # Data source IDs
    data_types = {
        "heart_rate": "derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm",
        "spo2": "derived:com.google.oxygen_saturation:com.google.android.gms:merged",
        "steps": "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps",
        "calories": "derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended",
    }

    # Fields where we SUM all datapoints (delta / cumulative metrics)
    SUM_FIELDS = {"steps", "calories"}

    for field, data_source in data_types.items():
        try:
            # All data types use the same local-today window
            start_ns = local_midnight_ns
            dataset = f"{start_ns}-{now_ns}"

            result = service.users().dataSources().datasets().get(
                userId="me",
                dataSourceId=data_source,
                datasetId=dataset
            ).execute()

            points = result.get("point", [])
            logger.info(f"[GoogleFit] {field}: {len(points)} datapoints")

            if points:
                if field in SUM_FIELDS:
                    # Steps / Calories: sum ALL delta values across the window
                    total = 0
                    hourly = {}  # for hourly breakdown
                    for pt in points:
                        val = pt["value"][0]
                        amount = int(val.get("intVal", 0)) or int(float(val.get("fpVal", 0)))
                        total += amount
                        # Bucket into hours using LOCAL time for charts
                        ts_ns = int(pt.get("startTimeNanos", 0))
                        ts_utc = datetime.utcfromtimestamp(ts_ns / 1e9)
                        ts_local = ts_utc + tz_delta
                        hour_key = ts_local.strftime("%H:00")
                        hourly[hour_key] = hourly.get(hour_key, 0) + amount
                    biomarker_data[field] = total
                    timeseries[field] = [
                        {"t": k, "v": v} for k, v in sorted(hourly.items())
                    ]
                else:
                    # Heart rate / SpO2: keep ALL readings for timeseries, pick latest for summary
                    readings = []
                    for pt in points:
                        ts_ns = int(pt.get("startTimeNanos", 0))
                        ts_utc = datetime.utcfromtimestamp(ts_ns / 1e9)
                        ts_local = ts_utc + tz_delta
                        val = round(float(pt["value"][0].get("fpVal", 0)), 2)
                        readings.append({"t": ts_local.strftime("%Y-%m-%dT%H:%M:%S"), "v": val})
                    # Sort by timestamp ascending for charts
                    readings.sort(key=lambda r: r["t"])
                    timeseries[field] = readings
                    # Latest value = last reading after sorting
                    biomarker_data[field] = readings[-1]["v"]

        except Exception as e:
            logger.warning(f"[GoogleFit] Failed to fetch {field}: {e}")
            sync_errors.append(f"{field}: {str(e)}")
            continue

    logger.info(f"[GoogleFit] Synced data for user {user_id}: {biomarker_data}")
    if sync_errors:
        logger.warning(f"[GoogleFit] Errors for user {user_id}: {sync_errors}")

    if not biomarker_data:
        return {
            "message": "No data found in Google Fit",
            "synced_data": {},
            "timeseries": {},
            "errors": sync_errors,
        }

    # Upsert today's Google Fit record so repeated syncs UPDATE instead of creating duplicates
    db = Database.get_db()
    today_key = local_midnight.strftime("%Y-%m-%d")
    alerts = check_alerts(biomarker_data)

    update_fields = {
        **biomarker_data,
        "user_id": user_id,
        "recorded_at": now_utc,
        "source": "googlefit",
        "sync_date": today_key,
        "alerts": alerts,
        "timeseries": timeseries,  # store full arrays for the Vitals page
    }

    await db.biomarkers.update_one(
        {"user_id": user_id, "source": "googlefit", "sync_date": today_key},
        {"$set": update_fields},
        upsert=True,
    )

    return {
        "message": "Google Fit data synced successfully",
        "synced_data": biomarker_data,
        "timeseries": timeseries,
        "alerts": alerts,
        "errors": sync_errors,
    }


async def get_today_timeseries(user_id: str, tz_offset: int = 0):
    """Return the stored timeseries data for today (from last sync)"""
    db = Database.get_db()
    # Use the user's local date, not UTC date
    tz_delta = timedelta(minutes=-tz_offset)
    now_local = datetime.utcnow() + tz_delta
    today_key = now_local.strftime("%Y-%m-%d")

    doc = await db.biomarkers.find_one(
        {"user_id": user_id, "source": "googlefit", "sync_date": today_key}
    )
    if not doc:
        return {"timeseries": {}, "synced_data": {}, "synced_at": None}

    return {
        "timeseries": doc.get("timeseries", {}),
        "synced_data": {
            k: doc[k] for k in ["heart_rate", "spo2", "steps", "calories"]
            if k in doc
        },
        "synced_at": doc.get("recorded_at", "").isoformat() if doc.get("recorded_at") else None,
    }