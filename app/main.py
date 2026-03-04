"""
HEALIX Backend Main Application
FastAPI application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import logging

from app.config.settings import settings
from app.config.database import Database

# Import routes 
from app.routes import auth_routes
from app.routes import admin_routes 
from app.routes import biomarker_routes
from app.routes import googlefit_routes
from app.routes import appointment_routes
from app.routes import prescription_routes
from app.routes import chat_routes

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager
    Runs code when app starts and shuts down
    """
    # Startup: Connect to database
    logger.info("🚀 Starting HEALIX Backend...")
    await Database.connect_db()
    
    yield  # App runs here (keeps running until shutdown)
    
    # Shutdown: Close database connection
    logger.info("🛑 Shutting down HEALIX Backend...")
    await Database.close_db()


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="Health Monitoring Platform API",
    version="1.0.0",
    docs_url="/api/docs",  # Swagger UI at http://localhost:8000/api/docs
    redoc_url="/api/redoc",  # ReDoc at http://localhost:8000/api/redoc
    lifespan=lifespan
)


# CORS Configuration
# Allows frontend (React) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,  # Which websites can access
    allow_credentials=True,  # Allow cookies
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE)
    allow_headers=["*"],  # Allow all headers
)


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint
    Returns API status - useful for monitoring
    """
    return {
        "status": "ok",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "version": "1.0.0"
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint
    Provides basic API information
    """
    return {
        "message": "Welcome to HEALIX API",
        "docs": "/api/docs",
        "health": "/health"
    }


# Register API routes (will add these later)
app.include_router(auth_routes.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(admin_routes.router)
app.include_router(biomarker_routes.router)
app.include_router(googlefit_routes.router)
app.include_router(appointment_routes.router)
app.include_router(prescription_routes.router)
# app.include_router(export_routes.router, prefix="/api/export", tags=["Export"])
app.include_router(chat_routes.router)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """
    Catch all unhandled errors
    Returns clean error response instead of crashing
    """
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": str(exc) if settings.DEBUG else "An unexpected error occurred"
        }
    )


# Run application (only when running this file directly)
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG  # Auto-reload on code changes in development
    )