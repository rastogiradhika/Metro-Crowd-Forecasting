import os
import csv
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.station import Station
from app.core.config import BACKEND_DIR

logger = logging.getLogger("metroai.stations")

# Absolute path resolution to GTFS dataset (checks local backend data folder first for standalone Render deployment)
WORKSPACE_ROOT = os.path.dirname(BACKEND_DIR)
LOCAL_MASTER_CSV = os.path.join(BACKEND_DIR, "data", "station_master.csv")
WORKSPACE_MASTER_CSV = os.path.join(
    WORKSPACE_ROOT, "DelhiMetro_CrowdPrediction", "Output", "phase2_station_master", "station_master.csv"
)
STATION_MASTER_CSV = LOCAL_MASTER_CSV if os.path.exists(LOCAL_MASTER_CSV) else WORKSPACE_MASTER_CSV

LOCAL_STOPS_CSV = os.path.join(BACKEND_DIR, "data", "clean_stops.csv")
WORKSPACE_STOPS_CSV = os.path.join(
    WORKSPACE_ROOT, "DelhiMetro_CrowdPrediction", "data", "processed", "clean_stops.csv"
)
DEFAULT_STOPS_CSV = LOCAL_STOPS_CSV if os.path.exists(LOCAL_STOPS_CSV) else WORKSPACE_STOPS_CSV

# Line assignment mapping for Delhi Metro station IDs
LINE_MAP = {
    (1, 21): "RED",
    (22, 37): "GREEN",
    (38, 58): "BLUE",
    (59, 59): "YELLOW",  # Hauz Khas is YELLOW Line
    (60, 77): "BLUE",
    (78, 110): "YELLOW",
    (111, 145): "VIOLET",
    (146, 185): "PINK",
    (186, 215): "MAGENTA",
    (216, 223): "PINK",
    (224, 232): "RED",
    (233, 238): "BLUE",
    (239, 241): "GRAY",
    (500, 520): "AQUA"   # Aqua Line non-contiguous IDs 500-520
}


def get_line_for_id(station_id: int) -> str:
    if station_id == 59:
        return "YELLOW"
    for (start, end), line in LINE_MAP.items():
        if start <= station_id <= end:
            return line
    return "YELLOW"


def seed_stations_if_empty(db: Session):
    """Populates stations table from clean_stops.csv on first run if empty."""
    count = db.query(Station).count()
    if count > 0:
        return

    csv_path = STATION_MASTER_CSV if os.path.exists(STATION_MASTER_CSV) else DEFAULT_STOPS_CSV
    if not os.path.exists(csv_path):
        logger.warning(f"Station master dataset not found at {csv_path}. Creating fallback stations.")
        fallback = [
            Station(station_id=50, name="Rajiv Chowk", lat=28.6328, lon=77.2197, line="BLUE", gates=8, lifts=5, platforms=4, concourses=3, interchange=True),
            Station(station_id=59, name="Hauz Khas", lat=28.5431, lon=77.2064, line="BLUE", gates=4, lifts=9, platforms=4, concourses=3, interchange=True),
            Station(station_id=8, name="Kashmere Gate", lat=28.6679, lon=77.2280, line="RED", gates=7, lifts=6, platforms=6, concourses=3, interchange=True),
        ]
        db.add_all(fallback)
        db.commit()
        return

    stations_to_add = []
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                sid = int(row["stop_id"])
                name = row["stop_name"]
                lat = float(row["stop_lat"])
                lon = float(row["stop_lon"])
                line = get_line_for_id(sid)
                
                is_interchange = sid in [8, 13, 16, 37, 40, 45, 50, 59, 61, 70, 75, 120]
                # Parse infrastructure, treating 0 as unknown/unspecified and applying operational minimums
                raw_gates = int(float(row["num_gates"])) if row.get("num_gates") and row["num_gates"] != "" else 0
                raw_lifts = int(float(row["num_lifts"])) if row.get("num_lifts") and row["num_lifts"] != "" else 0
                raw_platforms = int(float(row["num_platforms"])) if row.get("num_platforms") and row["num_platforms"] != "" else 0
                raw_concourses = int(float(row["num_concourses"])) if row.get("num_concourses") and row["num_concourses"] != "" else 0

                gates = raw_gates if raw_gates > 0 else (8 if is_interchange else 2)
                lifts = raw_lifts if raw_lifts > 0 else (6 if is_interchange else 2)
                platforms = raw_platforms if raw_platforms > 0 else (4 if is_interchange else 2)
                concourses = raw_concourses if raw_concourses > 0 else (3 if is_interchange else 2)

                stations_to_add.append(
                    Station(
                        station_id=sid,
                        name=name,
                        lat=lat,
                        lon=lon,
                        line=line,
                        gates=gates,
                        lifts=lifts,
                        platforms=platforms,
                        concourses=concourses,
                        interchange=is_interchange
                    )
                )
            except Exception as e:
                continue

    if stations_to_add:
        db.add_all(stations_to_add)
        db.commit()
        logger.info(f"Seeded {len(stations_to_add)} stations into database.")
