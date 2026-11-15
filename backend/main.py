"""Stateless API for the explicitly illustrative LUNAOPS concept simulator."""

import math
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

app = FastAPI(
    title="LUNAOPS API",
    description="Illustrative lunar mission planning concept API; not flight software.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

REQUIRED_METRICS = {"sunlight", "power", "earthVisibility", "communications"}
SAMPLE_STEP_HOURS = 2
SAMPLE_HOURS = 24
LUNAR_DAY_DAYS = 29.53059
LUNAR_YEAR_DAYS = 365.256
EPOCH = datetime(2000, 1, 1, tzinfo=timezone.utc)


class ScoreRequest(BaseModel):
    """Illustrative 0–100 metric inputs and non-negative relative weights."""

    metrics: dict[str, float] = Field(
        description="Illustrative normalized values from 0 to 100."
    )
    weights: dict[str, float] = Field(
        description="Relative, non-negative weights; normalized by their total."
    )


class SimulationRequest(BaseModel):
    """Inputs for the explicitly unvalidated geometry demonstration."""

    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    datetimeUtc: datetime


def _elevation_deg(latitude: float, declination: float, hour_angle: float) -> float:
    sin_elevation = (
        math.sin(latitude) * math.sin(declination)
        + math.cos(latitude) * math.cos(declination) * math.cos(hour_angle)
    )
    return math.degrees(math.asin(max(-1.0, min(1.0, sin_elevation))))


def _azimuth_deg(latitude: float, declination: float, hour_angle: float) -> float:
    azimuth = math.atan2(
        math.sin(hour_angle),
        math.cos(hour_angle) * math.sin(latitude)
        - math.tan(declination) * math.cos(latitude),
    )
    return (math.degrees(azimuth) + 180) % 360


def _transition_hours(points: list[dict[str, Any]], key: str) -> float | None:
    initial_state = points[0][key]
    for point in points[1:]:
        if point[key] != initial_state:
            return float(point["elapsedHours"])
    return None


@app.get("/healthz")
def healthz() -> dict[str, str]:
    """Liveness probe; intentionally independent of downstream dependencies."""
    return {"status": "ok"}


@app.get("/readyz")
def readyz() -> dict[str, str]:
    """Readiness probe; this stateless API has no external dependencies."""
    return {"status": "ready"}


@app.get("/api/v1/status")
def api_status() -> dict[str, Any]:
    return {
        "service": "LUNAOPS API",
        "mode": "illustrative",
        "persistentStorage": False,
        "scientificMeasurement": False,
    }


@app.post("/api/v1/simulate")
def simulate(request: SimulationRequest) -> dict[str, Any]:
    """Produce a toy spherical-geometry timeline, not scientific ephemerides."""
    if request.datetimeUtc.utcoffset() is None:
        raise HTTPException(
            status_code=422, detail="datetimeUtc must include a UTC offset."
        )

    start = request.datetimeUtc.astimezone(timezone.utc)
    latitude = math.radians(request.latitude)
    points: list[dict[str, Any]] = []

    for elapsed_hours in range(0, SAMPLE_HOURS + 1, SAMPLE_STEP_HOURS):
        point_time = start + timedelta(hours=elapsed_hours)
        elapsed_days = (point_time - EPOCH).total_seconds() / 86400

        solar_declination = math.radians(
            1.54 * math.sin(2 * math.pi * elapsed_days / LUNAR_YEAR_DAYS)
        )
        lunar_phase = (
            elapsed_days / LUNAR_DAY_DAYS + request.longitude / 360
        ) % 1
        solar_hour_angle = 2 * math.pi * lunar_phase

        # A small, sinusoidal libration proxy is used only to illustrate changing
        # Earth geometry; it is not derived from an ephemeris.
        earth_declination = math.radians(
            6.7 * math.sin(2 * math.pi * elapsed_days / 27.21222)
        )
        earth_hour_angle = math.radians(
            request.longitude
            + 7.9 * math.sin(2 * math.pi * elapsed_days / 27.55455)
        )

        sun_elevation = _elevation_deg(
            latitude, solar_declination, solar_hour_angle
        )
        earth_elevation = _elevation_deg(
            latitude, earth_declination, earth_hour_angle
        )
        points.append(
            {
                "elapsedHours": elapsed_hours,
                "timestampUtc": point_time.isoformat().replace("+00:00", "Z"),
                "sunElevationDeg": round(sun_elevation, 2),
                "sunAzimuthDeg": round(
                    _azimuth_deg(latitude, solar_declination, solar_hour_angle), 2
                ),
                "earthElevationDeg": round(earth_elevation, 2),
                "earthAzimuthDeg": round(
                    _azimuth_deg(latitude, earth_declination, earth_hour_angle), 2
                ),
                "sunVisible": sun_elevation > 0,
                "earthGeometricallyVisible": earth_elevation > 0,
            }
        )

    sampled_points = points[:-1]
    sunlight_percent = round(
        sum(point["sunVisible"] for point in sampled_points)
        / len(sampled_points)
        * 100
    )
    earth_visibility_percent = round(
        sum(point["earthGeometricallyVisible"] for point in sampled_points)
        / len(sampled_points)
        * 100
    )
    power_proxy = round(
        sum(
            max(0, math.sin(math.radians(point["sunElevationDeg"]))) * 100
            for point in sampled_points
        )
        / len(sampled_points)
    )

    return {
        "classification": "Illustrative simulated values",
        "model": "Unvalidated spherical geometry with simplified lunar cycles",
        "scientificMeasurement": False,
        "assumptions": [
            "No JPL/NASA ephemeris or topographic dataset is queried.",
            "Terrain horizons, atmospheric refraction, libration details, and uncertainty are not modeled.",
            "Solar exposure is not electrical energy production.",
            "Geometric Earth visibility is not a communication link assessment.",
            "Two-hour samples provide a coarse conceptual timeline only.",
        ],
        "samplingStepHours": SAMPLE_STEP_HOURS,
        "points": points,
        "current": points[0],
        "hoursUntilSunTransition": _transition_hours(points, "sunVisible"),
        "hoursUntilEarthTransition": _transition_hours(
            points, "earthGeometricallyVisible"
        ),
        "sampledSunlightHours": round(
            sum(point["sunVisible"] for point in sampled_points)
            * SAMPLE_STEP_HOURS,
            1,
        ),
        "sampledEarthVisibilityHours": round(
            sum(point["earthGeometricallyVisible"] for point in sampled_points)
            * SAMPLE_STEP_HOURS,
            1,
        ),
        "metrics": {
            "sunlight": sunlight_percent,
            "power": power_proxy,
            "earthVisibility": earth_visibility_percent,
            "communications": earth_visibility_percent,
        },
    }


@app.post("/api/v1/score")
def score_scenario(request: ScoreRequest) -> dict[str, Any]:
    """Return a transparent normalized weighted average for demo inputs."""
    if set(request.metrics) != REQUIRED_METRICS:
        raise HTTPException(
            status_code=422,
            detail=f"metrics must contain exactly: {', '.join(sorted(REQUIRED_METRICS))}.",
        )
    if set(request.weights) != REQUIRED_METRICS:
        raise HTTPException(
            status_code=422,
            detail=f"weights must contain exactly: {', '.join(sorted(REQUIRED_METRICS))}.",
        )
    if any(not 0 <= value <= 100 for value in request.metrics.values()):
        raise HTTPException(
            status_code=422, detail="Illustrative metric values must be between 0 and 100."
        )
    if any(value < 0 for value in request.weights.values()):
        raise HTTPException(status_code=422, detail="Weights must be non-negative.")

    total_weight = sum(request.weights.values())
    if total_weight <= 0:
        raise HTTPException(
            status_code=422, detail="At least one weight must be greater than zero."
        )

    contributions = {
        name: round(request.metrics[name] * request.weights[name] / total_weight, 2)
        for name in sorted(REQUIRED_METRICS)
    }
    return {
        "score": round(sum(contributions.values()), 2),
        "method": "normalized weighted average",
        "classification": "Illustrative decision-support score",
        "scientificMeasurement": False,
        "contributions": contributions,
    }


frontend_dir = Path(__file__).resolve().parent.parent / "dist"
if frontend_dir.is_dir():
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
