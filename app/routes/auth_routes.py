"""
Authentication Routes
API endpoints for registration and login
"""

from fastapi import APIRouter, Depends, HTTPException, status
from app.models.user import UserCreate, UserResponse, UserLogin, Token
from app.controllers.auth_controller import register_user, login_user, get_current_user
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