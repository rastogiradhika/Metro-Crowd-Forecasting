#!/usr/bin/env python3
"""
MetroAI — Station Historical Profile Builder
Reads ml_dataset.csv (1.84M rows) and generates precomputed station profiles
grouped by (Station_ID, slot, is_weekend) saved as compressed models_weights/station_profiles.csv.gz.
"""

import os
import sys
import time
import pandas as pd
import numpy as np

# Path resolution
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
WORKSPACE_DIR = os.path.dirname(BACKEND_DIR)

DATASET_CANDIDATES = [
    os.path.join(WORKSPACE_DIR, "DelhiMetro_CrowdPrediction", "Output", "phase5_ml_dataset", "ml_dataset.csv"),
    os.path.join(BACKEND_DIR, "data", "ml_dataset.csv"),
    os.path.join(os.getcwd(), "DelhiMetro_CrowdPrediction", "Output", "phase5_ml_dataset", "ml_dataset.csv"),
]

OUTPUT_DIR = os.path.join(BACKEND_DIR, "models_weights")
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "station_profiles.csv.gz")


def find_dataset():
    for p in DATASET_CANDIDATES:
        if os.path.exists(p):
            return p
    raise FileNotFoundError(f"ml_dataset.csv not found in candidate paths: {DATASET_CANDIDATES}")


def build_profiles():
    t0 = time.time()
    csv_file = find_dataset()
    print(f"Reading dataset from: {csv_file}")

    use_cols = [
        "Station_ID", "hour", "minute", "is_weekend", "Train_Count",
        "lag_10m", "lag_20m", "lag_30m", "lag_60m", "rolling_mean_60m",
        "target_10m", "target_20m", "target_30m"
    ]

    df = pd.read_csv(csv_file, usecols=use_cols)
    print(f"Loaded {len(df):,} records in {time.time() - t0:.2f}s")

    # Compute slot (10-minute slot of the day, 0 to 143)
    df["slot"] = (df["hour"] * 6 + df["minute"] // 10).astype(int)

    # Group by (Station_ID, slot, is_weekend)
    print("Computing aggregated historical profiles...")
    grouped = df.groupby(["Station_ID", "slot", "is_weekend"])[[
        "Train_Count", "lag_10m", "lag_20m", "lag_30m", "lag_60m",
        "rolling_mean_60m", "target_10m", "target_20m", "target_30m"
    ]].mean().reset_index()

    # Rename target columns to profile targets
    grouped.rename(columns={
        "target_10m": "prof_target_10m",
        "target_20m": "prof_target_20m",
        "target_30m": "prof_target_30m",
    }, inplace=True)

    # Reconstruct hour & lag_vs_prof
    grouped["hour"] = (grouped["slot"] // 6).astype(int)
    grouped["lag_vs_prof"] = grouped["lag_10m"] - grouped["prof_target_10m"]

    # Round floating columns to 3 decimal places for compactness
    float_cols = [
        "Train_Count", "lag_10m", "lag_20m", "lag_30m", "lag_60m",
        "rolling_mean_60m", "prof_target_10m", "prof_target_20m",
        "prof_target_30m", "lag_vs_prof"
    ]
    grouped[float_cols] = grouped[float_cols].round(3)

    # Desired column order
    cols_order = [
        "Station_ID", "slot", "is_weekend", "hour", "Train_Count",
        "lag_10m", "lag_20m", "lag_30m", "lag_60m", "rolling_mean_60m",
        "prof_target_10m", "prof_target_20m", "prof_target_30m", "lag_vs_prof"
    ]
    grouped = grouped[cols_order]

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Saving {len(grouped):,} profile rows to: {OUTPUT_PATH}")
    grouped.to_csv(OUTPUT_PATH, index=False, compression="gzip")

    size_kb = os.path.getsize(OUTPUT_PATH) / 1024
    print(f"Profile build completed in {time.time() - t0:.2f}s! File size: {size_kb:.1f} KB")


if __name__ == "__main__":
    build_profiles()
