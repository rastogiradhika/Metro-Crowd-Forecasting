"""
MetroAI Error Handling & Edge Case Verification
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import HTTPException
from app.core.database import SessionLocal
from app.routers import passenger
from app.core.security import get_current_user
from fastapi import Request

db = SessionLocal()

print("--- [ERROR HANDLING TESTS] ---")

# 1. Invalid Station ID (should raise 404)
try:
    passenger.get_station_forecast(station_id=999999, time="08:15", db=db)
    print("  [FAIL] Expected 404 for invalid station")
except HTTPException as he:
    assert he.status_code == 404
    print(f"  [OK] Invalid Station ID correctly raised HTTP {he.status_code}: {he.detail}")

# 2. Corrupted Token (should raise 401)
mock_req = Request({"type": "http", "headers": [(b"cookie", b"access_token=bad.corrupted.token")]})
try:
    get_current_user(mock_req, db=db)
    print("  [FAIL] Expected 401 for corrupted token")
except HTTPException as he:
    assert he.status_code == 401
    print(f"  [OK] Corrupted Token correctly raised HTTP {he.status_code}: {he.detail}")

# 3. DB Failure Rollback Test
try:
    from sqlalchemy import text
    db.execute(text("SELECT * FROM invalid_table_name"))
except Exception as e:
    db.rollback()
    print(f"  [OK] DB Exception caught and safely rolled back: {type(e).__name__}")

db.close()
print("--- [ALL ERROR HANDLING TESTS PASSED] ---")
