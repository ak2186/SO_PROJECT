from datetime import datetime, timedelta
from bson import ObjectId
from fastapi import HTTPException, status
from app.config.database import Database
from app.models.gamification import (
    BadgeInfo, ChallengeInfo, GamificationResponse, XPAwardResponse,
    GamificationDetailsResponse, LevelInfo, XPGuideEntry, AllBadgeInfo, XPLogEntry,
)
import hashlib

# ── XP Table ────────────────────────────────────────────
XP_TABLE = {
    "sync_gfit": 10,
    "step_goal": 25,
    "calorie_goal": 25,
    "water_goal": 15,
    "sleep_log": 10,
    "exercise_goal": 15,
    "mood_log": 5,
    "checklist_item_1": 5,
    "checklist_item_2": 5,
    "checklist_item_3": 5,
    "checklist_item_4": 5,
    "daily_challenge": 30,
    "appointment": 50,
    "profile_complete": 100,
}

GOAL_ACTIONS = {"step_goal", "calorie_goal", "water_goal", "exercise_goal"}

# ── Levels ──────────────────────────────────────────────
LEVELS = [
    (0, "Seedling"),
    (200, "Sprout"),
    (500, "Bloom"),
    (1000, "Thrive"),
    (2000, "Radiant"),
    (4000, "Legendary"),
]


def calc_level(xp: int):
    level = 1
    name = "Seedling"
    next_xp = 200
    for i, (threshold, lname) in enumerate(LEVELS):
        if xp >= threshold:
            level = i + 1
            name = lname
            next_xp = LEVELS[i + 1][0] if i + 1 < len(LEVELS) else threshold
    return level, name, next_xp


# ── Challenges ──────────────────────────────────────────
CHALLENGES = [
    {"id": "walk_2k_extra", "title": "Walk 2,000 extra steps", "description": "Push beyond your daily step goal by 2,000 steps today"},
    {"id": "drink_10_water", "title": "Drink 10 glasses of water", "description": "Stay extra hydrated today"},
    {"id": "mood_early", "title": "Log your mood before noon", "description": "Check in with yourself early in the day"},
    {"id": "exercise_45", "title": "Do 45 minutes of exercise", "description": "Push a little harder today"},
    {"id": "full_checklist", "title": "Complete all 4 checklist items", "description": "Tick off every item on your daily checklist"},
    {"id": "sync_gfit", "title": "Sync your Google Fit data", "description": "Keep your health data up to date"},
    {"id": "log_sleep", "title": "Log your sleep hours", "description": "Track how well you rested last night"},
    {"id": "walk_outside", "title": "Take a 15-minute walk outside", "description": "Get some fresh air and sunlight"},
    {"id": "stretch_10", "title": "Do 10 minutes of stretching", "description": "Loosen up and improve flexibility"},
    {"id": "water_hourly", "title": "Drink a glass of water every hour", "description": "Spread your hydration throughout the day"},
    {"id": "log_exercise", "title": "Log your exercise time", "description": "Record your workout for today"},
    {"id": "take_meds", "title": "Take your medication on time", "description": "Stay on schedule with your prescriptions"},
    {"id": "meditate_5", "title": "Do a 5-minute meditation", "description": "Take a quick mental break"},
    {"id": "steps_before_lunch", "title": "Walk 5,000 steps before lunch", "description": "Front-load your activity"},
    {"id": "log_water_meals", "title": "Log every meal's water intake", "description": "Track hydration around meals"},
    {"id": "mood_checkin", "title": "Complete a mood check-in", "description": "Record how you feel today"},
    {"id": "sleep_8hrs", "title": "Get 8 hours of sleep tonight", "description": "Prioritize a full night's rest"},
    {"id": "cardio_30", "title": "Do 30 minutes of cardio", "description": "Get your heart pumping"},
    {"id": "stretch_bed", "title": "Stretch before bed", "description": "Wind down with gentle stretches"},
    {"id": "breathe_3x", "title": "Take 3 mindful breathing breaks", "description": "Pause and breathe deeply three times today"},
]


