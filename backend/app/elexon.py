from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from typing import Any

import httpx

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"


async def _get(path: str, params: dict[str, Any]) -> Any:
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.get(f"{BASE_URL}{path}", params=params)
        response.raise_for_status()
        payload = response.json()
        return payload.get("data", payload)


import json
from pathlib import Path

_DATA_DIR = Path(__file__).resolve().parent / "data"
_CACHE_FILE = _DATA_DIR / "january_2026_elexon.json"

_ACTUALS_CACHE: dict[tuple[date, date], list[dict[str, Any]]] = {}
_FORECASTS_CACHE: dict[tuple[datetime, datetime], list[dict[str, Any]]] = {}

# Pre-populate cache from static seed file if available (for instant cold-start response in deployment)
if _CACHE_FILE.exists():
    try:
        with open(_CACHE_FILE, "r", encoding="utf-8") as _f:
            _seeded = json.load(_f)
            _jan_start = date(2026, 1, 1)
            _jan_end = date(2026, 1, 31)
            _p_from = datetime(2025, 12, 31, 0, 0, tzinfo=timezone.utc)
            _p_to = datetime(2026, 1, 31, 23, 59, 59, 999999, tzinfo=timezone.utc)
            if "actuals" in _seeded:
                _ACTUALS_CACHE[(_jan_start, _jan_end)] = _seeded["actuals"]
            if "forecasts" in _seeded:
                _FORECASTS_CACHE[(_p_from, _p_to)] = _seeded["forecasts"]
    except Exception:
        pass


async def fetch_actual_wind(start: date, end: date) -> list[dict[str, Any]]:
    cache_key = (start, end)
    if cache_key in _ACTUALS_CACHE:
        return _ACTUALS_CACHE[cache_key]

    results: list[dict[str, Any]] = []
    curr = start
    while curr <= end:
        chunk_end = min(curr + timedelta(days=6), end)
        data = await _get(
            "/datasets/FUELHH",
            {
                "settlementDateFrom": curr.isoformat(),
                "settlementDateTo": chunk_end.isoformat(),
                "format": "json",
            },
        )
        if isinstance(data, list):
            results.extend(
                row for row in data
                if str(row.get("fuelType", "")).upper() == "WIND"
            )
        curr = chunk_end + timedelta(days=1)

    _ACTUALS_CACHE[cache_key] = results
    return results


async def fetch_forecasts(publish_from: datetime, publish_to: datetime) -> list[dict[str, Any]]:
    p_from = publish_from.astimezone(timezone.utc)
    p_to = publish_to.astimezone(timezone.utc)
    cache_key = (p_from, p_to)
    if cache_key in _FORECASTS_CACHE:
        return _FORECASTS_CACHE[cache_key]

    results: list[dict[str, Any]] = []
    curr = p_from
    while curr < p_to:
        chunk_end = min(curr + timedelta(days=6, hours=23, minutes=59, seconds=59), p_to)
        data = await _get(
            "/datasets/WINDFOR",
            {
                "publishDateTimeFrom": curr.isoformat(),
                "publishDateTimeTo": chunk_end.isoformat(),
                "format": "json",
            },
        )
        if isinstance(data, list):
            results.extend(data)
        curr = chunk_end + timedelta(seconds=1)

    _FORECASTS_CACHE[cache_key] = results
    return results


def required_publish_window(start: date, end: date) -> tuple[datetime, datetime]:
    # Include D-1 forecasts for Jan 1 and forecasts published during Jan 31.
    start_dt = datetime.combine(start - timedelta(days=1), time.min, tzinfo=timezone.utc)
    end_dt = datetime.combine(end, time.max, tzinfo=timezone.utc)
    return start_dt, end_dt
