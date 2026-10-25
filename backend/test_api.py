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
    for f in data["forecasts"]:
        assert f["hoursBeforeDelivery"] >= 0

def test_summary_endpoint_fields():
    """
    Requirement 5 & 13: Test new /api/summary fields computed directly from data:
    - maxMonthlyShortfallMW and timestamp
    - shareOfHoursOverForecastPercent
    - top3WorstHoursByMeanError
    - top3WorstHoursByMeanPctError
    """
    response = client.get("/api/summary?cutoff_hour=11")
    assert response.status_code == 200
    data = response.json()
    assert data["month"] == "January 2026"
    assert data["totalHours"] == 744
    assert data["maxMonthlyShortfallMW"] == pytest.approx(6833.0, 1.0)
    assert "2026-01-12" in data["maxMonthlyShortfallTimestamp"]
    assert data["shareOfHoursOverForecastPercent"] == pytest.approx(84.41, 0.2)

    # Top 3 worst hours by mean error
    top_err = data["top3WorstHoursByMeanError"]
    assert len(top_err) == 3
    assert top_err[0]["hour"] in [3, 4, 5]
    assert top_err[0]["meanErrorMW"] >= top_err[1]["meanErrorMW"] >= top_err[2]["meanErrorMW"]
    for item in top_err:
        assert "hour" in item
        assert "hourLabel" in item
        assert item["meanErrorMW"] > 0

    # Top 3 worst hours by mean % error
    top_pct = data["top3WorstHoursByMeanPctError"]
    assert len(top_pct) == 3
    assert top_pct[0]["meanPctError"] >= top_pct[1]["meanPctError"] >= top_pct[2]["meanPctError"]
    for item in top_pct:
        assert "hour" in item
        assert "hourLabel" in item
        assert item["meanPctError"] > 0

def test_scope_correctness_day_vs_month_p90():
    """
    Requirement 2, 3 & 13: Scope correctness between Day P90 and Month P90.
    Day 15 P90 (+1,668.5 MW) evaluates 24 intra-day hours.
    Month P90 (+4,312.4 MW) evaluates 744 hours across all month weather regimes.
    """
    day_res = client.get("/api/day-ahead?date=2026-01-15&cutoff_hour=11")
    assert day_res.status_code == 200
    day_data = day_res.json()
    day_p90 = day_data["metrics"]["p90ErrorMW"]
    assert day_p90 == pytest.approx(1668.5, 1.0)

    sum_res = client.get("/api/summary?cutoff_hour=11")
    assert sum_res.status_code == 200
    sum_data = sum_res.json()
    month_p90 = sum_data["monthlyMetrics"]["p90ErrorMW"]
    assert month_p90 == pytest.approx(4312.4, 1.0)

    # Verify that daily P90 is distinct and lower than month-wide tail risk P90
    assert day_p90 < month_p90

def test_same_sign_bias_note_flag():
    """
    Requirement 8 & 13: When all hourly errors in scope share the same sign,
    show note: "All N hours over-forecast, so Bias = MAE."
    On 2026-01-15, all 24 hours are over-forecast (Forecast > Actual).
    """
    response = client.get("/api/day-ahead?date=2026-01-15&cutoff_hour=11")
    assert response.status_code == 200
    data = response.json()
    metrics = data["metrics"]

    assert metrics["allErrorsSameSign"] is True
    assert metrics["sameSignNote"] == "All 24 hours over-forecast, so Bias = MAE."
    assert metrics["biasMW"] == pytest.approx(metrics["maeMW"], 0.1)
    assert metrics["biasMW"] == pytest.approx(1110.2, 1.0)

def test_roi_calculation_with_editable_price():
    """
    Requirement 12 & 13: Test procurement simulation with editable cashout price assumption:
    - Default £85/MWh
    - Custom £120/MWh
    Verify that savings scale linearly: Avoided Cashout = Hedged Volume (MWh) * Price (£/MWh)
    """
    # Default £85/MWh
    payload85 = {
        "demandMW": 20000.0,
        "confidenceLevel": "P90",
        "imbalancePenaltyPerMWh": 85.0
    }
    res85 = client.post("/api/procurement-simulation?cutoff_hour=11", json=payload85)
    assert res85.status_code == 200
    data85 = res85.json()

    # Applied buffer should default to monthly P90 (+4,312.4 MW)
    assert data85["appliedBufferMW"] == pytest.approx(4312.4, 1.0)
    hedged_mwh = data85["avoidedImbalanceExposureMWh"]
    assert hedged_mwh > 0
    assert data85["estimatedRiskSavingsGBP"] == pytest.approx(hedged_mwh * 85.0, 0.5)

    # Editable custom price: £120/MWh
    payload120 = {
        "demandMW": 20000.0,
        "confidenceLevel": "P90",
        "imbalancePenaltyPerMWh": 120.0
    }
    res120 = client.post("/api/procurement-simulation?cutoff_hour=11", json=payload120)
    assert res120.status_code == 200
    data120 = res120.json()

    assert data120["avoidedImbalanceExposureMWh"] == pytest.approx(hedged_mwh, 0.1)
    assert data120["estimatedRiskSavingsGBP"] == pytest.approx(hedged_mwh * 120.0, 0.5)
    assert data120["estimatedRiskSavingsGBP"] > data85["estimatedRiskSavingsGBP"]

if __name__ == "__main__":
    pytest.main(["-v", "backend/test_api.py"])
