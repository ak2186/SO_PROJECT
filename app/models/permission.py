from pydantic import BaseModel
from datetime import datetime


class PermissionCreate(BaseModel):
    patient_id: str
    provider_id: str
    appointment_id: str


class PermissionResponse(BaseModel):
    id: str
    patient_id: str
    provider_id: str
    appointment_id: str
    status: str  # "pending", "granted", "denied"
    created_at: datetime
    updated_at: datetime
    provider_name: str = ""
    provider_specialty: str = ""
