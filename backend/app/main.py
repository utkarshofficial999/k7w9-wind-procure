from __future__ import annotations

from datetime import date, datetime, timedelta
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .analytics import compare, cutoff_dt, metrics, select_day_ahead_forecast
from .elexon import fetch_actual_wind, fetch_forecasts, required_publish_window

app = FastAPI(title="GB Wind Day-Ahead Decision API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
@app.get("/health")
async def health():
    return {"status": "ok", "service": "wind-market-api"}


@app.get("/api/analysis")
@app.get("/analysis")
async def analysis(
    start_date: date = Query(date(2026, 1, 1)),
    end_date: date = Query(date(2026, 1, 31)),
    cutoff: str = Query("09:30", pattern=r"^\d{2}:\d{2}$"),
):
    if start_date < date(2026, 1, 1) or end_date > date(2026, 1, 31):
        raise HTTPException(400, "Pilot analysis is restricted to January 2026.")
    if start_date > end_date:
        raise HTTPException(400, "start_date must be before end_date.")

    try:
        hour, minute = map(int, cutoff.split(":"))
        if hour > 23 or minute > 59:
            raise ValueError
    except ValueError:
        raise HTTPException(400, "cutoff must be HH:MM.")

    publish_from, publish_to = required_publish_window(start_date, end_date)

    actuals = await fetch_actual_wind(start_date, end_date)
    forecasts = await fetch_forecasts(publish_from, publish_to)

    selected = select_day_ahead_forecast(
        forecasts, start_date, end_date, cutoff
    )
    points = compare(selected, actuals)

    return {
        "period": {"start": start_date.isoformat(), "end": end_date.isoformat()},
        "decision_cutoff_gmt": cutoff,
        "metrics": metrics(points),
        "points": points,
        "source": {
            "actuals": "Elexon FUELHH",
            "forecasts": "Elexon WINDFOR",
        },
    }
