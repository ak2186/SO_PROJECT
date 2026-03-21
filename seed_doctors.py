"""
Seed Script — Insert dummy provider (doctor) accounts into MongoDB.

Usage:
    python seed_doctors.py

Each doctor gets:
  - email / password (for login)
  - specialty, available_hours, working_days
  - role = "provider", status = "active"

Password for ALL dummy doctors: Doctor@123
"""

import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
from app.utils.password import hash_password

DOCTORS = [
    {
        "first_name": "Sarah",
        "last_name": "Johnson",
        "email": "sarah.johnson@healix.com",
        "gender": "Female",
        "specialty": "General Practice",
        "available_hours": "9:00 AM - 5:00 PM",
        "working_days": "Mon - Fri",
    },
    {
        "first_name": "James",
        "last_name": "Chen",
        "email": "james.chen@healix.com",
        "gender": "Male",
        "specialty": "Cardiology",
        "available_hours": "8:00 AM - 4:00 PM",
        "working_days": "Mon - Thu",
    },
    {
        "first_name": "Priya",
        "last_name": "Patel",
        "email": "priya.patel@healix.com",
        "gender": "Female",
        "specialty": "Dermatology",
        "available_hours": "10:00 AM - 6:00 PM",
        "working_days": "Mon - Fri",
    },
    {
        "first_name": "Michael",
        "last_name": "Rodriguez",
        "email": "michael.rodriguez@healix.com",
        "gender": "Male",
        "specialty": "Orthopedics",
        "available_hours": "8:30 AM - 3:30 PM",
        "working_days": "Tue - Sat",
    },
    {
        "first_name": "Emily",
        "last_name": "Williams",
        "email": "emily.williams@healix.com",
        "gender": "Female",
        "specialty": "Pediatrics",
        "available_hours": "9:00 AM - 5:00 PM",
        "working_days": "Mon - Fri",
    },
]

PASSWORD = "Doctor@123"


async def seed():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]

    hashed = hash_password(PASSWORD)
    inserted = 0
    skipped = 0

    for doc in DOCTORS:
        existing = await db.users.find_one({"email": doc["email"]})
        if existing:
            print(f"  SKIP  {doc['email']} (already exists)")
            skipped += 1
            continue

        user = {
            **doc,
            "hashed_password": hashed,
            "role": "provider",
            "status": "active",
            "profile_completed": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        await db.users.insert_one(user)
        print(f"  ADD   {doc['email']}  —  {doc['specialty']}")
        inserted += 1

    print(f"\nDone! Inserted {inserted}, skipped {skipped}.")
    print(f"Login with any doctor email + password: {PASSWORD}")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
