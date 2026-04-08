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


def require_role(token_data: TokenData, required_roles: list[str]) -> TokenData:
    """
    Check if user has one of the required roles.

    Args:
        token_data: Current user's token data
        required_roles: List of roles allowed to access endpoint

    Returns:
        TokenData if role matches

    Raises:
        HTTPException: If user doesn't have required role
    """
    if token_data.role not in required_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. {required_roles[0].capitalize()} role required."
        )

    return token_data