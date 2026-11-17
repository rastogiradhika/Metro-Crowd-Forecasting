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

TIME_FORMAT_REGEX = re.compile(r"^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$")
IST = ZoneInfo("Asia/Kolkata")


def parse_travel_time(s: str) -> datetime:
    """
    Parses and validates time string to a full timezone-aware datetime in IST.
    Supports ISO formats ('2026-11-21T16:20:00Z') preserving calendar dates,
    and 24-hr time strings ('08:15', '16:20').
    Rejects invalid/malformed values (such as '99:99' or non-time strings) with 400 Bad Request.
    """
    if not s or not isinstance(s, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid time format. Please provide HH:MM."
        )

    if "T" in s:
        try:
            dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
            return dt.astimezone(IST) if dt.tzinfo else dt.replace(tzinfo=IST)
        except (ValueError, Exception):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid time format. Please provide HH:MM."
            )

    cleaned = s.replace("AM", "").replace("PM", "").replace("am", "").replace("pm", "").strip()
    match = TIME_FORMAT_REGEX.match(cleaned)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid time format. Please provide HH:MM."
        )

    return datetime.now(IST).replace(
        hour=int(match.group(1)),
        minute=int(match.group(2)),
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
    station = db.query(Station).filter((Station.station_id == station_id) | (Station.id == station_id)).first()
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

    origin = db.query(Station).filter((Station.station_id == payload.origin_id) | (Station.id == payload.origin_id)).first()
    dest = db.query(Station).filter((Station.station_id == payload.destination_id) | (Station.id == payload.destination_id)).first()

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

    # 4. Generate Smart Advisory
    if origin_pred["risk_level"] in ["HIGH", "CRITICAL"]:
        later_when = when + timedelta(minutes=25)
        advisory = TravelAdvisory(
            level=origin_pred["risk_level"],
            message=f"High passenger inflow expected at {origin.name}. Concourse queue times may exceed 10 minutes.",
            gate_recommendation=f"Use Gate {origin.gates} for faster security check clearance.",
            suggest_time_offset=25,
            later_time=f"{later_when.hour:02d}:{later_when.minute:02d}"
        )
    else:
        advisory = TravelAdvisory(
            level="LOW",
            message=f"Comfortable travel conditions expected at {origin.name}. Smooth transit flow across turnstiles.",
            gate_recommendation=f"Gates 1 through {origin.gates} open with minimal wait.",
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
