"""
Biomarker Controller
Handles health data recording and retrieval
"""

from fastapi import HTTPException
from datetime import datetime
from typing import Optional
from bson import ObjectId
from app.config.database import Database
from app.models.biomarker import BiomarkerCreate


# Alert thresholds
ALERTS = {
    "heart_rate": {"low": 50, "high": 100, "msg_low": "Low heart rate detected", "msg_high": "High heart rate detected"},
    "spo2": {"low": 95, "msg_low": "Low blood oxygen detected"},
    "systolic_bp": {"high": 140, "msg_high": "High systolic blood pressure detected"},
    "diastolic_bp": {"high": 90, "msg_high": "High diastolic blood pressure detected"},
}


def check_alerts(data: dict) -> list:
    """Check biomarker values against alert thresholds"""
    triggered = []

    if data.get("heart_rate"):
        if data["heart_rate"] < ALERTS["heart_rate"]["low"]:
            triggered.append(ALERTS["heart_rate"]["msg_low"])
        elif data["heart_rate"] > ALERTS["heart_rate"]["high"]:
            triggered.append(ALERTS["heart_rate"]["msg_high"])

    if data.get("spo2") and data["spo2"] < ALERTS["spo2"]["low"]:
        triggered.append(ALERTS["spo2"]["msg_low"])

    if data.get("systolic_bp") and data["systolic_bp"] > ALERTS["systolic_bp"]["high"]:
        triggered.append(ALERTS["systolic_bp"]["msg_high"])

    if data.get("diastolic_bp") and data["diastolic_bp"] > ALERTS["diastolic_bp"]["high"]:
        triggered.append(ALERTS["diastolic_bp"]["msg_high"])

    return triggered


async def record_biomarker(user_id: str, data: BiomarkerCreate):
    """Record a new biomarker reading"""
    db = Database.get_db()

    biomarker_dict = data.model_dump(exclude_none=True)
    alerts = check_alerts(biomarker_dict)

    document = {
        **biomarker_dict,
        "user_id": user_id,
        "recorded_at": datetime.utcnow(),
        "alerts": alerts,
    }

    result = await db.biomarkers.insert_one(document)
    document["_id"] = str(result.inserted_id)

    return {
        "message": "Biomarker recorded successfully",
        "id": str(result.inserted_id),
        "alerts": alerts,
        "data": document,
    }


async def get_current_readings(user_id: str):
    """Get the most recent reading for each biomarker type"""
    db = Database.get_db()

    latest = {}
    fields = ["heart_rate", "spo2", "steps", "calories", "systolic_bp", "diastolic_bp"]

    for field in fields:
        doc = await db.biomarkers.find_one(
            {"user_id": user_id, field: {"$exists": True}},
            sort=[("recorded_at", -1)]
        )
        if doc:
            latest[field] = {
                "value": doc[field],
                "recorded_at": doc["recorded_at"],
                "alerts": doc.get("alerts", [])
            }

    return {"current_readings": latest}


async def get_biomarker_history(
    user_id: str,
    page: int = 1,
    limit: int = 20,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
):
    """Get historical biomarker readings"""
    db = Database.get_db()

    query = {"user_id": user_id}
    if date_from or date_to:
        query["recorded_at"] = {}
        if date_from:
            query["recorded_at"]["$gte"] = date_from
        if date_to:
            query["recorded_at"]["$lte"] = date_to

    skip = (page - 1) * limit
    total = await db.biomarkers.count_documents(query)
    cursor = db.biomarkers.find(query).sort("recorded_at", -1).skip(skip).limit(limit)
    readings = await cursor.to_list(length=limit)

    for r in readings:
        r["_id"] = str(r["_id"])

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "readings": readings,
    }


async def get_alerts(user_id: str):
    """Get all readings that triggered alerts"""
    db = Database.get_db()

    cursor = db.biomarkers.find(
        {"user_id": user_id, "alerts": {"$ne": []}}
    ).sort("recorded_at", -1).limit(50)

    alerts = await cursor.to_list(length=50)
    for a in alerts:
        a["_id"] = str(a["_id"])

    return {"alerts": alerts, "total": len(alerts)}