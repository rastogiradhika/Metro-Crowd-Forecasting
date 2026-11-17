"""
MetroAI Database Seeding Script
Populates the 262 Delhi Metro stations and creates an operator admin account.
Run with: python seed.py
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.services.station_service import seed_stations_if_empty


def seed_database():
    print("Initializing MetroAI database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Seeding stations from GTFS master...")
        seed_stations_if_empty(db)

        # Seed default admin via environment variables (Secure DevOps Practice)
        import secrets
        raw_email = settings.ADMIN_EMAIL or os.getenv("ADMIN_EMAIL", "admin@delhimetrorail.com")
        admin_email = raw_email.strip().lower()
        admin_password = settings.ADMIN_PASSWORD or os.getenv("ADMIN_PASSWORD")
        
        if not admin_password:
            admin_password = secrets.token_urlsafe(16)
            print(f"⚠️  [WARNING] ADMIN_PASSWORD environment variable not set. Generated random temporary password: {admin_password}")
            print("Set ADMIN_PASSWORD in your .env file for production security.")

        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                password_hash=hash_password(admin_password),
                role="admin"
            )
            db.add(admin)
            db.commit()
            print(f"✅ Created default admin account: {admin_email}")
        else:
            # Update password hash if admin already exists to ensure current ADMIN_PASSWORD applies
            admin.password_hash = hash_password(admin_password)
            db.commit()
            print(f"ℹ️  Admin account {admin_email} updated with active credentials.")

        print("Database seeding completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
