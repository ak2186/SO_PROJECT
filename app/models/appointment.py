"""
Appointment Model
Defines the structure of appointment documents in MongoDB
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime, timezone


class AppointmentCreate(BaseModel):
    """Data when creating an appointment"""
    provider_id: str
    appointment_date: datetime
    reason: Optional[str] = None
    notes: Optional[str] = None

    @field_validator('appointment_date')
    @classmethod
    def validate_date(cls, v):
        now = datetime.now(timezone.utc)
        # If incoming datetime is naive, treat as UTC
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        if v < now:
            raise ValueError('Appointment date must be in the future')
        return v


class AppointmentUpdate(BaseModel):
    """Data for updating an appointment"""
    reason: Optional[str] = None
    notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    """Appointment data returned in API responses"""
    id: str
    patient_id: str
    provider_id: str
    appointment_date: datetime
    status: str
    reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True