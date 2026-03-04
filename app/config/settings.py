"""
Application Settings
Loads ALL configuration from environment variables (.env file)
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """
    Application configuration settings
    ALL values loaded from .env file
    """
    
    # Application Info
    APP_NAME: str
    APP_ENV: str
    DEBUG: bool
    
    # Server Config
    HOST: str
    PORT: int
    
    # MongoDB
    MONGODB_URL: str
    MONGODB_DB_NAME: str
    
    # JWT Settings
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int
    
    # Encryption
    ENCRYPTION_KEY: str
    
    # CORS
    ALLOWED_ORIGINS: str    # ← CORRECT SPELLING (with 'I')
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int
    RATE_LIMIT_WINDOW_SECONDS: int
    
    # Admin Account
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str

    # Google Fit
    GOOGLE_FIT_CLIENT_ID: str = ""
    GOOGLE_FIT_CLIENT_SECRET: str = ""
    GOOGLE_FIT_REDIRECT_URI: str = "http://localhost:8000/api/googlefit/callback"

    # Gemini
    GEMINI_API_KEY: str = ""
    
    class Config:
        """Tell Pydantic to load from .env file"""
        env_file = ".env"
        case_sensitive = True
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Convert comma-separated CORS origins to list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]


# Create single instance to use throughout app
settings = Settings()