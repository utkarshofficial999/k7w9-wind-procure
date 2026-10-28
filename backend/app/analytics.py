from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, time, timedelta, timezone
from math import sqrt
from statistics import mean
from typing import Any


def parse_dt(value: str | datetime) -> datetime:
    if isinstance(value, datetime):
        dt = value
    else:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def cutoff_dt(delivery_date: date, cutoff: str) -> datetime:
    hour, minute = map(int, cutoff.split(":"))
    return datetime.combine(
        delivery_date - timedelta(days=1),
        time(hour, minute),
        tzinfo=timezone.utc,
    )


def _actual_value(row: dict[str, Any]) -> float | None:
    value = row.get("generation")
    return float(value) if value is not None else None


def _start(row: dict[str, Any]) -> datetime:
    return parse_dt(row["startTime"])


def _publish(row: dict[str, Any]) -> datetime:
    return parse_dt(row["publishTime"])


def select_day_ahead_forecast(
    forecasts: list[dict[str, Any]],
    delivery_start: date,
    delivery_end: date,
    cutoff: str,
) -> list[dict[str, Any]]:
    # For each delivery interval, choose the latest available forecast vintage
    # published no later than the D-1 decision cutoff.
    candidates: dict[datetime, list[dict[str, Any]]] = defaultdict(list)

    for row in forecasts:
        try:
            start = _start(row)
            if delivery_start <= start.date() <= delivery_end:
                candidates[start].append(row)
        except (KeyError, ValueError, TypeError):
            continue

    selected: list[dict[str, Any]] = []
    for start, rows in sorted(candidates.items()):
        limit = cutoff_dt(start.date(), cutoff)
        eligible = [r for r in rows if _publish(r) <= limit]
        if not eligible:
            continue
        chosen = max(eligible, key=_publish)
        selected.append(
            {
                "startTime": start.isoformat(),
                "publishTime": _publish(chosen).isoformat(),
                "forecast": float(chosen["generation"]),
            }
        )
    return selected


def actual_series(actuals: list[dict[str, Any]]) -> dict[datetime, float]:
    result: dict[datetime, float] = {}
    for row in actuals:
        try:
            result[_start(row)] = _actual_value(row)
        except (KeyError, ValueError, TypeError):
            continue
    return result


def compare(selected: list[dict[str, Any]], actuals: list[dict[str, Any]]) -> list[dict[str, Any]]:
    actual_map = actual_series(actuals)
    output = []

    for row in selected:
        ts = parse_dt(row["startTime"])
        actual = actual_map.get(ts)
        if actual is None:
            continue
        forecast = float(row["forecast"])
        error = forecast - actual
        output.append(
            {
                **row,
                "actual": actual,
                "error": error,
                "absoluteError": abs(error),
            }
        )
    return output


def percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    values = sorted(values)
    if len(values) == 1:
        return values[0]
    rank = (len(values) - 1) * p
    lo = int(rank)
    hi = min(lo + 1, len(values) - 1)
    weight = rank - lo
    return values[lo] * (1 - weight) + values[hi] * weight


def metrics(points: list[dict[str, Any]]) -> dict[str, float | int]:
    errors = [float(p["error"]) for p in points]
    abs_errors = [abs(e) for e in errors]
    actuals = [float(p["actual"]) for p in points]
    forecast = [float(p["forecast"]) for p in points]

    if not errors:
        return {
            "intervals": 0,
            "mae": 0,
            "rmse": 0,
            "bias": 0,
            "p90_abs_error": 0,
            "p95_abs_error": 0,
            "mean_actual": 0,
            "mean_forecast": 0,
        }

    return {
        "intervals": len(errors),
        "mae": mean(abs_errors),
        "rmse": sqrt(mean(e * e for e in errors)),
        "bias": mean(errors),
        "p90_abs_error": percentile(abs_errors, 0.90),
        "p95_abs_error": percentile(abs_errors, 0.95),
        "mean_actual": mean(actuals),
        "mean_forecast": mean(forecast),
    }
