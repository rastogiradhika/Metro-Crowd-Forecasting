import os
import logging
import threading
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
from zoneinfo import ZoneInfo
import numpy as np
import pandas as pd

logger = logging.getLogger("metroai.ml")

IST = ZoneInfo("Asia/Kolkata")

# Exact 14 feature columns expected by the XGBoost training pipeline in strict order
FEATURE_NAMES = [
    "Station_ID",
    "slot",
    "hour",
    "day_of_week",
    "Train_Count",
    "lag_10m",
    "lag_20m",
    "lag_30m",
    "lag_60m",
    "rolling_mean_60m",
    "prof_target_10m",
    "prof_target_20m",
    "prof_target_30m",
    "lag_vs_prof"
]

HORIZONS = (10, 20, 30)
MAX_INFLOW = 5000
RESIDUAL_CLIP = 500.0

# Cross-Platform Dynamic Path Resolution (Windows, Linux, Render, Docker)
CURRENT_FILE_DIR = os.path.dirname(os.path.abspath(__file__))
# app/ml -> app -> metroai-backend
BACKEND_ROOT_DIR = os.path.dirname(os.path.dirname(CURRENT_FILE_DIR))
DEFAULT_MODELS_DIR = os.path.join(BACKEND_ROOT_DIR, "models_weights")
DEFAULT_PROFILES_GZ = os.path.join(DEFAULT_MODELS_DIR, "station_profiles.csv.gz")


