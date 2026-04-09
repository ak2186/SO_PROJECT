"""
MongoDB Database Connection
Handles connection to MongoDB and provides database access
"""

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from app.config.settings import settings  # ← lowercase 's' = instance
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Database:
    """MongoDB Database Manager"""
    
    client: AsyncIOMotorClient = None
    db = None
    
    @classmethod
    async def connect_db(cls):
        """
        Connect to MongoDB
        Called when application starts
        """
        try:
            # Create MongoDB client (using lowercase 'settings')
            cls.client = AsyncIOMotorClient(settings.MONGODB_URL)  # ← FIXED!
            
            # Get database (using lowercase 'settings')
            cls.db = cls.client[settings.MONGODB_DB_NAME]  # ← FIXED!
            
            # Test connection
            await cls.client.admin.command('ping')
            
            logger.info("✅ Connected to MongoDB successfully")
            logger.info(f"📦 Database: {settings.MONGODB_DB_NAME}")
            
            # Create indexes (for performance)
            await cls.create_indexes()
            
        except ConnectionFailure as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            raise
    
    @classmethod
    async def close_db(cls):
        """
        Close MongoDB connection
        Called when application shuts down
        """
        if cls.client:
            cls.client.close()
            logger.info("🔌 MongoDB connection closed")
    
    @classmethod
    async def create_indexes(cls):
        """
        Create database indexes for better query performance
        Indexes make searches faster (like index in a book)
        """
        try:
            # Users collection indexes
            await cls.db.users.create_index("email", unique=True)
            await cls.db.users.create_index("role")
            
            # Biomarkers collection indexes
            await cls.db.biomarkers.create_index("user_id")
            await cls.db.biomarkers.create_index("timestamp")
            await cls.db.biomarkers.create_index([("user_id", 1), ("reading_type", 1), ("timestamp", -1)])
            
            # Appointments collection indexes
            await cls.db.appointments.create_index("patient_id")
            await cls.db.appointments.create_index("provider_id")
            await cls.db.appointments.create_index("start_time")
            
            # Prescriptions collection indexes
            await cls.db.prescriptions.create_index("patient_id")
            await cls.db.prescriptions.create_index("provider_id")
            
            # Audit logs collection indexes
            await cls.db.audit_logs.create_index("user_id")
            await cls.db.audit_logs.create_index("timestamp")
            await cls.db.audit_logs.create_index("action")

            # Permissions collection indexes
            await cls.db.permissions.create_index([("patient_id", 1), ("provider_id", 1)])
            await cls.db.permissions.create_index("provider_id")
            await cls.db.permissions.create_index("patient_id")

            # Gamification collection indexes
            await cls.db.gamification.create_index("user_id", unique=True)

            # Password resets — auto-expire documents after 10 minutes
            await cls.db.password_resets.create_index("created_at", expireAfterSeconds=600)
            await cls.db.password_resets.create_index("email")

            logger.info("📊 Database indexes created successfully")
            
        except Exception as e:
            logger.warning(f"⚠️ Index creation warning: {e}")
    
    @classmethod
    def get_db(cls):
        """
        Get database instance
        Used in API endpoints to access database
        """
        return cls.db


# Convenience function to get database
async def get_database():
    """Dependency function for FastAPI routes"""
    return Database.get_db()