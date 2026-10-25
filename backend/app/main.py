import os
from pathlib import Path
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .models import (
    DayAheadResponse, MonthlyOverviewResponse,
    EvolutionSeries, ProcurementSimRequest, ProcurementSimResult
)
from .analytics import analytics_engine
from .data_fetcher import data_fetcher
from .config import DEFAULT_CUTOFF_HOUR

app = FastAPI(
    title="UK Wind Power Day-Ahead Procurement & Forecast Accuracy Platform",
    description="Customized decision-support system for UK electricity wholesale market day-ahead procurement desks.",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    actuals_count = len(data_fetcher.get_actuals())
    forecasts_count = len(data_fetcher.get_forecasts())
    return {
        "status": "healthy",
        "market": "UK Wholesale Electricity (BMRS Elexon)",
        "period": "January 2026",
        "actualsRecords": actuals_count,
        "forecastsRecords": forecasts_count,
        "supportedDeliveryDates": [f"2026-01-{d:02d}" for d in range(1, 32)]
    }

@app.get("/api/monthly-overview", response_model=MonthlyOverviewResponse)
def get_monthly_overview(
    cutoff_hour: int = Query(
        DEFAULT_CUTOFF_HOUR,
        description="Day-ahead cutoff hour on D-1 (e.g. 11 for 11:00 UTC EPEX auction, or -1 for real-time intraday)"
    )
):
    try:
        return analytics_engine.get_monthly_overview(cutoff_hour=cutoff_hour)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/day-ahead", response_model=DayAheadResponse)
def get_day_ahead_view(
    date: str = Query("2026-01-15", description="Delivery date in format YYYY-MM-DD (e.g. 2026-01-15)"),
    cutoff_hour: int = Query(DEFAULT_CUTOFF_HOUR, description="Cutoff hour on D-1 (default 11 UTC)")
):
    try:
        return analytics_engine.get_day_ahead_view(delivery_date=date, cutoff_hour=cutoff_hour)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/forecast-evolution", response_model=EvolutionSeries)
def get_forecast_evolution(
    target_start_time: str = Query(
        "2026-01-15T12:00:00Z",
        description="Delivery hour start time in ISO format (e.g. 2026-01-15T12:00:00Z)"
    )
):
    try:
        return analytics_engine.get_forecast_evolution(target_start_time=target_start_time)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/procurement-simulation", response_model=ProcurementSimResult)
def simulate_procurement(
    req: ProcurementSimRequest,
    cutoff_hour: int = Query(DEFAULT_CUTOFF_HOUR, description="Cutoff hour on D-1")
):
    try:
        return analytics_engine.simulate_procurement(req=req, cutoff_hour=cutoff_hour)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount static frontend files if built
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/")
    def serve_root():
        return FileResponse(FRONTEND_DIST / "index.html")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")

