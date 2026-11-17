from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from typing import List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

IST = ZoneInfo("Asia/Kolkata")

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.station import Station
from app.models.alert_log import AlertLog
from app.models.user import User
from app.schemas.dashboard import (
    DashboardResponse,
    NetworkSummaryKPI,
    PriorityAlertItem,
    StationTableItem,
    PredictiveAlertBanner
)
from app.ml.ml_service import ml_service

router = APIRouter(prefix="/api", tags=["Operations Center (Admin)"])


@router.get("/admin/dashboard", response_model=DashboardResponse)
@router.get("/admin/forecast", response_model=DashboardResponse)
def get_admin_dashboard(
    horizon: int = Query(20, description="Forecast horizon minutes (10, 20, 30)"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    """
    PROTECTED ENDPOINT (Admin Only):
    Returns network-wide passenger inflow predictions for all 262 stations,
    calculates system KPIs, finds top 5 critical alerts, and automatically
    logs critical alerts to the PostgreSQL `alert_logs` table.
    Uses batched XGBoost inference across all stations in a single call.
    """
    if horizon not in (10, 20, 30):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid horizon. Allowed values are 10, 20, or 30."
        )

    stations = db.query(Station).all()
    if not stations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No station records loaded in system."
        )

    now_ist = datetime.now(IST)
    batch_preds = ml_service.predict_batch(stations, now_ist)

    station_forecasts = []
    total_inflow = 0
    kpi_counts = {"CRITICAL": 0, "HIGH": 0, "MODERATE": 0, "LOW": 0}
    alerts_to_log = []

    for pred in batch_preds:
        sid = pred["station_id"]
        inflow = pred.get(f"inflow_{horizon}m", pred["predicted_inflow"])
        risk = pred.get(f"risk_{horizon}m", pred["risk_level"])
        s_name = pred["station_name"]
        line = pred["line"]
        interchange = pred["interchange"]

        kpi_counts[risk] = kpi_counts.get(risk, 0) + 1
        total_inflow += inflow

        # Determine trend based on +10m vs +30m
        trend = "UP" if pred.get("inflow_30m", inflow) >= pred.get("inflow_10m", inflow) else "DOWN"

        station_forecasts.append(
            StationTableItem(
                station_id=sid,
                station_name=s_name,
                line=line,
                predicted_inflow=inflow,
                risk_level=risk,
                horizon_minutes=horizon,
                trend=trend,
                interchange=interchange
            )
        )

        # Log CRITICAL stations to AlertLog
        if risk == "CRITICAL":
            alerts_to_log.append(
                AlertLog(
                    station_id=sid,
                    station_name=s_name,
                    risk_level=risk,
                    predicted_inflow=float(inflow),
                    timestamp=datetime.now(timezone.utc)
                )
            )

    # Persist critical alerts into database (deduped within 15-minute operational window)
    if alerts_to_log:
        try:
            from datetime import timedelta
            cutoff = datetime.now(timezone.utc) - timedelta(minutes=15)
            recent_logged = {row[0] for row in db.query(AlertLog.station_id).filter(AlertLog.timestamp >= cutoff).all()}
            deduped_alerts = [a for a in alerts_to_log if a.station_id not in recent_logged]
            if deduped_alerts:
                db.add_all(deduped_alerts)
                db.commit()
        except Exception as e:
            db.rollback()

    # Sort descending to find highest inflow priority alerts
    sorted_forecasts = sorted(station_forecasts, key=lambda x: x.predicted_inflow, reverse=True)
    top_5_alerts = []

    for item in sorted_forecasts[:5]:
        reason = (
            f"Major peak transfer hub on {item.line} Line experiencing heavy commuter volume."
            if item.interchange
            else f"Substantial entrance influx along {item.line} transit corridor."
        )
        top_5_alerts.append(
            PriorityAlertItem(
                station_id=item.station_id,
                station_name=item.station_name,
                line=item.line,
                predicted_inflow=item.predicted_inflow,
                risk_level=item.risk_level,
                horizon_minutes=horizon,
                reason=reason
            )
        )

    # Active predictive alert banner
    top_alert = top_5_alerts[0] if top_5_alerts else None
    active_banner = None
    if top_alert and top_alert.risk_level in ["CRITICAL", "HIGH"]:
        active_banner = PredictiveAlertBanner(
            station_id=top_alert.station_id,
            station_name=top_alert.station_name,
            horizon_minutes=horizon,
            text=f"Predicted inflow of {top_alert.predicted_inflow} pax entering at {top_alert.station_name} within +{horizon} minutes. Recommended to activate crowd diversion gates."
        )

    summary_kpi = NetworkSummaryKPI(
        critical=kpi_counts["CRITICAL"],
        high=kpi_counts["HIGH"],
        moderate=kpi_counts["MODERATE"],
        low=kpi_counts["LOW"],
        total_inflow=total_inflow,
        avg_station_inflow=total_inflow // max(1, len(stations))
    )

    return DashboardResponse(
        horizon=horizon,
        updated_at=datetime.now(timezone.utc).isoformat(),
        summary=summary_kpi,
        priority_alerts=top_5_alerts,
        active_predictive_alert=active_banner,
        forecasts=station_forecasts,
        meta=ml_service.meta()
    )


