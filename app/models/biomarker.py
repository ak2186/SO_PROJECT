"""
Biomarker Model
Defines the structure of health data in MongoDB
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime


class BiomarkerCreate(BaseModel):
    """Data when recording a new biomarker reading"""
    heart_rate: Optional[float] = None        # bpm
    spo2: Optional[float] = None              # blood oxygen % 
    steps: Optional[int] = None               # daily steps
    calories: Optional[float] = None          # kcal burned
    systolic_bp: Optional[float] = None       # blood pressure systolic
    diastolic_bp: Optional[float] = None      # blood pressure diastolic
    notes: Optional[str] = None

    @field_validator('heart_rate')
    @classmethod
    def validate_heart_rate(cls, v):
        if v is not None and not (20 <= v <= 300):
            raise ValueError('Heart rate must be between 20 and 300 bpm')
        return v

    @field_validator('spo2')
    @classmethod
    def validate_spo2(cls, v):
        if v is not None and not (50 <= v <= 100):
            raise ValueError('SpO2 must be between 50 and 100%')
        return v

    @field_validator('steps')
    @classmethod
    def validate_steps(cls, v):
        if v is not None and v < 0:
            raise ValueError('Steps cannot be negative')
        return v

    @field_validator('calories')
    @classmethod
    def validate_calories(cls, v):
        if v is not None and v < 0:
            raise ValueError('Calories cannot be negative')
        return v


class BiomarkerInDB(BiomarkerCreate):
    """Biomarker as stored in database"""
    user_id: str
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    alerts: List[str] = []  # Any alerts triggered by this reading


class BiomarkerResponse(BiomarkerCreate):
    """Biomarker data returned in API responses"""
    id: str
    user_id: str
    recorded_at: datetime
    alerts: List[str] = []

    class Config:
        from_attributes = True


class BiomarkerFilter(BaseModel):
    """Filters for querying biomarker history"""
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    limit: int = 50