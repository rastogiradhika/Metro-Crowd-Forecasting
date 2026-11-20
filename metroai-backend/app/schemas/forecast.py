from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class HorizonPrediction(BaseModel):
    horizon: int  # 10, 20, 30
    inflow: int
    risk: str     # LOW, MODERATE, HIGH, CRITICAL


class StationForecastData(BaseModel):
    station_id: int
    station_name: str
    line: str
    forecast_time: str
    predicted_inflow: int
    risk_level: str
    horizon_minutes: int = 20
    gates: int = 2
    lifts: int = 2
    platforms: int = 2
    horizon_series: Optional[List[HorizonPrediction]] = None
    meta: Optional[Dict[str, Any]] = None


class TravelAdvisory(BaseModel):
    level: str
    message: str
    gate_recommendation: Optional[str] = None
    suggest_time_offset: Optional[int] = None
    later_time: Optional[str] = None


class JourneyStop(BaseModel):
    id: int
    name: str
    line: str


class RouteInfo(BaseModel):
    origin: JourneyStop
    destination: JourneyStop
    intermediate: List[JourneyStop] = []


class PassengerForecastRequest(BaseModel):
    origin_id: int = Field(..., ge=1, le=600, description="ID of departure station")
    destination_id: int = Field(..., ge=1, le=600, description="ID of destination station")
    travel_time: str = Field(..., min_length=4, max_length=35, description="Target departure time, e.g. '08:15' or ISO string")


class PassengerForecastResponse(BaseModel):
    origin: StationForecastData
    destination: StationForecastData
    route: RouteInfo
    advisory: TravelAdvisory
    meta: Optional[Dict[str, Any]] = None


# Direct single station forecast (for drilldown)
class SingleStationForecastResponse(BaseModel):
    station_id: int
    station_name: str
    line: str
    gates: int
    lifts: int
    platforms: int
    concourses: int
    interchange: bool
    forecast_series: List[Dict[str, Any]]
    hourly_curve: List[Dict[str, Any]]
    train_status: Dict[str, Any]
    recommendation: Dict[str, Any]
