"""
Prescription Model
Defines the structure of prescription documents in MongoDB
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class RefillRequest(BaseModel):
    """Refill request sub-document"""
    id: str
    requested_at: datetime
    status: str  # pending, approved, denied
    notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None


class PrescriptionCreate(BaseModel):
    """Data when creating a prescription"""
    patient_id: str
    medication_name: str
    dosage: str
    frequency: str
    duration: str
    notes: Optional[str] = None
    refills_allowed: int = 0


class SelfPrescriptionCreate(BaseModel):
    """Data when a patient adds their own existing medication"""
    medication_name: str
    dosage: str
    frequency: str
    duration: Optional[str] = None
    notes: Optional[str] = None


class PrescriptionResponse(BaseModel):
    """Prescription data returned in API responses"""
    id: str
    patient_id: str
    provider_id: str
    medication_name: str
    dosage: str
    frequency: str
    duration: str
    notes: Optional[str] = None
    status: str
    refills_allowed: int
    refills_used: int
    refill_requests: List[dict] = []
    created_at: datetime

    class Config:
        from_attributes = True