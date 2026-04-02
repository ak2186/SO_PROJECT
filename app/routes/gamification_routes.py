from fastapi import APIRouter, Depends
from app.middleware.auth_middleware import get_current_user_token, require_role
from app.models.gamification import XPAction, GamificationResponse, XPAwardResponse, GamificationDetailsResponse
from app.controllers.gamification_controller import (
    get_gamification_state,
    get_gamification_details,
    award_xp,
    complete_challenge,
)

router = APIRouter(prefix="/api/gamification", tags=["Gamification"])


@router.get("/me", response_model=GamificationResponse)
async def get_me(current_user=Depends(get_current_user_token)):
    """Get current user's gamification state."""
    require_role(current_user, ["patient"])
    return await get_gamification_state(current_user.user_id)


@router.get("/details", response_model=GamificationDetailsResponse)
async def get_details(current_user=Depends(get_current_user_token)):
    """Get detailed gamification info for achievements modal."""
    require_role(current_user, ["patient"])
    return await get_gamification_details(current_user.user_id)


@router.post("/xp", response_model=XPAwardResponse)
async def post_xp(body: XPAction, current_user=Depends(get_current_user_token)):
    """Award XP for a completed action."""
    require_role(current_user, ["patient"])
    return await award_xp(current_user.user_id, body.action)


@router.post("/challenge/complete", response_model=XPAwardResponse)
async def post_challenge_complete(current_user=Depends(get_current_user_token)):
    """Mark today's daily challenge as completed."""
    require_role(current_user, ["patient"])
    return await complete_challenge(current_user.user_id)
