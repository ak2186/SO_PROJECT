"""
Field-Level Encryption Utility
Encrypts/decrypts sensitive fields before storing in MongoDB
Uses Fernet (AES-128-CBC) symmetric encryption with PBKDF2-derived key
"""

import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from app.config.settings import settings


def _derive_key(passphrase: str) -> bytes:
    """Derive a Fernet-compatible 32-byte base64 key from a passphrase."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b"healix_salt_v1",  # static salt — acceptable for app-level encryption
        iterations=480_000,
    )
    return base64.urlsafe_b64encode(kdf.derive(passphrase.encode()))


_fernet = Fernet(_derive_key(settings.ENCRYPTION_KEY))


def encrypt_field(value) -> str:
    """Encrypt a value (str, int, float) and return a ciphertext string."""
    if value is None:
        return None
    plaintext = str(value)
    return _fernet.encrypt(plaintext.encode()).decode()


def decrypt_field(token: str, cast=str):
    """Decrypt a ciphertext string and optionally cast to the original type."""
    if token is None:
        return None
    try:
        plaintext = _fernet.decrypt(token.encode()).decode()
        return cast(plaintext)
    except Exception:
        # If decryption fails (e.g. data was stored before encryption), return as-is
        return token if cast is str else None


def encrypt_dict_fields(data: dict, fields: list) -> dict:
    """Encrypt specified fields in a dict (in-place). Returns the dict."""
    for field in fields:
        if field in data and data[field] is not None:
            data[field] = encrypt_field(data[field])
    return data


def decrypt_dict_fields(data: dict, field_types: dict) -> dict:
    """
    Decrypt specified fields in a dict (in-place).
    field_types: {field_name: cast_type} e.g. {"heart_rate": int, "notes": str}
    """
    if data is None:
        return data
    for field, cast in field_types.items():
        if field in data and data[field] is not None:
            data[field] = decrypt_field(data[field], cast=cast)
    return data
