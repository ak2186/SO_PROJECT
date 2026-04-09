"""
Authentication Controller
Handles user registration and login logic
"""

import random
from datetime import datetime, timedelta

from fastapi import HTTPException, status, Request
from bson import ObjectId
from jose import jwt, JWTError

from app.models.user import UserCreate, UserInDB, UserResponse, UserLogin, Token, TokenData, UserUpdate
from app.utils.password import hash_password, verify_password
from app.utils.jwt import create_access_token, create_refresh_token, verify_refresh_token
from app.config.database import Database
from app.config.settings import settings
from app.utils.audit_logger import AuditLogger
from app.utils.email import send_otp_email


def _user_response(user: dict) -> UserResponse:
    """Build a UserResponse from a MongoDB user document."""
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        first_name=user["first_name"],
        last_name=user["last_name"],
        age=user.get("age"),
        gender=user.get("gender"),
        date_of_birth=user.get("date_of_birth"),
        role=user["role"],
        status=user["status"],
        health_conditions=user.get("health_conditions"),
        blood_type=user.get("blood_type"),
        height=user.get("height"),
        weight=user.get("weight"),
        phone_number=user.get("phone_number"),
        medical_insurance=user.get("medical_insurance"),
        emergency_contact_name=user.get("emergency_contact_name"),
        emergency_contact_phone=user.get("emergency_contact_phone"),
        emergency_contact_relationship=user.get("emergency_contact_relationship"),
        allergies=user.get("allergies"),
        family_history=user.get("family_history"),
        medications=user.get("medications"),
        supplements=user.get("supplements"),
        smoking_status=user.get("smoking_status"),
        alcohol_frequency=user.get("alcohol_frequency"),
        exercise_frequency=user.get("exercise_frequency"),
        sleep_habit=user.get("sleep_habit"),
        dietary_preference=user.get("dietary_preference"),
        occupation=user.get("occupation"),
        profile_completed=user.get("profile_completed", False),
        created_at=user["created_at"],
        updated_at=user.get("updated_at"),
    )


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
    return _user_response(created_user)


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
    
    # Create access + refresh tokens
    token_data = {
        "user_id": str(user["_id"]),
        "email": user["email"],
        "role": user["role"]
    }
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    # Log successful login
    await AuditLogger.log_login_attempt(
        email=login_data.email,
        success=True,
        user_id=str(user["_id"]),
        request=request
    )

    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")


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

    return _user_response(user)


async def refresh_access_token(refresh_token_str: str) -> Token:
    """Use a valid refresh token to get a new access token + refresh token pair."""
    token_data = verify_refresh_token(refresh_token_str)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # Verify user still exists and is active
    db = Database.get_db()
    user = await db.users.find_one({"_id": ObjectId(token_data.user_id)})
    if not user or user.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    new_token_data = {
        "user_id": str(user["_id"]),
        "email": user["email"],
        "role": user["role"],
    }
    new_access = create_access_token(data=new_token_data)
    new_refresh = create_refresh_token(data=new_token_data)

    return Token(access_token=new_access, refresh_token=new_refresh, token_type="bearer")


async def change_password(user_id: str, current_password: str, new_password: str) -> dict:
    """Change user password after verifying the current one."""
    db = Database.get_db()

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not verify_password(current_password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    new_hashed = hash_password(new_password)
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"hashed_password": new_hashed, "updated_at": datetime.utcnow()}}
    )

    await AuditLogger.log(
        action="PASSWORD_CHANGED",
        user_id=user_id,
        user_role=user.get("role"),
        resource_type="user",
        resource_id=user_id,
    )

    return {"message": "Password changed successfully"}


