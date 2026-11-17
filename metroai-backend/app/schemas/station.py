from typing import Optional
from pydantic import BaseModel


class StationOut(BaseModel):
    id: int
    station_id: int
    name: str
    lat: float
    lon: float
    line: str
    gates: int = 2
    lifts: int = 2
    platforms: int = 2
    concourses: int = 2
    interchange: bool = False

    class Config:
        from_attributes = True
