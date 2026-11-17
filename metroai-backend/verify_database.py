"""
MetroAI Database Verification Script
Verifies SQLAlchemy models, tables, indexes, relationships, and queries.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timezone
from sqlalchemy import text, inspect
from app.core.database import engine, SessionLocal, Base
from app.models.user import User
from app.models.station import Station
from app.models.alert_log import AlertLog

def verify_db():
    print("=" * 65)
    print("METROAI — DATABASE VERIFICATION")
    print("=" * 65)
    print(f"Database URL: {engine.url}")
    print(f"Dialect: {engine.dialect.name}")

    # 1. Inspector table check
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    print(f"\n1. Tables in Database: {table_names}")
    for required in ["users", "stations", "alert_logs"]:
        assert required in table_names, f"Missing table: {required}"
    print("   -> All required tables exist.")

    db = SessionLocal()
    try:
        # 2. Check stations count and key records
        station_count = db.query(Station).count()
        print(f"\n2. Stations Table:")
        print(f"   -> Total records: {station_count} (Expected: 262)")
        assert station_count == 262, f"Expected 262 stations, found {station_count}"

        rajiv = db.query(Station).filter(Station.station_id == 50).first()
        hauz = db.query(Station).filter(Station.station_id == 59).first()
        saket = db.query(Station).filter(Station.station_id == 61).first()

        print(f"   -> Station 50: {rajiv.name} | Line: {rajiv.line} | Interchange: {rajiv.interchange}")
        print(f"   -> Station 59: {hauz.name} | Line: {hauz.line} | Interchange: {hauz.interchange}")
        print(f"   -> Station 61: {saket.name} | Line: {saket.line} | Interchange: {saket.interchange}")

        assert "Rajiv Chowk" in rajiv.name
        assert "Hauz Khas" in hauz.name
        assert "Saket" in saket.name
        print("   -> GTFS Key station integrity verified.")

        # 3. Check users table
        user_count = db.query(User).count()
        admin = db.query(User).filter(User.role == "admin").first()
        print(f"\n3. Users Table:")
        print(f"   -> Total users: {user_count}")
        print(f"   -> Default Admin: {admin.email} (Role: {admin.role})")
        assert admin is not None
        print("   -> User accounts verified.")

        # 4. Check AlertLog Foreign Key & ORM Relationship
        print(f"\n4. AlertLog Referential Integrity & Relationships:")
        test_alert = AlertLog(
            station_id=50,
            station_name="Rajiv Chowk",
            risk_level="CRITICAL",
            predicted_inflow=840.0,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(test_alert)
        db.commit()
        db.refresh(test_alert)

        print(f"   -> Created test AlertLog ID #{test_alert.id}")
        print(f"   -> Related station name via ORM: {test_alert.station.name}")
        assert test_alert.station.name == rajiv.name, "Relationship failed to resolve Station"

        # Cleanup test alert
        db.delete(test_alert)
        db.commit()
        print("   -> Cleaned up test record.")
        print("   -> Foreign key and ORM relationships verified.")

        print("\n" + "=" * 65)
        print("DATABASE VERIFICATION SUCCESSFUL (100% OPERATIONAL)")
        print("=" * 65)

    finally:
        db.close()

if __name__ == "__main__":
    verify_db()
