import json
import logging
import urllib.request
from typing import List, Dict, Any, Optional
from pathlib import Path
from .config import ACTUALS_FILE, FORECASTS_FILE

logger = logging.getLogger(__name__)

class DataFetcher:
    def __init__(self):
        self._actuals: List[Dict[str, Any]] = []
        self._forecasts: List[Dict[str, Any]] = []
        self.load_data()

    def load_data(self) -> None:
        """Loads cached data from disk, or fetches from Elexon if missing."""
        if ACTUALS_FILE.exists() and FORECASTS_FILE.exists():
            logger.info("Loading pre-cached Elexon data from disk...")
            with open(ACTUALS_FILE, "r", encoding="utf-8") as f:
                self._actuals = json.load(f)
            with open(FORECASTS_FILE, "r", encoding="utf-8") as f:
                self._forecasts = json.load(f)
            logger.info(f"Loaded {len(self._actuals)} actuals and {len(self._forecasts)} forecasts.")
        else:
            logger.warning("Cached files not found. Fetching live from Elexon BMRS API...")
            self.fetch_and_cache_live()

    def fetch_and_cache_live(self) -> None:
        """Fetches from Elexon BMRS API and caches locally."""
        ACTUALS_FILE.parent.mkdir(parents=True, exist_ok=True)
        
        # 1. Fetch FUELHH for January 2026
        url_actuals = (
            "https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream?"
            "settlementDateFrom=2026-01-01&settlementDateTo=2026-01-31"
        )
        req = urllib.request.Request(url_actuals, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=45) as resp:
            raw_actuals = json.loads(resp.read().decode("utf-8"))
        self._actuals = [x for x in raw_actuals if x.get("fuelType") == "WIND"]
        with open(ACTUALS_FILE, "w", encoding="utf-8") as f:
            json.dump(self._actuals, f)

        # 2. Fetch WINDFOR for decision dates corresponding to Jan 2026
        url_forecasts = (
            "https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream?"
            "publishDateTimeFrom=2025-12-30T00:00:00Z&publishDateTimeTo=2026-02-01T12:00:00Z"
        )
        req = urllib.request.Request(url_forecasts, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=45) as resp:
            self._forecasts = json.loads(resp.read().decode("utf-8"))
        with open(FORECASTS_FILE, "w", encoding="utf-8") as f:
            json.dump(self._forecasts, f)

    def get_actuals(self) -> List[Dict[str, Any]]:
        return self._actuals

    def get_forecasts(self) -> List[Dict[str, Any]]:
        return self._forecasts

# Singleton instance
data_fetcher = DataFetcher()
