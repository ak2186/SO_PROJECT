"""
Authentication Routes
API endpoints for registration and login
"""

from fastapi import APIRouter, Depends, HTTPException, status
from app.models.user import UserCreate, UserResponse, UserLogin, Token, UserUpdate
from app.controllers.auth_controller import register_user, login_user, get_current_user, update_user_profile, change_password, refresh_access_token
from app.middleware.auth_middleware import get_current_user_token
from app.models.user import TokenData
from fastapi import APIRouter, Depends, HTTPException, status, Request

# Create router
router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Register a new user account
    
    Request body:
    - email: User's email (unique)
    - password: User's password (will be hashed)
    - first_name: User's first name
    - last_name: User's last name
    - age: User's age (optional)
    - gender: User's gender (optional)
    - health_conditions: Pre-existing conditions (optional)
    
    Returns:
    - Created user data (without password)
    """
    return await register_user(user_data)


@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, request: Request):
    """
    Log in to get access token
    
    Request body:
    - email: User's email
    - password: User's password
    
    Returns:
    - access_token: JWT token for authentication
    - token_type: "bearer"
    
    Use the access_token in subsequent requests:
    Authorization: Bearer <access_token>
    """
    return await login_user(login_data, request)


@router.get("/me", response_model=UserResponse)
async def get_me(token_data: TokenData = Depends(get_current_user_token)):
    """
    Get current logged-in user's information
    
    Headers required:
    - Authorization: Bearer <access_token>
    
    Returns:
    - Current user's data
    """
    return await get_current_user(token_data.user_id)


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    update_data: UserUpdate,
    token_data: TokenData = Depends(get_current_user_token),
):
    """Update the current user's profile"""
    return await update_user_profile(token_data.user_id, update_data)


@router.post("/change-password")
async def change_pwd(
    body: dict,
    token_data: TokenData = Depends(get_current_user_token),
):
    """Change the current user's password"""
    current_password = body.get("current_password", "")
    new_password = body.get("new_password", "")
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Both current and new password are required")
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    return await change_password(token_data.user_id, current_password, new_password)


@router.post("/refresh", response_model=Token)
async def refresh(body: dict):
    """
    Exchange a valid refresh token for a new access + refresh token pair.

    Request body:
    - refresh_token: The refresh token from login
    """
    refresh_token = body.get("refresh_token", "")
    if not refresh_token:
        raise HTTPException(status_code=400, detail="refresh_token is required")
    return await refresh_access_token(refresh_token)


@router.post("/logout")
async def logout(token_data: TokenData = Depends(get_current_user_token)):
    """
    Log out current user
    
    Note: With JWT tokens, logout is handled client-side
    by deleting the token. This endpoint is here for
    API consistency and future enhancements (token blacklist, etc.)
    
    Returns:
    - Success message
    """
    return {
        "message": "Successfully logged out",
        "detail": "Please delete the token from client storage"
    }