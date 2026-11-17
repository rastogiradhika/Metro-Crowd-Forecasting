from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class NetworkSummaryKPI(BaseModel):
    critical: int
    high: int
    moderate: int
    low: int
    total_inflow: int
    avg_station_inflow: int


class PriorityAlertItem(BaseModel):
    station_id: int
    station_name: str
    line: str
    predicted_inflow: int
    risk_level: str
    horizon_minutes: int
    reason: str


class StationTableItem(BaseModel):
    station_id: int
    station_name: str
    line: str
    predicted_inflow: int
    risk_level: str
    horizon_minutes: int
    trend: str  # "UP" | "DOWN"
    interchange: bool = False


class PredictiveAlertBanner(BaseModel):
    station_id: int
    station_name: str
    horizon_minutes: int
    text: str


class DashboardResponse(BaseModel):
    horizon: int
    updated_at: str
    summary: NetworkSummaryKPI
    priority_alerts: List[PriorityAlertItem]
    active_predictive_alert: Optional[PredictiveAlertBanner] = None
    forecasts: List[StationTableItem]
    meta: Optional[Dict[str, Any]] = None
