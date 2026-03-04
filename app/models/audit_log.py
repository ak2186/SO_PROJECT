"""
Audit Log Model
Tracks all important actions in the system for security and compliance
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from bson import ObjectId


class AuditLogCreate(BaseModel):
    """Data for creating an audit log entry"""
    user_id: Optional[str] = None  # Can be None for failed login attempts
    user_role: Optional[str] = None  # patient, provider, admin
    action: str  # ADMIN_DELETE_USER, PROVIDER_VIEW_PATIENT, LOGIN_FAILED, etc.
    resource_type: Optional[str] = None  # user, patient_data, prescription, etc.
    resource_id: Optional[str] = None  # ID of the affected resource
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    details: Optional[Dict[str, Any]] = None  # Additional context as JSON
    status: str = "success"  # success, failed, denied
    

class AuditLogInDB(AuditLogCreate):
    """Audit log as stored in database"""
    id: Optional[str] = Field(alias="_id", default=None)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True


class AuditLogResponse(BaseModel):
    """Audit log returned in API responses"""
    id: str
    user_id: Optional[str]
    user_role: Optional[str]
    action: str
    resource_type: Optional[str]
    resource_id: Optional[str]
    ip_address: Optional[str]
    details: Optional[Dict[str, Any]]
    status: str
    timestamp: datetime
    
    class Config:
        from_attributes = True


class AuditLogFilter(BaseModel):
    """Filters for querying audit logs"""
    user_id: Optional[str] = None
    user_role: Optional[str] = None
    action: Optional[str] = None
    resource_type: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    page: int = 1
    limit: int = 50