def get_todays_challenge() -> dict:
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    h = int(hashlib.md5(today_str.encode()).hexdigest(), 16)
    idx = h % len(CHALLENGES)
    return CHALLENGES[idx]


# ── Badges ──────────────────────────────────────────────
ALL_BADGES = [
    {"id": "first_steps", "name": "First Steps", "emoji": "\U0001f331"},
    {"id": "week_warrior", "name": "Week Warrior", "emoji": "\U0001f3c5"},
    {"id": "month_master", "name": "Month Master", "emoji": "\U0001f451"},
    {"id": "step_king", "name": "Step King", "emoji": "\U0001f6b6"},
    {"id": "hydration_hero", "name": "Hydration Hero", "emoji": "\U0001f4a7"},
    {"id": "zen_mode", "name": "Zen Mode", "emoji": "\U0001f9d8"},
    {"id": "early_bird", "name": "Early Bird", "emoji": "\U0001f305"},
    {"id": "profile_pro", "name": "Profile Pro", "emoji": "\U0001f4cb"},
    {"id": "checkup_champ", "name": "Check-up Champ", "emoji": "\U0001f3e5"},
    {"id": "sync_star", "name": "Sync Star", "emoji": "\u2b50"},
]


def check_new_badges(doc: dict) -> list:
    earned_ids = {b["id"] for b in doc.get("badges", [])}
    xp_log = doc.get("xp_log", [])
    new_badges = []
    now = datetime.utcnow()

    def _count_distinct_dates(action_prefix: str) -> int:
        return len({e["date"] for e in xp_log if e["action"].startswith(action_prefix)})

    if "first_steps" not in earned_ids and len(xp_log) > 0:
        new_badges.append({"id": "first_steps", "name": "First Steps", "emoji": "\U0001f331", "earned_at": now})

    if "week_warrior" not in earned_ids and doc.get("streak_count", 0) >= 7:
        new_badges.append({"id": "week_warrior", "name": "Week Warrior", "emoji": "\U0001f3c5", "earned_at": now})

    if "month_master" not in earned_ids and doc.get("streak_count", 0) >= 30:
        new_badges.append({"id": "month_master", "name": "Month Master", "emoji": "\U0001f451", "earned_at": now})

    if "step_king" not in earned_ids and _count_distinct_dates("step_goal") >= 1:
        new_badges.append({"id": "step_king", "name": "Step King", "emoji": "\U0001f6b6", "earned_at": now})

    if "hydration_hero" not in earned_ids and _count_distinct_dates("water_goal") >= 7:
        new_badges.append({"id": "hydration_hero", "name": "Hydration Hero", "emoji": "\U0001f4a7", "earned_at": now})

    if "zen_mode" not in earned_ids:
        seven_days_ago = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
        med_dates = {e["date"] for e in xp_log if e["action"] == "checklist_item_1" and e["date"] >= seven_days_ago}
        if len(med_dates) >= 5:
            new_badges.append({"id": "zen_mode", "name": "Zen Mode", "emoji": "\U0001f9d8", "earned_at": now})

    if "early_bird" not in earned_ids and _count_distinct_dates("sleep_log") >= 7:
        new_badges.append({"id": "early_bird", "name": "Early Bird", "emoji": "\U0001f305", "earned_at": now})

    if "profile_pro" not in earned_ids and _count_distinct_dates("profile_complete") >= 1:
        new_badges.append({"id": "profile_pro", "name": "Profile Pro", "emoji": "\U0001f4cb", "earned_at": now})

    if "checkup_champ" not in earned_ids and _count_distinct_dates("appointment") >= 3:
        new_badges.append({"id": "checkup_champ", "name": "Check-up Champ", "emoji": "\U0001f3e5", "earned_at": now})

    if "sync_star" not in earned_ids and _count_distinct_dates("sync_gfit") >= 7:
        new_badges.append({"id": "sync_star", "name": "Sync Star", "emoji": "\u2b50", "earned_at": now})

    return new_badges


# ── Endpoint Logic ──────────────────────────────────────

