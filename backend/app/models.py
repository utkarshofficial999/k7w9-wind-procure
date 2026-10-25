from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class DayAheadTimeSeriesPoint(BaseModel):
    startTime: str
    settlementPeriod: Optional[int] = None
    forecastMW: float
    actualMW: float
    errorMW: float           # Forecast - Actual (>0 is Over-forecast / Deficit Risk)
    absErrorMW: float        # |Forecast - Actual|
    percentageError: Optional[float] = None
    publishTime: Optional[str] = None
    isPeak: bool

class AccuracyMetrics(BaseModel):
    totalHours: int
    meanActualMW: float
    meanForecastMW: float
    maeMW: float             # Mean Absolute Error
    rmseMW: float            # Root Mean Squared Error
    biasMW: float            # Mean Error (>0 indicates systematic over-forecasting)
    wapePercent: float       # Weighted Absolute Percentage Error
    mapePercent: Optional[float] = None
    correlation: float       # Pearson r
    rSquared: float
    p10ErrorMW: float
    p25ErrorMW: float
    p50ErrorMW: float        # Median Error
    p75ErrorMW: float
    p90ErrorMW: float
    p95ErrorMW: float
    maxOverForecastMW: float # Worst under-procurement risk
    maxUnderForecastMW: float # Worst over-procurement surplus
    allErrorsSameSign: bool = False
    sameSignNote: Optional[str] = None


class MarketSegmentMetrics(BaseModel):
    peak: AccuracyMetrics
    offPeak: AccuracyMetrics

class DiurnalPoint(BaseModel):
    hour: int
    settlementPeriods: List[int]
    maeMW: float
    rmseMW: float
    biasMW: float
    meanActualMW: float
    meanForecastMW: float
    isPeak: bool

class DailySummary(BaseModel):
    date: str
    actualMWh: float
    forecastMWh: float
    maeMW: float
    biasMW: float
    rmseMW: float
    wapePercent: float
    maxOverForecastMW: float
    maxUnderForecastMW: float
    dominantRisk: str       # "Deficit (Over-forecast)" | "Surplus (Under-forecast)" | "Balanced"

class DayAheadResponse(BaseModel):
    deliveryDate: str
    decisionCutoffUsed: str
    cutoffHour: int
    metrics: AccuracyMetrics
    timeSeries: List[DayAheadTimeSeriesPoint]

class MonthlyOverviewResponse(BaseModel):
    month: str
    cutoffHour: int
    metrics: AccuracyMetrics
    segmentMetrics: MarketSegmentMetrics
    diurnalProfile: List[DiurnalPoint]
    dailySummaries: List[DailySummary]

class EvolutionPoint(BaseModel):
    publishTime: str
    forecastMW: float
    hoursBeforeDelivery: float

class EvolutionSeries(BaseModel):
    targetStartTime: str
    actualMW: float
    forecasts: List[EvolutionPoint]

class ProcurementSimRequest(BaseModel):
    demandMW: float = Field(default=20000.0, description="Utility total consumer demand profile in MW")
    confidenceLevel: str = Field(default="P90", description="Buffer strategy: 'None', 'Mean_Bias', 'P75', 'P90', 'P95'")
    customBufferMW: Optional[float] = None
    imbalancePenaltyPerMWh: float = Field(default=85.0, description="Estimated spread (£/MWh) for deficit imbalances")

class ProcurementSimResult(BaseModel):
    strategy: str
    appliedBufferMW: float
    rawThermalRequiredMWh: float
    adjustedThermalRequiredMWh: float
    unhedgedDeficitHours: int
    unhedgedDeficitMWh: float
    avoidedImbalanceExposureMWh: float
    estimatedImbalanceRiskCostGBP: float
    estimatedRiskSavingsGBP: float
    notes: str

class TopHourErrorItem(BaseModel):
    hour: int
    hourLabel: str
    meanErrorMW: float

class TopHourPctErrorItem(BaseModel):
    hour: int
    hourLabel: str
    meanPctError: float

class SummaryResponse(BaseModel):
    month: str
    cutoffHour: int
    totalHours: int
    maxMonthlyShortfallMW: float
    maxMonthlyShortfallTimestamp: str
    shareOfHoursOverForecastPercent: float
    top3WorstHoursByMeanError: List[TopHourErrorItem]
    top3WorstHoursByMeanPctError: List[TopHourPctErrorItem]
    monthlyMetrics: AccuracyMetrics

