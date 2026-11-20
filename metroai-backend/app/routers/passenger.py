import re
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.station import Station
from app.schemas.station import StationOut
from app.schemas.forecast import (
    PassengerForecastRequest,
    PassengerForecastResponse,
    StationForecastData,
    TravelAdvisory,
    RouteInfo,
    JourneyStop,
    HorizonPrediction
)
from app.ml.ml_service import ml_service

router = APIRouter(prefix="/api", tags=["Passenger Forecasts"])

TIME_24H_REGEX = re.compile(r"^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$")
TIME_12H_REGEX = re.compile(r"^(0?[1-9]|1[0-2]):([0-5][0-9])\s?([AaPp][Mm])$")
IST = ZoneInfo("Asia/Kolkata")


def parse_travel_time(s: str) -> datetime:
    """
    Parses and validates time string to a full timezone-aware datetime in IST.
    Supports ISO formats ('2026-11-21T16:20:00Z'), 24-hr ('08:15', '20:15'),
    and 12-hr with AM/PM ('08:15 PM', '8:15 am').
    Rejects invalid/malformed values (such as '99:99', '08:15 XM') with 400 Bad Request.
    """
    if not s or not isinstance(s, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid time format. Please provide HH:MM."
        )

    time_str = s.strip()

    if "T" in time_str:
        try:
            dt = datetime.fromisoformat(time_str.replace("Z", "+00:00"))
            return dt.astimezone(IST) if dt.tzinfo else dt.replace(tzinfo=IST)
        except (ValueError, Exception):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid time format. Please provide HH:MM."
            )

    match_24 = TIME_24H_REGEX.match(time_str)
    if match_24:
        hour = int(match_24.group(1))
        minute = int(match_24.group(2))
    else:
        match_12 = TIME_12H_REGEX.match(time_str)
        if match_12:
            raw_hour = int(match_12.group(1))
            minute = int(match_12.group(2))
            meridiem = match_12.group(3).upper()
            if meridiem == "AM":
                hour = 0 if raw_hour == 12 else raw_hour
            else:
                hour = 12 if raw_hour == 12 else raw_hour + 12
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid time format. Please provide HH:MM (24h) or HH:MM AM/PM."
            )

    return datetime.now(IST).replace(
        hour=hour,
        minute=minute,
        second=0,
        microsecond=0
    )


@router.get("/stations", response_model=List[StationOut])
def list_stations(db: Session = Depends(get_db)):
    """Public list of all 262 Delhi Metro stations."""
    stations = db.query(Station).order_by(Station.station_id).all()
    return stations


@router.get("/passenger/forecast/{station_id}", response_model=StationForecastData)
def get_station_forecast(
    station_id: int,
    time: str = Query("08:15", description="Travel time string (e.g., '08:15' or ISO datetime)"),
    db: Session = Depends(get_db)
):
    """
    Public Endpoint:
    Takes station_id and travel time, calls the pre-trained XGBoost ML service,
    and returns passenger crowd forecasts across horizons (+10m, +20m, +30m).
    """
    station = db.query(Station).filter(Station.station_id == station_id).first()
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Station ID {station_id} not found."
        )

    when = parse_travel_time(time)
    pred = ml_service.predict(station_id, when)

    return StationForecastData(
        station_id=station.station_id,
        station_name=station.name,
        line=station.line,
        forecast_time=time,
        predicted_inflow=pred["predicted_inflow"],
        risk_level=pred["risk_level"],
        horizon_minutes=pred["horizon_minutes"],
        gates=station.gates,
        lifts=station.lifts,
        platforms=station.platforms,
        horizon_series=[
            HorizonPrediction(
                horizon=item["horizon"],
                inflow=item["inflow"],
                risk=item["risk"]
            )
            for item in pred["horizon_series"]
        ],
        meta=ml_service.meta()
    )


