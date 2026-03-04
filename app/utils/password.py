"""
Password Utilities
Functions for hashing and verifying passwords using Argon2
"""

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

# Create password hasher
ph = PasswordHasher()


def hash_password(password: str) -> str:
    """
    Hash a plain password using Argon2
    Used when user registers or changes password
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password string
    """
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash using Argon2
    Used during login to check if password is correct
    
    Args:
        plain_password: Password user entered
        hashed_password: Hashed password from database
        
    Returns:
        True if password matches, False otherwise
    """
    try:
        ph.verify(hashed_password, plain_password)
        return True
    except VerifyMismatchError:
        return False