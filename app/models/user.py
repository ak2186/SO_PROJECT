"""
User Model
Defines the structure of user documents in MongoDB
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic"""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


class UserBase(BaseModel):
    """Base user fields (shared across models)"""
    email: EmailStr
    first_name: str
    last_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    role: str = "patient"  # patient, provider, admin
    status: str = "active"  # active, inactive
    health_conditions: Optional[str] = None
    blood_type: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    phone_number: Optional[str] = None
    medical_insurance: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    # Extended health profile
    allergies: Optional[str] = None
    family_history: Optional[str] = None
    medications: Optional[List[dict]] = None  # [{name, dosage, frequency}]
    supplements: Optional[List[dict]] = None  # [{name, dosage, frequency}]
    smoking_status: Optional[str] = None  # never, former, current
    alcohol_frequency: Optional[str] = None  # never, occasional, moderate, heavy
    exercise_frequency: Optional[str] = None  # sedentary, light, moderate, active, very_active
    sleep_habit: Optional[str] = None  # less_than_5, 5_to_6, 6_to_7, 7_to_8, more_than_8
    dietary_preference: Optional[str] = None  # none, vegetarian, vegan, halal, kosher, gluten_free, other
    occupation: Optional[str] = None
    profile_completed: bool = False
    # Provider-specific fields
    specialty: Optional[str] = None
    available_hours: Optional[str] = None  # e.g. "9:00 AM - 5:00 PM"
    working_days: Optional[str] = None  # e.g. "Mon - Fri"


class UserCreate(UserBase):
    """User data when creating account (includes password)"""
    password: str
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """Validate password requirements"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if len(v) > 72:
            raise ValueError('Password cannot be longer than 72 characters')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one number')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(char.islower() for char in v):
            raise ValueError('Password must contain at least one lowercase letter')
        return v


class UserUpdate(BaseModel):
    """User data for updates (all fields optional)"""
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    health_conditions: Optional[str] = None
    blood_type: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    phone_number: Optional[str] = None
    medical_insurance: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    allergies: Optional[str] = None
    family_history: Optional[str] = None
    medications: Optional[List[dict]] = None
    supplements: Optional[List[dict]] = None
    smoking_status: Optional[str] = None
    alcohol_frequency: Optional[str] = None
    exercise_frequency: Optional[str] = None
    sleep_habit: Optional[str] = None
    dietary_preference: Optional[str] = None
    occupation: Optional[str] = None
    profile_completed: Optional[bool] = None
    specialty: Optional[str] = None
    available_hours: Optional[str] = None
    working_days: Optional[str] = None


class UserInDB(UserBase):
    """User data as stored in database"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserResponse(UserBase):
    """User data returned in API responses (NO password)"""
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """User data for login"""
    email: EmailStr
    password: str


class Token(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: str = ""
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Data stored inside JWT token"""
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None