@router.post("/forecast", response_model=PassengerForecastResponse)
def compute_journey_forecast(
    payload: PassengerForecastRequest,
    db: Session = Depends(get_db)
):
    """
    Computes journey predictions between origin and destination stations.
    Runs XGBoost inference on origin and destination arrival time,
    then generates an intelligent travel advisory.
    """
    if payload.origin_id == payload.destination_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Origin and destination stations cannot be identical."
        )

    origin = db.query(Station).filter(Station.station_id == payload.origin_id).first()
    dest = db.query(Station).filter(Station.station_id == payload.destination_id).first()

    if not origin or not dest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specified origin or destination station does not exist."
        )

    when = parse_travel_time(payload.travel_time)

    # 1. Predict Origin Inflow
    origin_pred = ml_service.predict(origin.station_id, when)

    # 2. Predict Destination Inflow (approx 30 mins travel window)
    dest_when = when + timedelta(minutes=30)
    dest_pred = ml_service.predict(dest.station_id, dest_when)

    # 3. Build Route
    route = RouteInfo(
        origin=JourneyStop(id=origin.station_id, name=origin.name, line=origin.line),
        destination=JourneyStop(id=dest.station_id, name=dest.name, line=dest.line),
        intermediate=[]
    )

    # 4. Generate Smart Advisory with proper Risk Ranking (Fix I5)
    RISK_RANK = {"LOW": 0, "MODERATE": 1, "HIGH": 2, "CRITICAL": 3}
    origin_risk = origin_pred["risk_level"]

    # Only suggest time shift if current risk is HIGH or CRITICAL
    if RISK_RANK.get(origin_risk, 0) >= RISK_RANK["HIGH"]:
        series = origin_pred.get("horizon_series", [])
        if series:
            # Pick the horizon (10m, 20m, 30m) with the lowest inflow
            best_entry = min(series, key=lambda x: x["inflow"])
            best_offset = best_entry["horizon"]
            later_when = when + timedelta(minutes=best_offset)
            advisory = TravelAdvisory(
                level=origin_risk,
                message=f"Heavy crowd expected at {origin.name}. Boarding +{best_offset} mins later has significantly lower crowd (~{best_entry['inflow']} people).",
                gate_recommendation=None,
                suggest_time_offset=best_offset,
                later_time=f"{later_when.hour:02d}:{later_when.minute:02d}"
            )
        else:
            advisory = TravelAdvisory(
                level=origin_risk,
                message=f"High passenger crowd expected at {origin.name}. Allow extra time for platform boarding.",
                gate_recommendation=None,
                suggest_time_offset=None,
                later_time=None
            )
    elif origin_risk == "MODERATE":
        advisory = TravelAdvisory(
            level="MODERATE",
            message=f"Moderate crowd expected at {origin.name}. Steady commuter flow across ticket halls and platforms.",
            gate_recommendation=None,
            suggest_time_offset=None,
            later_time=None
        )
    else:
        advisory = TravelAdvisory(
            level="LOW",
            message=f"Comfortable travel conditions expected at {origin.name}. Minimal queues and smooth boarding.",
            gate_recommendation=None,
            suggest_time_offset=None,
            later_time=None
        )

    return PassengerForecastResponse(
        origin=StationForecastData(
            station_id=origin.station_id,
            station_name=origin.name,
            line=origin.line,
            forecast_time=payload.travel_time,
            predicted_inflow=origin_pred["predicted_inflow"],
            risk_level=origin_pred["risk_level"],
            horizon_minutes=20,
            gates=origin.gates,
            lifts=origin.lifts,
            platforms=origin.platforms,
            horizon_series=[
                HorizonPrediction(horizon=it["horizon"], inflow=it["inflow"], risk=it["risk"])
                for it in origin_pred["horizon_series"]
            ],
            meta=ml_service.meta()
        ),
        destination=StationForecastData(
            station_id=dest.station_id,
            station_name=dest.name,
            line=dest.line,
            forecast_time=f"{dest_when.hour:02d}:{dest_when.minute:02d}",
            predicted_inflow=dest_pred["predicted_inflow"],
            risk_level=dest_pred["risk_level"],
            horizon_minutes=20,
            gates=dest.gates,
            lifts=dest.lifts,
            platforms=dest.platforms,
            horizon_series=[
                HorizonPrediction(horizon=it["horizon"], inflow=it["inflow"], risk=it["risk"])
                for it in dest_pred["horizon_series"]
            ],
            meta=ml_service.meta()
        ),
        route=route,
        advisory=advisory,
        meta=ml_service.meta()
    )