@router.get("/stations/{station_id}/forecast")
def get_station_drilldown(
    station_id: int,
    horizon: int = Query(20),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    """Station detail drilldown: provides forecast series, 24-hr hourly curve, and train status."""
    if horizon not in (10, 20, 30):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid horizon. Allowed values are 10, 20, or 30."
        )

    st = db.query(Station).filter((Station.station_id == station_id) | (Station.id == station_id)).first()
    if not st:
        raise HTTPException(status_code=404, detail="Station not found")

    now = datetime.now(IST)
    pred = ml_service.predict(station_id, now)

    # Build 24-hour curve
    hourly_curve = []
    for h in range(6, 24):
        pax = ml_service._get_synthetic_station_baseline(station_id, h, 0)
        hourly_curve.append({
            "hour": f"{h:02d}:00",
            "inflow": int(round(pax)),
            "isCurrent": h == now.hour
        })

    return {
        "station_id": st.station_id,
        "station_name": st.name,
        "line": st.line,
        "gates": st.gates,
        "lifts": st.lifts,
        "platforms": st.platforms,
        "concourses": st.concourses,
        "interchange": st.interchange,
        "forecast_series": [
            {"horizon": 10, "predicted_inflow": pred["inflow_10m"], "risk_level": pred["risk_10m"]},
            {"horizon": 20, "predicted_inflow": pred["inflow_20m"], "risk_level": pred["risk_20m"]},
            {"horizon": 30, "predicted_inflow": pred["inflow_30m"], "risk_level": pred["risk_30m"]},
        ],
        "hourly_curve": hourly_curve,
        "train_status": {
            "headway_mins": 3 if st.interchange else 5,
            "trains_description": f"Active on standard {st.line} Line timetable with approximately {3 if st.interchange else 5}-minute service frequency."
        },
        "recommendation": {
            "action": f"Maintain standard turnstile monitoring at {st.name}. Ensure clear platform clearance."
        },
        "meta": ml_service.meta()
    }


@router.get("/stations/{station_id}/explanation")
def get_station_explanation(
    station_id: int,
    horizon: int = Query(20),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    """
    Feature attribution explanation endpoint.
    Honest response: Returns available=False when live TreeSHAP values are not computed,
    preventing fabricated constants from being served to operators.
    """
    if horizon not in (10, 20, 30):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid horizon. Allowed values are 10, 20, or 30."
        )

    st = db.query(Station).filter((Station.station_id == station_id) | (Station.id == station_id)).first()
    if not st:
        raise HTTPException(status_code=404, detail="Station not found")

    return {
        "station_id": station_id,
        "available": False,
        "message": "Explanation not available",
        "factors": []
    }


@router.get("/admin/alerts/history")
def get_alert_history(
    limit: int = Query(50, ge=1, le=200, description="Max alert records to retrieve (1-200)"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    """Retrieves logged critical alert records from database."""
    logs = db.query(AlertLog).order_by(AlertLog.timestamp.desc()).limit(limit).all()
    return logs
