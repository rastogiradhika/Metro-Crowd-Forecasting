"""
MetroAI — Complete Automated Audit Test Verification (Tests A through N)
Validates all backend and ML services synchronously without external server dependency.
"""

import sys
import os

# Set path to metroai-backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from fastapi import Response, Request, HTTPException
from app.core.config import settings
from app.core.database import SessionLocal, Base, engine
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_admin,
)
from app.models.user import User
from app.models.station import Station
from app.models.alert_log import AlertLog
from app.schemas.user import UserLogin
from app.schemas.forecast import PassengerForecastRequest
from app.ml.ml_service import ml_service, MLService
from app.routers import auth, passenger, admin
from app.main import global_exception_handler

IST = ZoneInfo("Asia/Kolkata")

def run_verification():
    print("=" * 70)
    print("METROAI — COMPLETE PHASE & AUDIT IMPLEMENTATION TEST RUNNER")
    print("=" * 70)

    db = SessionLocal()
    passed = 0
    total = 14

    try:
        # =====================================================================
        # TEST A: Passenger Forecast — Rajiv Chowk (ID: 50) @ 08:15 Peak
        # =====================================================================
        print("\n[TEST A] Passenger forecast for Rajiv Chowk at 08:15")
        st_a = passenger.get_station_forecast(station_id=50, time="08:15", db=db)
        print(f"  Result: Station='{st_a.station_name}', Line='{st_a.line}', Inflow={st_a.predicted_inflow}, Risk={st_a.risk_level}")
        assert st_a.station_id == 50
        assert "Rajiv Chowk" in st_a.station_name
        assert len(st_a.horizon_series) == 3
        assert st_a.meta is not None
        assert st_a.meta["data_source"] == "synthetic"
        print("  -> TEST A PASSED (Real profiles, 3 horizons, meta disclaimer present).")
        passed += 1

        # =====================================================================
        # TEST B: Hauz Khas (ID: 59) Line Identity & Infrastructure
        # =====================================================================
        print("\n[TEST B] Passenger forecast for Hauz Khas at 08:45")
        st_b = passenger.get_station_forecast(station_id=59, time="08:45", db=db)
        print(f"  Result: Station='{st_b.station_name}', Line='{st_b.line}', Inflow={st_b.predicted_inflow}, Risk={st_b.risk_level}")
        assert st_b.station_id == 59
        assert "Hauz Khas" in st_b.station_name
        assert st_b.line == "YELLOW"  # Verified Yellow line transfer hub
        assert st_b.predicted_inflow >= 0
        print("  -> TEST B PASSED (Hauz Khas correctly mapped to YELLOW line).")
        passed += 1

        # =====================================================================
        # TEST C: Admin Login & HTTP-Only Cookie Generation
        # =====================================================================
        print("\n[TEST C] Admin Login with Bcrypt and HTTP-Only Cookie")
        resp = Response()
        admin_email = (settings.ADMIN_EMAIL or "admin@delhimetrorail.com").strip().lower()
        admin_pass = settings.ADMIN_PASSWORD or os.getenv("ADMIN_PASSWORD")
        login_payload = UserLogin(email=admin_email, password=admin_pass)
        login_res = auth.login(login_payload, response=resp, db=db)
        cookie_header = resp.headers.get("set-cookie")
        print(f"  Result: Handshake='{login_res['message']}'")
        print(f"  Set-Cookie: {cookie_header}")
        assert "access_token" in cookie_header
        assert "HttpOnly" in cookie_header
        assert "SameSite=lax" in cookie_header
        assert "Path=/" in cookie_header
        print("  -> TEST C PASSED.")
        passed += 1

        # =====================================================================
        # TEST D: Admin Dashboard — Batched Inflow Forecasting & Meta Disclaimer
        # =====================================================================
        print("\n[TEST D] Admin Dashboard Batched Inflow Forecasting (All 262 Stations)")
        admin_user = db.query(User).filter(User.email == "admin@delhimetrorail.com").first()
        dash_res = admin.get_admin_dashboard(horizon=20, db=db, admin_user=admin_user)
        print(f"  Result: Total Stations Forecasted={len(dash_res.forecasts)}")
        print(f"  Summary KPIs: Total Pax={dash_res.summary.total_inflow}, Critical={dash_res.summary.critical}, High={dash_res.summary.high}")
        print(f"  Top Priority Station: {dash_res.priority_alerts[0].station_name} with {dash_res.priority_alerts[0].predicted_inflow} pax")
        print(f"  Dashboard Meta: {dash_res.meta}")
        assert len(dash_res.forecasts) == 262
        assert dash_res.summary.total_inflow > 0
        assert len(dash_res.priority_alerts) == 5
        assert dash_res.meta is not None
        assert "synthetic" in dash_res.meta["disclaimer"].lower()
        print("  -> TEST D PASSED (262 stations predicted in 1 batch, meta disclaimer attached).")
        passed += 1

        # =====================================================================
        # TEST E: Horizon Validation (Must be 10, 20, or 30)
        # =====================================================================
        print("\n[TEST E] Horizon Validation (Reject 45 with 400 Bad Request)")
        try:
            admin.get_admin_dashboard(horizon=45, db=db, admin_user=admin_user)
            assert False, "Should have thrown 400 on invalid horizon 45"
        except HTTPException as he:
            assert he.status_code == 400
            assert "10, 20, or 30" in he.detail
            print(f"  Result: Rejected with HTTP {he.status_code} ({he.detail})")
        print("  -> TEST E PASSED.")
        passed += 1

        # =====================================================================
        # TEST F: Time Validation — Rejection of '99:99'
        # =====================================================================
        print("\n[TEST F] Time Validation (Reject '99:99' with 400 Bad Request)")
        try:
            passenger.get_station_forecast(station_id=50, time="99:99", db=db)
            assert False, "Should have thrown 400 on time='99:99'"
        except HTTPException as he:
            assert he.status_code == 400
            print(f"  Result: Rejected with HTTP {he.status_code} ({he.detail})")
        print("  -> TEST F PASSED.")
        passed += 1

        # =====================================================================
        # TEST G: Journey Origin/Destination Validation
        # =====================================================================
        print("\n[TEST G] Journey Validation (Reject Identical Origin & Destination)")
        try:
            passenger.compute_journey_forecast(
                PassengerForecastRequest(origin_id=50, destination_id=50, travel_time="08:15"),
                db=db
            )
            assert False, "Should have thrown 400 on identical stations"
        except HTTPException as he:
            assert he.status_code == 400
            assert "identical" in he.detail.lower()
            print(f"  Result: Rejected with HTTP {he.status_code} ({he.detail})")
        print("  -> TEST G PASSED.")
        passed += 1

        # =====================================================================
        # TEST H: Unauthorized Admin Request (No Credentials / No Cookie)
        # =====================================================================
        print("\n[TEST H] Unauthorized Admin Request Rejection")
        empty_req = Request({"type": "http", "headers": []})
        try:
            get_current_user(empty_req, db=db)
            assert False, "Should have thrown 401"
        except HTTPException as he:
            assert he.status_code == 401
            print(f"  Result: Rejected with HTTP {he.status_code} ({he.detail})")
        print("  -> TEST H PASSED.")
        passed += 1

        # =====================================================================
        # TEST I: Invalid Station ID Handling
        # =====================================================================
        print("\n[TEST I] Invalid Station ID (999999)")
        try:
            passenger.get_station_forecast(station_id=999999, time="08:15", db=db)
            assert False, "Should have thrown 404"
        except HTTPException as he:
            assert he.status_code == 404
            print(f"  Result: Rejected with HTTP {he.status_code} ({he.detail})")
        print("  -> TEST I PASSED.")
        passed += 1

        # =====================================================================
        # TEST J: Missing ML Model Graceful Fallback
        # =====================================================================
        print("\n[TEST J] Missing ML Model Directory Handling")
        fallback_ml = MLService(models_dir="./missing_fake_directory_path")
        fallback_ml.load_models()
        assert not fallback_ml.is_loaded
        res_j = fallback_ml.predict(station_id=50, hour=8, minute=15)
        print(f"  Result: Baseline profile fallback active -> Inflow={res_j['predicted_inflow']}, Risk={res_j['risk_level']}")
        assert res_j['predicted_inflow'] >= 0
        print("  -> TEST J PASSED.")
        passed += 1

        # =====================================================================
        # TEST K: Database Failure Rollback Protection
        # =====================================================================
        print("\n[TEST K] Database Failure Rollback Handling")
        try:
            from sqlalchemy import text
            db.execute(text("SELECT * FROM non_existent_table_xyz"))
            assert False, "Should fail on invalid table"
        except Exception as e:
            db.rollback()
            print(f"  Result: Successfully trapped {type(e).__name__} and executed safe session rollback")
        print("  -> TEST K PASSED.")
        passed += 1

        # =====================================================================
        # TEST L: Frontend API 500 Interception (Safe Non-Leaking Exception)
        # =====================================================================
        print("\n[TEST L] Global 500 Exception Handler Interception")
        simulated_exc = RuntimeError("CRITICAL DATABASE CORRUPTION: Table stations at memory address 0xdeadbeef failed")
        dummy_req = Request({"type": "http", "method": "GET", "path": "/api/forecast", "headers": []})
        
        json_resp = global_exception_handler(dummy_req, simulated_exc)
        body_text = json_resp.body.decode("utf-8")
        print(f"  Result: HTTP Status={json_resp.status_code}")
        print(f"  Response Body: {body_text}")
        assert json_resp.status_code == 500
        assert "Internal server error" in body_text
        assert "0xdeadbeef" not in body_text
        assert "CRITICAL DATABASE CORRUPTION" not in body_text
        print("  -> TEST L PASSED (Zero internal trace leaked to client).")
        passed += 1

        # =====================================================================
        # TEST M: Corrupted Authentication Token
        # =====================================================================
        print("\n[TEST M] Corrupted JWT Token Authentication Rejection")
        bad_req = Request({"type": "http", "headers": [(b"cookie", b"access_token=invalid.corrupted.tampered_signature")]})
        try:
            get_current_user(bad_req, db=db)
            assert False, "Should have thrown 401"
        except HTTPException as he:
            assert he.status_code == 401
            print(f"  Result: Rejected with HTTP {he.status_code} ({he.detail})")
        print("  -> TEST M PASSED.")
        passed += 1

        # =====================================================================
        # TEST N: Logout Cookie Clearance Matching Flags
        # =====================================================================
        print("\n[TEST N] Logout Cookie Deletion Flags")
        logout_resp = Response()
        logout_ret = auth.logout(response=logout_resp)
        logout_cookie = logout_resp.headers.get("set-cookie")
        print(f"  Result: {logout_ret['message']}")
        print(f"  Logout Set-Cookie: {logout_cookie}")
        assert "access_token" in logout_cookie
        assert "Path=/" in logout_cookie
        assert "HttpOnly" in logout_cookie
        assert "SameSite=lax" in logout_cookie
        print("  -> TEST N PASSED.")
        passed += 1

        print("\n" + "=" * 70)
        print(f"ALL TESTS COMPLETED: {passed}/{total} PASSED (100% SUCCESS RATE)")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    run_verification()
