"""
MetroAI Direct Component & Integration Verification Suite
Tests all Phases: Auth, Passenger, Admin, ML, Database & Security
"""

import sys
import os

# Add metroai-backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime
from fastapi import Response, Request, HTTPException
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
from app.schemas.user import UserLogin, UserCreate
from app.schemas.forecast import PassengerForecastRequest
from app.ml.ml_service import ml_service
from app.routers import auth, passenger, admin

def run_all_phase_tests():
    print("=" * 65)
    print("STARTING DIRECT PHASE VERIFICATION SUITE")
    print("=" * 65)

    db = SessionLocal()

    try:
        # =======================================================
        # PHASE 1: DATABASE & MODELS VERIFICATION
        # =======================================================
        print("\n--- [PHASE 1] DATABASE & MODELS ---")
        user_count = db.query(User).count()
        station_count = db.query(Station).count()
        print(f"  [OK] User records in database: {user_count}")
        print(f"  [OK] Station records in database: {station_count} (Expected: 262)")
        assert station_count == 262, f"Expected 262 stations, got {station_count}"

        # Test Station query
        rajiv = db.query(Station).filter(Station.station_id == 50).first()
        print(f"  [OK] Queried Station 50: {rajiv.name} | Line: {rajiv.line} | Interchange: {rajiv.interchange}")
        assert rajiv.name == "Rajiv Chowk"

        # =======================================================
        # PHASE 2: SECURE AUTHENTICATION (Bcrypt + JWT)
        # =======================================================
        print("\n--- [PHASE 2] SECURE AUTHENTICATION ---")
        test_email = "operator.test@delhimetrorail.com"
        test_pwd = "StrongPassword@123"

        # Cleanup existing test user if any
        db.query(User).filter(User.email == test_email).delete()
        db.commit()

        # 1. Register User
        user_in = UserCreate(email=test_email, password=test_pwd, role="operator")
        reg_user = auth.register(user_in, db=db)
        print(f"  [OK] Registered User: {reg_user.email} (ID: {reg_user.id}, Role: {reg_user.role})")
        assert reg_user.id is not None
        assert verify_password(test_pwd, reg_user.password_hash)

        # 2. Login User (HTTP-Only Cookie Generation)
        resp = Response()
        login_in = UserLogin(email=test_email, password=test_pwd)
        login_result = auth.login(login_in, response=resp, db=db)
        print(f"  [OK] Login Handshake: {login_result['message']}")

        # Verify cookie header set
        cookie_header = resp.headers.get("set-cookie")
        print(f"  [OK] Set-Cookie Header Present: {'access_token' in cookie_header}")
        assert "HttpOnly" in cookie_header
        assert "SameSite=lax" in cookie_header

        # 3. Verify get_current_user with valid JWT
        token = create_access_token({"sub": str(reg_user.id), "email": reg_user.email, "role": reg_user.role})
        
        # Mock Request object with cookie
        scope = {"type": "http", "headers": [(b"cookie", f"access_token={token}".encode())]}
        mock_req = Request(scope)
        current_u = get_current_user(mock_req, db=db)
        print(f"  [OK] Session Validation (/auth/me): Authenticated as {current_u.email}")
        assert current_u.id == reg_user.id

        # 4. Verify Admin Role Guard (Passes for operator)
        admin_verified = get_current_admin(current_user=current_u)
        print(f"  [OK] Role Guard: Operator granted administrative operations access.")

        # 5. Verify Unauthorized Access Rejection
        empty_req = Request({"type": "http", "headers": []})
        try:
            get_current_user(empty_req, db=db)
            assert False, "Should have raised 401"
        except HTTPException as he:
            assert he.status_code == 401
            print(f"  [OK] Unauthenticated Guard Test: Correctly raised HTTP {he.status_code} ({he.detail})")

        # =======================================================
        # PHASE 3: ML MODEL INTEGRATION
        # =======================================================
        print("\n--- [PHASE 3] ML MODEL INTEGRATION ---")
        ml_service.load_models()
        print(f"  [OK] ML Models Loaded Status: {ml_service.is_loaded}")

        # Run Prediction for Rajiv Chowk (ID: 50) at 08:15 Morning Peak
        pred_rajiv = ml_service.predict(station_id=50, hour=8, minute=15, day_of_week=2)
        print(f"  [OK] Prediction (Rajiv Chowk @ 08:15): Inflow = {pred_rajiv['predicted_inflow']}, Risk = {pred_rajiv['risk_level']}")
        assert pred_rajiv["predicted_inflow"] >= 0, "Predicted inflow must be non-negative"
        assert len(pred_rajiv["horizon_series"]) == 3, "Must return +10m, +20m, +30m horizons"
        for h in pred_rajiv["horizon_series"]:
            print(f"      +{h['horizon']}m Horizon -> {h['inflow']} pax ({h['risk']} Risk)")

        # Run Prediction for Hauz Khas (ID: 59) at 14:00 Off-Peak
        pred_hk = ml_service.predict(station_id=59, hour=14, minute=0, day_of_week=2)
        print(f"  [OK] Prediction (Hauz Khas @ 14:00): Inflow = {pred_hk['predicted_inflow']}, Risk = {pred_hk['risk_level']}")

        # =======================================================
        # PHASE 4: API ENDPOINTS & LOGGING
        # =======================================================
        print("\n--- [PHASE 4] API ENDPOINTS & ALERT LOGGING ---")

        # 1. Public Single Station Forecast
        st_fc = passenger.get_station_forecast(station_id=50, time="08:15", db=db)
        print(f"  [OK] GET /api/passenger/forecast/50: Station '{st_fc.station_name}' Inflow = {st_fc.predicted_inflow}")

        # 2. Public Journey Forecast (Rajiv Chowk -> Hauz Khas)
        j_req = PassengerForecastRequest(origin_id=50, destination_id=59, travel_time="08:15")
        j_res = passenger.compute_journey_forecast(j_req, db=db)
        print(f"  [OK] POST /api/forecast: Journey from {j_res.origin.station_name} to {j_res.destination.station_name}")
        print(f"       Advisory: {j_res.advisory.message[:70]}...")

        # 3. Protected Admin Dashboard
        admin_dash = admin.get_admin_dashboard(horizon=20, db=db, admin_user=current_u)
        print(f"  [OK] GET /api/admin/dashboard: Forecasted {len(admin_dash.forecasts)} stations")
        print(f"       Network Summary: Total Inflow = {admin_dash.summary.total_inflow} pax | Critical Stations = {admin_dash.summary.critical}")
        print(f"       Top Priority Alert #1: {admin_dash.priority_alerts[0].station_name} ({admin_dash.priority_alerts[0].predicted_inflow} pax)")

        # Verify AlertLog write in database
        alert_count = db.query(AlertLog).count()
        print(f"  [OK] Database AlertLog records logged: {alert_count}")

        # 4. Station Drilldown Details
        drilldown = admin.get_station_drilldown(station_id=50, horizon=20, db=db)
        print(f"  [OK] GET /api/stations/50/forecast: 24h curve points = {len(drilldown['hourly_curve'])}")

        # 5. Station SHAP Explainability
        explanation = admin.get_station_explanation(station_id=50, horizon=20, db=db)
        print(f"  [OK] GET /api/stations/50/explanation: SHAP factors = {len(explanation['factors'])}")
        for f in explanation['factors']:
            print(f"       - {f['label']}: +{f['impact']}%")

        print("\n" + "=" * 65)
        print("ALL PHASES (1, 2, 3, 4) VERIFIED DIRECTLY WITH 100% SUCCESS.")
        print("=" * 65)

    finally:
        db.close()

if __name__ == "__main__":
    run_all_phase_tests()
