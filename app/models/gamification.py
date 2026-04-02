from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class XPAction(BaseModel):
    action: str


class BadgeInfo(BaseModel):
    id: str
    name: str
    emoji: str
    earned_at: datetime


class ChallengeInfo(BaseModel):
    id: str
    title: str
    description: str
    xp_reward: int = 30
    completed: bool = False


class GamificationResponse(BaseModel):
    xp: int = 0
    level: int = 1
    level_name: str = "Seedling"
    xp_for_next_level: int = 200
    streak_count: int = 0
    badges: List[BadgeInfo] = []
    challenge: Optional[ChallengeInfo] = None


class LevelInfo(BaseModel):
    level: int
    name: str
    xp_required: int


class XPGuideEntry(BaseModel):
    action: str
    label: str
    xp: int


class AllBadgeInfo(BaseModel):
    id: str
    name: str
    emoji: str
    earned: bool = False
    earned_at: Optional[datetime] = None


class XPLogEntry(BaseModel):
    action: str
    xp: int
    date: str


class GamificationDetailsResponse(BaseModel):
    xp: int = 0
    level: int = 1
    level_name: str = "Seedling"
    xp_for_next_level: int = 200
    streak_count: int = 0
    badges: List[AllBadgeInfo] = []
    challenge: Optional[ChallengeInfo] = None
    all_levels: List[LevelInfo] = []
    xp_guide: List[XPGuideEntry] = []
    recent_activity: List[XPLogEntry] = []
    challenges: List[ChallengeInfo] = []


class XPAwardResponse(BaseModel):
    already_awarded: bool = False
    xp_gained: int = 0
    total_xp: int = 0
    level: int = 1
    level_name: str = "Seedling"
    xp_for_next_level: int = 200
    level_up: bool = False
    new_badges: List[BadgeInfo] = []
    streak_count: int = 0