async def update_user_profile(user_id: str, update_data: UserUpdate) -> UserResponse:
    """Update user profile fields."""
    db = Database.get_db()

    update_dict = update_data.model_dump(exclude_none=True)
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    update_dict["updated_at"] = datetime.utcnow()

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_dict}
    )

    await AuditLogger.log(
        action="PROFILE_UPDATED",
        user_id=user_id,
        resource_type="user",
        resource_id=user_id,
        details={"fields_updated": list(update_data.model_dump(exclude_none=True).keys())},
    )

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return _user_response(user)


# ── Forgot Password Flow ────────────────────────────────────


async def forgot_password(email: str) -> dict:
    """Generate a 6-digit OTP, store it hashed, and email it.

    Always returns a generic success message to avoid leaking
    whether the email exists in the system.
    """
    db = Database.get_db()

    # Rate-limit: max 3 requests per email per hour
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    recent_count = await db.password_resets.count_documents(
        {"email": email, "created_at": {"$gte": one_hour_ago}}
    )
    if recent_count >= 3:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many reset requests. Please try again later.",
        )

    user = await db.users.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})
    if not user:
        # Don't reveal that the email doesn't exist
        return {"message": "If this email is registered, you will receive a reset code shortly."}

    canonical_email = user["email"]  # use the casing stored in DB
    otp = f"{random.randint(0, 999999):06d}"
    otp_hash = hash_password(otp)

    await db.password_resets.insert_one({
        "email": canonical_email,
        "otp_hash": otp_hash,
        "attempts": 0,
        "created_at": datetime.utcnow(),
    })

    send_otp_email(canonical_email, otp)

    return {"message": "If this email is registered, you will receive a reset code shortly."}


async def verify_otp(email: str, otp: str) -> dict:
    """Verify OTP and return a short-lived reset token."""
    db = Database.get_db()

    record = await db.password_resets.find_one(
        {"email": {"$regex": f"^{email}$", "$options": "i"}},
        sort=[("created_at", -1)],
    )
    if not record:
        raise HTTPException(status_code=400, detail="No reset request found. Please request a new code.")

    # Check expiry (10 minutes)
    if datetime.utcnow() - record["created_at"] > timedelta(minutes=10):
        await db.password_resets.delete_one({"_id": record["_id"]})
        raise HTTPException(status_code=400, detail="Code has expired. Please request a new one.")

    # Check attempt limit
    if record["attempts"] >= 5:
        await db.password_resets.delete_one({"_id": record["_id"]})
        raise HTTPException(status_code=400, detail="Too many failed attempts. Please request a new code.")

    # Verify OTP
    if not verify_password(otp, record["otp_hash"]):
        await db.password_resets.update_one(
            {"_id": record["_id"]},
            {"$inc": {"attempts": 1}},
        )
        remaining = 5 - (record["attempts"] + 1)
        raise HTTPException(status_code=400, detail=f"Invalid code. {remaining} attempt(s) remaining.")

    # OTP correct — generate a short-lived reset token
    reset_token = jwt.encode(
        {
            "email": email,
            "purpose": "password_reset",
            "exp": datetime.utcnow() + timedelta(minutes=5),
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

    # Delete the used OTP record
    await db.password_resets.delete_one({"_id": record["_id"]})

    return {"message": "Code verified", "reset_token": reset_token}


async def reset_password(reset_token: str, new_password: str) -> dict:
    """Validate the reset token and set a new password."""
    try:
        payload = jwt.decode(
            reset_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    if payload.get("purpose") != "password_reset":
        raise HTTPException(status_code=400, detail="Invalid reset token.")

    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Invalid reset token.")

    db = Database.get_db()
    user = await db.users.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    new_hash = hash_password(new_password)
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"hashed_password": new_hash, "updated_at": datetime.utcnow()}},
    )

    # Clean up any remaining OTP records for this email
    await db.password_resets.delete_many({"email": email})

    await AuditLogger.log(
        action="PASSWORD_RESET",
        user_id=str(user["_id"]),
        user_role=user.get("role"),
        resource_type="user",
        resource_id=str(user["_id"]),
    )

    return {"message": "Password reset successfully. You can now log in."}