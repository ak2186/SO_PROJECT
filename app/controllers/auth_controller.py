"""
Authentication Controller
Handles user registration and login logic
"""

from fastapi import HTTPException, status
from app.models.user import UserCreate, UserInDB, UserResponse, UserLogin, Token
from app.utils.password import hash_password, verify_password
from app.utils.jwt import create_access_token
from app.config.database import Database
from datetime import datetime
from bson import ObjectId
from app.utils.audit_logger import AuditLogger
from fastapi import Request

async def register_user(user_data: UserCreate) -> UserResponse:
    """
    Register a new user
    
    Args:
        user_data: User registration data (email, password, name, etc.)
        
    Returns:
        Created user data (without password)
        
    Raises:
        HTTPException: If email already exists
    """
    db = Database.get_db()
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash the password
    hashed_password = hash_password(user_data.password)
    
    # Create user document for database
    user_dict = user_data.model_dump(exclude={"password"})
    user_dict["hashed_password"] = hashed_password
    user_dict["created_at"] = datetime.utcnow()
    user_dict["updated_at"] = datetime.utcnow()
    
    # Insert into database
    result = await db.users.insert_one(user_dict)
    
    # Get the created user
    created_user = await db.users.find_one({"_id": result.inserted_id})
    
    # Return user response (without password)
    return UserResponse(
        id=str(created_user["_id"]),
        email=created_user["email"],
        first_name=created_user["first_name"],
        last_name=created_user["last_name"],
        age=created_user.get("age"),
        gender=created_user.get("gender"),
        role=created_user["role"],
        status=created_user["status"],
        health_conditions=created_user.get("health_conditions"),
        created_at=created_user["created_at"]
    )


async def login_user(login_data: UserLogin, request: Request) -> Token:
    """
    Log in a user
    
    Args:
        login_data: User login credentials (email, password)
        request: FastAPI request object (for logging IP/user agent)
        
    Returns:
        JWT access token
        
    Raises:
        HTTPException: If credentials are invalid
    """
    db = Database.get_db()
    
    # Find user by email
    user = await db.users.find_one({"email": login_data.email})
    
    if not user:
        # Log failed login attempt
        await AuditLogger.log_login_attempt(
            email=login_data.email,
            success=False,
            reason="Email not found",
            request=request
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(login_data.password, user["hashed_password"]):
        # Log failed login attempt
        await AuditLogger.log_login_attempt(
            email=login_data.email,
            success=False,
            user_id=str(user["_id"]),
            reason="Incorrect password",
            request=request
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if user.get("status") != "active":
        # Log failed login attempt
        await AuditLogger.log_login_attempt(
            email=login_data.email,
            success=False,
            user_id=str(user["_id"]),
            reason="Account inactive",
            request=request
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Create access token
    token_data = {
        "user_id": str(user["_id"]),
        "email": user["email"],
        "role": user["role"]
    }
    access_token = create_access_token(data=token_data)
    
    # Log successful login
    await AuditLogger.log_login_attempt(
        email=login_data.email,
        success=True,
        user_id=str(user["_id"]),
        request=request
    )
    
    return Token(access_token=access_token, token_type="bearer")


async def get_current_user(user_id: str) -> UserResponse:
    """
    Get current user by ID
    
    Args:
        user_id: User's ID from JWT token
        
    Returns:
        User data
        
    Raises:
        HTTPException: If user not found
    """
    db = Database.get_db()
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        first_name=user["first_name"],
        last_name=user["last_name"],
        age=user.get("age"),
        gender=user.get("gender"),
        role=user["role"],
        status=user["status"],
        health_conditions=user.get("health_conditions"),
        created_at=user["created_at"]
    )