async def _get_or_create_doc(user_id: str) -> dict:
    db = Database.get_db()
    doc = await db.gamification.find_one({"user_id": user_id})
    if not doc:
        challenge = get_todays_challenge()
        doc = {
            "user_id": user_id,
            "xp": 0,
            "level": 1,
            "level_name": "Seedling",
            "streak_count": 0,
            "streak_last_date": None,
            "badges": [],
            "challenge_date": datetime.utcnow().strftime("%Y-%m-%d"),
            "challenge_id": challenge["id"],
            "challenge_completed": False,
            "xp_log": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        await db.gamification.insert_one(doc)
        doc = await db.gamification.find_one({"user_id": user_id})
    return doc


def _build_challenge_info(doc: dict) -> ChallengeInfo:
    cid = doc.get("challenge_id", "")
    ch = next((c for c in CHALLENGES if c["id"] == cid), CHALLENGES[0])
    return ChallengeInfo(
        id=ch["id"],
        title=ch["title"],
        description=ch["description"],
        xp_reward=30,
        completed=doc.get("challenge_completed", False),
    )


async def get_gamification_state(user_id: str) -> GamificationResponse:
    db = Database.get_db()
    doc = await _get_or_create_doc(user_id)

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    if doc.get("challenge_date") != today_str:
        challenge = get_todays_challenge()
        await db.gamification.update_one(
            {"_id": doc["_id"]},
            {"$set": {
                "challenge_date": today_str,
                "challenge_id": challenge["id"],
                "challenge_completed": False,
                "updated_at": datetime.utcnow(),
            }},
        )
        doc["challenge_date"] = today_str
        doc["challenge_id"] = challenge["id"]
        doc["challenge_completed"] = False

    level, level_name, next_xp = calc_level(doc["xp"])
    badges = [BadgeInfo(**b) for b in doc.get("badges", [])]

    return GamificationResponse(
        xp=doc["xp"],
        level=level,
        level_name=level_name,
        xp_for_next_level=next_xp,
        streak_count=doc.get("streak_count", 0),
        badges=badges,
        challenge=_build_challenge_info(doc),
    )


async def award_xp(user_id: str, action: str) -> XPAwardResponse:
    if action not in XP_TABLE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown action: {action}")

    db = Database.get_db()
    doc = await _get_or_create_doc(user_id)
    today_str = datetime.utcnow().strftime("%Y-%m-%d")

    xp_log = doc.get("xp_log", [])
    if any(e["action"] == action and e["date"] == today_str for e in xp_log):
        level, level_name, next_xp = calc_level(doc["xp"])
        return XPAwardResponse(
            already_awarded=True,
            total_xp=doc["xp"],
            level=level,
            level_name=level_name,
            xp_for_next_level=next_xp,
            streak_count=doc.get("streak_count", 0),
        )

    xp_amount = XP_TABLE[action]
    old_xp = doc["xp"]
    new_xp = old_xp + xp_amount
    old_level, _, _ = calc_level(old_xp)
    new_level, new_level_name, next_xp = calc_level(new_xp)
    leveled_up = new_level > old_level

    cutoff = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
    xp_log = [e for e in xp_log if e["date"] >= cutoff]
    xp_log.append({"action": action, "xp": xp_amount, "date": today_str})

    streak_count = doc.get("streak_count", 0)
    streak_last = doc.get("streak_last_date")
    if action in GOAL_ACTIONS:
        yesterday_str = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")
        if streak_last == today_str:
            pass
        elif streak_last == yesterday_str:
            streak_count += 1
        else:
            streak_count = 1
        streak_last = today_str

    update_fields = {
        "xp": new_xp,
        "level": new_level,
        "level_name": new_level_name,
        "xp_log": xp_log,
        "streak_count": streak_count,
        "streak_last_date": streak_last,
        "updated_at": datetime.utcnow(),
    }

    temp_doc = {**doc, **update_fields}
    new_badges = check_new_badges(temp_doc)
    if new_badges:
        update_fields["badges"] = doc.get("badges", []) + new_badges

    await db.gamification.update_one({"_id": doc["_id"]}, {"$set": update_fields})

    return XPAwardResponse(
        xp_gained=xp_amount,
        total_xp=new_xp,
        level=new_level,
        level_name=new_level_name,
        xp_for_next_level=next_xp,
        level_up=leveled_up,
        new_badges=[BadgeInfo(**b) for b in new_badges],
        streak_count=streak_count,
    )


async def complete_challenge(user_id: str) -> XPAwardResponse:
    db = Database.get_db()
    doc = await _get_or_create_doc(user_id)
    today_str = datetime.utcnow().strftime("%Y-%m-%d")

    if doc.get("challenge_date") != today_str:
        raise HTTPException(status_code=400, detail="No active challenge for today")
    if doc.get("challenge_completed"):
        raise HTTPException(status_code=400, detail="Challenge already completed today")

    await db.gamification.update_one(
        {"_id": doc["_id"]},
        {"$set": {"challenge_completed": True, "updated_at": datetime.utcnow()}},
    )

    return await award_xp(user_id, "daily_challenge")


# ── labels for XP actions ─────────────────────
XP_LABELS = {
    "sync_gfit": "Sync Google Fit",
    "step_goal": "Hit Step Goal",
    "calorie_goal": "Hit Calorie Goal",
    "water_goal": "Hit Water Goal",
    "sleep_log": "Log Sleep",
    "exercise_goal": "Log Exercise",
    "mood_log": "Log Mood",
    "checklist_item_1": "Checklist Item 1",
    "checklist_item_2": "Checklist Item 2",
    "checklist_item_3": "Checklist Item 3",
    "checklist_item_4": "Checklist Item 4",
    "daily_challenge": "Daily Challenge",
    "appointment": "Attend Appointment",
    "profile_complete": "Complete Profile",
}


async def get_gamification_details(user_id: str) -> GamificationDetailsResponse:
    """Return full gamification details for the achievements modal."""
    doc = await _get_or_create_doc(user_id)

    # Refresh challenge if needed (same logic as get_gamification_state)
    db = Database.get_db()
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    if doc.get("challenge_date") != today_str:
        challenge = get_todays_challenge()
        await db.gamification.update_one(
            {"_id": doc["_id"]},
            {"$set": {
                "challenge_date": today_str,
                "challenge_id": challenge["id"],
                "challenge_completed": False,
                "updated_at": datetime.utcnow(),
            }},
        )
        doc["challenge_date"] = today_str
        doc["challenge_id"] = challenge["id"]
        doc["challenge_completed"] = False

    level, level_name, next_xp = calc_level(doc["xp"])

    # All badges with earned status
    earned_map = {b["id"]: b for b in doc.get("badges", [])}
    all_badges = []
    for b in ALL_BADGES:
        earned = b["id"] in earned_map
        all_badges.append(AllBadgeInfo(
            id=b["id"], name=b["name"], emoji=b["emoji"],
            earned=earned,
            earned_at=earned_map[b["id"]].get("earned_at") if earned else None,
        ))

    # All levels
    all_levels = [LevelInfo(level=i + 1, name=name, xp_required=xp_req) for i, (xp_req, name) in enumerate(LEVELS)]

    # XP guide
    xp_guide = [XPGuideEntry(action=k, label=XP_LABELS.get(k, k), xp=v) for k, v in XP_TABLE.items()]

    # Recent activity (last 15 entries, newest first)
    xp_log = doc.get("xp_log", [])
    recent = sorted(xp_log, key=lambda e: e["date"], reverse=True)[:15]
    recent_activity = [XPLogEntry(action=e["action"], xp=e["xp"], date=e["date"]) for e in recent]

    # All challenges
    challenges = [ChallengeInfo(id=c["id"], title=c["title"], description=c["description"], xp_reward=30) for c in CHALLENGES]

    return GamificationDetailsResponse(
        xp=doc["xp"],
        level=level,
        level_name=level_name,
        xp_for_next_level=next_xp,
        streak_count=doc.get("streak_count", 0),
        badges=all_badges,
        challenge=_build_challenge_info(doc),
        all_levels=all_levels,
        xp_guide=xp_guide,
        recent_activity=recent_activity,
        challenges=challenges,
    )