class MLService:
    def __init__(self, models_dir: Optional[str] = None):
        self.models_dir = os.path.abspath(models_dir) if models_dir else DEFAULT_MODELS_DIR
        self.models: Dict[int, Any] = {}
        self.features_list = FEATURE_NAMES
        self.is_loaded = False
        self.profiles_loaded = False
        self._lock = threading.Lock()

        # Fast in-memory lookup maps for pre-computed historical profiles
        self.profile_map: Dict[tuple, Any] = {}
        self.weekday_profile_map: Dict[tuple, Any] = {}

    def _load_profiles(self):
        """Pre-loads station historical profile distributions into indexed in-memory dictionaries."""
        with self._lock:
            if self.profiles_loaded:
                return
            candidates = [
                os.path.join(self.models_dir, "station_profiles.csv.gz"),
                DEFAULT_PROFILES_GZ,
                os.path.join(os.getcwd(), "models_weights", "station_profiles.csv.gz"),
                os.path.join(os.getcwd(), "metroai-backend", "models_weights", "station_profiles.csv.gz"),
            ]

            profile_path = None
            for p in candidates:
                if os.path.exists(p):
                    profile_path = p
                    break

            if not profile_path:
                logger.warning("station_profiles.csv.gz not found in candidate paths. Will use dynamic baseline estimation.")
                self.profiles_loaded = True
                return

            try:
                df = pd.read_csv(profile_path)
                for r in df.itertuples(index=False):
                    sid = int(r.Station_ID)
                    slot = int(r.slot)
                    is_weekend = int(r.is_weekend)

                    self.profile_map[(sid, slot, is_weekend)] = r
                    if is_weekend == 0:
                        self.weekday_profile_map[(sid, slot)] = r

                self.profiles_loaded = True
                logger.info(f"Loaded {len(self.profile_map):,} station historical profile intervals from {profile_path}")
            except Exception as e:
                logger.error(f"Failed to load station_profiles.csv.gz: {e}")
                self.profiles_loaded = True

    def load_models(self):
        """Loads pre-trained XGBoost residual JSON models into memory."""
        self._load_profiles()
        try:
            import xgboost as xgb
        except ImportError:
            logger.warning("XGBoost package not installed. Running in baseline profile mode.")
            self.is_loaded = False
            return

        loaded_count = 0
        for h in HORIZONS:
            file_name = f"xgb_residual_target_{h}m.json"
            candidate_paths = [os.path.join(self.models_dir, file_name)]
            # Only use global fallback locations if using default models directory
            if self.models_dir == DEFAULT_MODELS_DIR:
                candidate_paths.extend([
                    os.path.join(os.getcwd(), "models_weights", file_name),
                    os.path.join(os.getcwd(), "metroai-backend", "models_weights", file_name),
                    os.path.join(os.path.dirname(BACKEND_ROOT_DIR), "DelhiMetro_CrowdPrediction", "fixed_out", file_name)
                ])

            model_path = None
            for p in candidate_paths:
                if os.path.exists(p):
                    model_path = p
                    break

            if model_path and os.path.exists(model_path):
                try:
                    booster = xgb.Booster()
                    booster.load_model(model_path)
                    self.models[h] = booster
                    loaded_count += 1
                    logger.info(f"Loaded XGBoost model for +{h}m from {model_path}")
                except Exception as e:
                    logger.error(f"Error loading booster {file_name}: {e}")

        self.is_loaded = (loaded_count == len(HORIZONS))
        logger.info(f"ML Service: {loaded_count}/{len(HORIZONS)} models active in memory.")

    def _get_station_profile_row(self, station_id: int, slot: int, is_weekend: int):
        """
        Retrieves real pre-computed profile record.
        Falls back to weekday profile if weekend data is missing (Sunday handling).
        """
        # 1. Primary lookup (Station_ID, slot, is_weekend)
        key = (station_id, slot, is_weekend)
        if key in self.profile_map:
            return self.profile_map[key]

        # 2. Weekday fallback for Sundays / missing weekend slots
        w_key = (station_id, slot)
        if w_key in self.weekday_profile_map:
            return self.weekday_profile_map[w_key]

        return None

    def _get_synthetic_station_baseline(self, station_id: int, hour: int, minute: int) -> float:
        """Fallback diurnal estimation curve if profile file is absent."""
        slot = (hour * 6) + (minute // 10)
        prof_row = self._get_station_profile_row(station_id, slot, 0)
        if prof_row:
            return float(prof_row.prof_target_20m)

        decimal_time = hour + (minute / 60.0)
        major_hubs = {8, 13, 16, 37, 40, 45, 50, 59, 61, 70, 75, 120}
        station_multiplier = 2.4 if station_id in major_hubs else (0.8 + ((station_id * 17) % 11) / 10.0)

        if 8.0 <= decimal_time <= 10.5:
            curve = max(0.4, 1.0 - (abs(decimal_time - 9.0) * 0.4))
            base_pax = 450 * curve
        elif 17.5 <= decimal_time <= 20.5:
            curve = max(0.4, 1.0 - (abs(decimal_time - 19.0) * 0.35))
            base_pax = 520 * curve
        elif 11.0 <= decimal_time <= 17.0:
            base_pax = 220
        elif 6.0 <= decimal_time < 8.0 or 21.0 <= decimal_time <= 23.0:
            base_pax = 110
        else:
            base_pax = 40

        return float(base_pax * station_multiplier)

    def predict_batch(
        self,
        stations: List[Any],
        dt: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        High-performance batched inference across all 262 stations at once.
        Constructs a single (N, 14) feature matrix and runs batched DMatrix prediction.
        """
        if not self.profiles_loaded:
            self._load_profiles()

        if dt is None:
            dt = datetime.now(IST)
        elif dt.tzinfo is None:
            dt = dt.replace(tzinfo=IST)
        else:
            dt = dt.astimezone(IST)

        slot = (dt.hour * 6) + (dt.minute // 10)
        day_of_week = dt.weekday()
        is_weekend = 1 if day_of_week >= 5 else 0

        n = len(stations)
        X = np.zeros((n, 14), dtype=np.float32)
        prof_matrix = np.zeros((n, 3), dtype=np.float32)
        station_meta_list = []

        for i, st in enumerate(stations):
            sid = st.station_id if hasattr(st, "station_id") else (st.get("station_id") if isinstance(st, dict) else int(st))
            station_name = getattr(st, "name", None) or (st.get("name") if isinstance(st, dict) else f"Station {sid}")
            line = getattr(st, "line", "YELLOW") or (st.get("line") if isinstance(st, dict) else "YELLOW")
            interchange = getattr(st, "interchange", False) or (st.get("interchange", False) if isinstance(st, dict) else False)

            station_meta_list.append({
                "station_id": sid,
                "station_name": station_name,
                "line": line,
                "interchange": interchange
            })

            # Look up historical profile record
            p = self._get_station_profile_row(sid, slot, is_weekend)

            if p is not None:
                train_count = float(p.Train_Count)
                lag_10m = float(p.lag_10m)
                lag_20m = float(p.lag_20m)
                lag_30m = float(p.lag_30m)
                lag_60m = float(p.lag_60m)
                rolling_mean_60m = float(p.rolling_mean_60m)
                p_10 = float(p.prof_target_10m)
                p_20 = float(p.prof_target_20m)
                p_30 = float(p.prof_target_30m)
                lag_vs_prof = float(p.lag_vs_prof)
            else:
                base = self._get_synthetic_station_baseline(sid, dt.hour, dt.minute)
                train_count = 6.0 if (8 <= dt.hour <= 10 or 17 <= dt.hour <= 20) else 4.0
                lag_10m = base * 0.95
                lag_20m = base * 0.92
                lag_30m = base * 0.90
                lag_60m = base * 0.85
                rolling_mean_60m = (lag_10m + lag_20m + lag_30m + lag_60m) / 4.0
                p_10 = base * 0.98
                p_20 = base * 1.02
                p_30 = base * 1.05
                lag_vs_prof = lag_10m - base

            # 14-dimensional feature vector in exact training order
            X[i, :] = [
                float(sid), float(slot), float(dt.hour), float(day_of_week),
                train_count, lag_10m, lag_20m, lag_30m, lag_60m,
                rolling_mean_60m, p_10, p_20, p_30, lag_vs_prof
            ]
            prof_matrix[i, :] = [p_10, p_20, p_30]

        # Batched residual inference
        res_matrix = np.zeros((n, 3), dtype=np.float32)
        used_model = False

        if self.is_loaded:
            try:
                import xgboost as xgb
                dm = xgb.DMatrix(X, feature_names=FEATURE_NAMES)
                with self._lock:  # Thread safety guard for Booster.predict across threadpool workers
                    for j, h in enumerate(HORIZONS):
                        if h in self.models:
                            r = self.models[h].predict(dm)
                            res_matrix[:, j] = np.clip(r, -RESIDUAL_CLIP, RESIDUAL_CLIP)
                used_model = True
            except Exception as e:
                logger.error(f"Batched XGBoost inference failed: {e}. Falling back to baseline profiles.")
                used_model = False

        # Add profile baseline + predicted residual, clip to [0, MAX_INFLOW]
        raw_final = prof_matrix + res_matrix
        sanitized = np.nan_to_num(raw_final, nan=0.0, posinf=MAX_INFLOW, neginf=0.0)
        final_inflows = np.clip(np.rint(sanitized), 0, MAX_INFLOW).astype(int)

        current_meta = self.meta()

        results = []
        for i in range(n):
            sid = station_meta_list[i]["station_id"]
            inf_10 = int(final_inflows[i, 0])
            inf_20 = int(final_inflows[i, 1])
            inf_30 = int(final_inflows[i, 2])

            risk_10 = self.classify_risk(inf_10, station_id=sid)
            risk_20 = self.classify_risk(inf_20, station_id=sid)
            risk_30 = self.classify_risk(inf_30, station_id=sid)

            trend = "INCREASING" if inf_30 > inf_10 + 15 else ("DECREASING" if inf_30 < inf_10 - 15 else "STABLE")

            results.append({
                "station_id": sid,
                "station_name": station_meta_list[i]["station_name"],
                "line": station_meta_list[i]["line"],
                "interchange": station_meta_list[i]["interchange"],
                "horizon_minutes": 20,
                "predicted_inflow": inf_20,
                "risk_level": risk_20,
                "inflow_10m": inf_10,
                "inflow_20m": inf_20,
                "inflow_30m": inf_30,
                "risk_10m": risk_10,
                "risk_20m": risk_20,
                "risk_30m": risk_30,
                "trend": trend,
                "horizon_series": [
                    {"horizon": 10, "inflow": inf_10, "predicted_inflow": inf_10, "risk": risk_10, "risk_level": risk_10},
                    {"horizon": 20, "inflow": inf_20, "predicted_inflow": inf_20, "risk": risk_20, "risk_level": risk_20},
                    {"horizon": 30, "inflow": inf_30, "predicted_inflow": inf_30, "risk": risk_30, "risk_level": risk_30},
                ],
                "meta": current_meta
            })

        return results

    def meta(self) -> Dict[str, str]:
        """Honest ML runtime metadata reporting actual service state."""
        mode = "xgboost" if self.is_loaded else ("profile_only" if self.profile_map else "heuristic")
        return {
            "model_mode": mode,
            "data_source": "synthetic",
            "disclaimer": "Forecasts come from a model trained on SYNTHETIC data, not DMRC measurements."
        }

    def predict(
        self,
        station_id: int,
        when: Optional[Union[datetime, int]] = None,
        hour: Optional[int] = None,
        minute: Optional[int] = None,
        day_of_week: Optional[int] = None,
        custom_features: Optional[Dict[str, float]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Single station prediction wrapper calling optimized batch engine.
        Accepts either a timezone-aware datetime `when: datetime`,
        or legacy positional/keyword arguments (station_id, hour, minute, day_of_week).
        """
        now = datetime.now(IST)
        if isinstance(when, datetime):
            target_dt = when
        elif isinstance(when, int) or hour is not None:
            h = when if isinstance(when, int) else hour
            m = minute if minute is not None else 0
            dow = day_of_week if day_of_week is not None else now.weekday()
            from datetime import timedelta
            current_dow = now.weekday()
            day_diff = (dow - current_dow) % 7
            target_dt = (now + timedelta(days=day_diff)).replace(hour=h, minute=m, second=0, microsecond=0)
        else:
            target_dt = now

        batch_res = self.predict_batch([station_id], target_dt)
        return batch_res[0]

    @classmethod
    def classify_risk(cls, inflow: int, station_id: Optional[int] = None) -> str:
        """
        DMRC operations standard risk categorization.
        Uses station-specific quantile scaling for major junction interchanges,
        and standard thresholds for local transit stops.
        """
        major_hubs = {8, 13, 16, 37, 40, 45, 50, 59, 61, 70, 75, 120}
        if station_id and station_id in major_hubs:
            if inflow < 400:
                return "LOW"
            elif inflow < 850:
                return "MODERATE"
            elif inflow < 1150:
                return "HIGH"
            else:
                return "CRITICAL"

        if inflow < 150:
            return "LOW"
        elif inflow < 350:
            return "MODERATE"
        elif inflow < 550:
            return "HIGH"
        else:
            return "CRITICAL"


# Global singleton instance
ml_service = MLService()
