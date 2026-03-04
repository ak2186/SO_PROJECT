"""
Audit Logger Utility
Functions to log all important actions for security and compliance
"""

from app.config.database import Database
from app.models.audit_log import AuditLogCreate
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import Request


class AuditLogger:
    """Centralized audit logging"""
    
    @staticmethod
    async def log(
        action: str,
        user_id: Optional[str] = None,
        user_role: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        status: str = "success",
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """
        Generic logging function
        
        Args:
            action: Action performed (e.g., ADMIN_DELETE_USER)
            user_id: ID of user performing action
            user_role: Role of user (admin, provider, patient)
            resource_type: Type of resource affected (user, patient_data, etc.)
            resource_id: ID of affected resource
            status: success, failed, denied
            details: Additional context as dictionary
            ip_address: IP address of request
            user_agent: Browser/client user agent
        """
        db = Database.get_db()
        
        log_entry = {
            "user_id": user_id,
            "user_role": user_role,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "status": status,
            "details": details or {},
            "ip_address": ip_address,
            "user_agent": user_agent,
            "timestamp": datetime.utcnow()
        }
        
        await db.audit_logs.insert_one(log_entry)
    
    @staticmethod
    async def log_admin_action(
        admin_id: str,
        action: str,
        target_user_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None
    ):
        """
        Log admin actions (delete user, create provider, grant/revoke status)
        
        Args:
            admin_id: ID of admin performing action
            action: ADMIN_DELETE_USER, ADMIN_CREATE_PROVIDER, etc.
            target_user_id: ID of user being affected
            details: Additional context
            request: FastAPI request object (for IP and user agent)
        """
        ip_address = request.client.host if request else None
        user_agent = request.headers.get("user-agent") if request else None
        
        await AuditLogger.log(
            action=action,
            user_id=admin_id,
            user_role="admin",
            resource_type="user",
            resource_id=target_user_id,
            status="success",
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    async def log_provider_access(
        provider_id: str,
        patient_id: str,
        action: str,
        details: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None
    ):
        """
        Log provider accessing patient data
        
        Args:
            provider_id: ID of provider
            patient_id: ID of patient whose data was accessed
            action: PROVIDER_VIEW_PATIENT, PROVIDER_VIEW_BIOMARKERS, etc.
            details: Additional context
            request: FastAPI request object
        """
        ip_address = request.client.host if request else None
        user_agent = request.headers.get("user-agent") if request else None
        
        await AuditLogger.log(
            action=action,
            user_id=provider_id,
            user_role="provider",
            resource_type="patient_data",
            resource_id=patient_id,
            status="success",
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    async def log_access_denied(
        user_id: str,
        user_role: str,
        action: str,
        reason: str,
        request: Optional[Request] = None
    ):
        """
        Log failed access attempts (authorization failures)
        
        Args:
            user_id: ID of user who was denied
            user_role: Role of user
            action: What they tried to do
            reason: Why access was denied
            request: FastAPI request object
        """
        ip_address = request.client.host if request else None
        user_agent = request.headers.get("user-agent") if request else None
        
        await AuditLogger.log(
            action=action,
            user_id=user_id,
            user_role=user_role,
            status="denied",
            details={"reason": reason},
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    async def log_login_attempt(
        email: str,
        success: bool,
        user_id: Optional[str] = None,
        reason: Optional[str] = None,
        request: Optional[Request] = None
    ):
        """
        Log login attempts (both successful and failed)
        
        Args:
            email: Email used for login
            success: Whether login was successful
            user_id: ID of user (if login succeeded)
            reason: Reason for failure (if login failed)
            request: FastAPI request object
        """
        ip_address = request.client.host if request else None
        user_agent = request.headers.get("user-agent") if request else None
        
        action = "LOGIN_SUCCESS" if success else "LOGIN_FAILED"
        status = "success" if success else "failed"
        
        await AuditLogger.log(
            action=action,
            user_id=user_id,
            user_role="patient" if user_id else None,
            status=status,
            details={
                "email": email,
                "reason": reason
            },
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    async def log_patient_action(
        user_id: str,
        action: str,
        details: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None
    ):
        """
        Log patient actions (export data, update profile, etc.)
        
        Args:
            user_id: ID of patient
            action: PATIENT_EXPORT_DATA, PATIENT_UPDATE_PROFILE, etc.
            details: Additional context
            request: FastAPI request object
        """
        ip_address = request.client.host if request else None
        user_agent = request.headers.get("user-agent") if request else None
        
        await AuditLogger.log(
            action=action,
            user_id=user_id,
            user_role="patient",
            status="success",
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )