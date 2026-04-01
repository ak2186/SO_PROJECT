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
