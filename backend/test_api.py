import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.analytics import analytics_engine

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["period"] == "January 2026"
    assert data["actualsRecords"] > 0
    assert data["forecastsRecords"] > 0
    assert len(data["supportedDeliveryDates"]) == 31

def test_monthly_overview_endpoint():
    response = client.get("/api/monthly-overview?cutoff_hour=11")
    assert response.status_code == 200
    data = response.json()
    assert data["month"] == "2026-01"
    assert data["metrics"]["totalHours"] == 744  # 31 days * 24 hours
    assert data["metrics"]["maeMW"] > 0
    assert data["metrics"]["biasMW"] > 0         # Significant over-forecasting
    assert len(data["diurnalProfile"]) == 24
    assert len(data["dailySummaries"]) == 31

def test_day_ahead_endpoint():
    response = client.get("/api/day-ahead?date=2026-01-15&cutoff_hour=11")
    assert response.status_code == 200
    data = response.json()
    assert data["deliveryDate"] == "2026-01-15"
    assert data["cutoffHour"] == 11
    assert len(data["timeSeries"]) == 24
    for pt in data["timeSeries"]:
        assert "actualMW" in pt
        assert "forecastMW" in pt
        assert "errorMW" in pt
        assert pt["errorMW"] == pytest.approx(pt["forecastMW"] - pt["actualMW"], 0.2)

def test_forecast_evolution_endpoint():
    response = client.get("/api/forecast-evolution?target_start_time=2026-01-15T12:00:00Z")
    assert response.status_code == 200
    data = response.json()
    assert "actualMW" in data
    assert len(data["forecasts"]) > 0
    # Forecasts should have positive hours before delivery
    for f in data["forecasts"]:
        assert f["hoursBeforeDelivery"] >= 0

def test_procurement_simulation_endpoint():
    payload = {
        "demandMW": 20000.0,
        "confidenceLevel": "P90",
        "imbalancePenaltyPerMWh": 85.0
    }
    response = client.post("/api/procurement-simulation?cutoff_hour=11", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["appliedBufferMW"] > 0
    assert data["avoidedImbalanceExposureMWh"] > 0
    assert data["estimatedRiskSavingsGBP"] > 0

if __name__ == "__main__":
    pytest.main(["-v", "backend/test_api.py"])
