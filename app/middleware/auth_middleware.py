"""
Authentication Middleware
Protects routes by verifying JWT tokens
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.jwt import verify_token
from app.models.user import TokenData

# Define bearer token security scheme
security = HTTPBearer()


async def get_current_user_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    """
    Extract and verify JWT token from request
    
    Args:
        credentials: Bearer token from Authorization header
        
    Returns:
        TokenData with user info
        
    Raises:
        HTTPException: If token is invalid or missing
    """
    token = credentials.credentials
    
    token_data = verify_token(token)
    
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return token_data


async def require_role(required_role: str, token_data: TokenData = Depends(get_current_user_token)) -> TokenData:
    """
    Check if user has required role
    
    Args:
        required_role: Role required to access endpoint (admin, provider, patient)
        token_data: Current user's token data
        
    Returns:
        TokenData if role matches
        
    Raises:
        HTTPException: If user doesn't have required role
    """
    if token_data.role != required_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. {required_role.capitalize()} role required."
        )
    
    return token_data