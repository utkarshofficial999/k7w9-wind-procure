import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

ACTUALS_FILE = DATA_DIR / "fuelhh_wind_jan2026.json"
FORECASTS_FILE = DATA_DIR / "windfor_jan2026.json"

# Default configuration for Day-Ahead electricity market
DEFAULT_CUTOFF_HOUR = 11  # 11:00 UTC (EPEX SPOT / Nord Pool UK Day-Ahead gate closure on D-1)
DEFAULT_DELIVERY_MONTH = "2026-01"

# Peak hours in UK wholesale electricity market: 07:00 to 19:00 UTC (Settlement Periods 15 to 38)
PEAK_HOUR_START = 7
PEAK_HOUR_END = 19

# Indicative UK imbalance spread (£/MWh) for procurement risk modeling
DEFAULT_IMBALANCE_PRICE_SPREAD = 85.0
