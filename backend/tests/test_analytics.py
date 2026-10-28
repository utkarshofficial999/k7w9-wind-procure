from datetime import date, timezone, datetime

from app.analytics import metrics, select_day_ahead_forecast


def test_selects_latest_forecast_before_cutoff():
    forecasts = [
        {"startTime": "2026-01-02T00:00:00Z", "publishTime": "2026-01-01T08:30:00Z", "generation": 100},
        {"startTime": "2026-01-02T00:00:00Z", "publishTime": "2026-01-01T09:20:00Z", "generation": 110},
        {"startTime": "2026-01-02T00:00:00Z", "publishTime": "2026-01-01T10:30:00Z", "generation": 120},
    ]
    result = select_day_ahead_forecast(
        forecasts, date(2026, 1, 2), date(2026, 1, 2), "09:30"
    )
    assert result[0]["forecast"] == 110


def test_metrics():
    points = [
        {"forecast": 110, "actual": 100, "error": 10},
        {"forecast": 90, "actual": 100, "error": -10},
    ]
    result = metrics(points)
    assert result["mae"] == 10
    assert result["rmse"] == 10
    assert result["bias"] == 0
