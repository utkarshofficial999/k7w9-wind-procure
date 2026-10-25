import math
from datetime import datetime, date, timedelta, timezone
from typing import List, Dict, Any, Optional, Tuple
import pandas as pd
import numpy as np

from .data_fetcher import data_fetcher
from .config import DEFAULT_CUTOFF_HOUR, PEAK_HOUR_START, PEAK_HOUR_END, DEFAULT_IMBALANCE_PRICE_SPREAD
from .models import (
    DayAheadTimeSeriesPoint, AccuracyMetrics, MarketSegmentMetrics,
    DiurnalPoint, DailySummary, DayAheadResponse, MonthlyOverviewResponse,
    EvolutionPoint, EvolutionSeries, ProcurementSimRequest, ProcurementSimResult
)

class AnalyticsEngine:
    def __init__(self):
        self._df_actuals_hourly: Optional[pd.DataFrame] = None
        self._df_actuals_raw: Optional[pd.DataFrame] = None
        self._df_forecasts: Optional[pd.DataFrame] = None
        self._prepare_dataframes()

    def _prepare_dataframes(self) -> None:
        actuals = data_fetcher.get_actuals()
        forecasts = data_fetcher.get_forecasts()

        if not actuals or not forecasts:
            return

        df_act = pd.DataFrame(actuals)
        df_act['startTime'] = pd.to_datetime(df_act['startTime'], utc=True)
        df_act['hour_start'] = df_act['startTime'].dt.floor('h')
        self._df_actuals_raw = df_act

        # Hourly aggregate of actuals (mean MW of the two half-hour settlement periods)
        self._df_actuals_hourly = df_act.groupby('hour_start').agg(
            actual_mw=('generation', 'mean'),
            settlementDate=('settlementDate', 'first')
        ).reset_index()

        df_fc = pd.DataFrame(forecasts)
        df_fc['publishTime'] = pd.to_datetime(df_fc['publishTime'], utc=True)
        df_fc['startTime'] = pd.to_datetime(df_fc['startTime'], utc=True)
        self._df_forecasts = df_fc

    def _calc_metrics_from_df(self, df: pd.DataFrame) -> AccuracyMetrics:
        if df.empty or len(df) == 0:
            return AccuracyMetrics(
                totalHours=0, meanActualMW=0.0, meanForecastMW=0.0,
                maeMW=0.0, rmseMW=0.0, biasMW=0.0, wapePercent=0.0,
                correlation=0.0, rSquared=0.0, p10ErrorMW=0.0, p25ErrorMW=0.0,
                p50ErrorMW=0.0, p75ErrorMW=0.0, p90ErrorMW=0.0, p95ErrorMW=0.0,
                maxOverForecastMW=0.0, maxUnderForecastMW=0.0
            )

        err = df['error_mw']
        abs_err = df['abs_error_mw']
        act = df['actual_mw']
        fc = df['forecast_mw']

        mae = float(abs_err.mean())
        rmse = float(np.sqrt((err ** 2).mean()))
        bias = float(err.mean())
        act_sum = float(act.sum())
        wape = float((abs_err.sum() / act_sum) * 100) if act_sum > 0 else 0.0

        # Pearson correlation
        if len(df) > 1 and np.std(act) > 0 and np.std(fc) > 0:
            corr = float(np.corrcoef(act, fc)[0, 1])
            r2 = float(corr ** 2)
        else:
            corr = 0.0
            r2 = 0.0

        # Percentage error (MAPE with safe handling)
        pct_err = (abs_err / act.replace(0, np.nan)) * 100
        mape = float(pct_err.dropna().mean()) if not pct_err.dropna().empty else None

        return AccuracyMetrics(
            totalHours=int(len(df)),
            meanActualMW=round(float(act.mean()), 1),
            meanForecastMW=round(float(fc.mean()), 1),
            maeMW=round(mae, 1),
            rmseMW=round(rmse, 1),
            biasMW=round(bias, 1),
            wapePercent=round(wape, 2),
            mapePercent=round(mape, 2) if mape is not None else None,
            correlation=round(corr, 3),
            rSquared=round(r2, 3),
            p10ErrorMW=round(float(err.quantile(0.10)), 1),
            p25ErrorMW=round(float(err.quantile(0.25)), 1),
            p50ErrorMW=round(float(err.quantile(0.50)), 1),
            p75ErrorMW=round(float(err.quantile(0.75)), 1),
            p90ErrorMW=round(float(err.quantile(0.90)), 1),
            p95ErrorMW=round(float(err.quantile(0.95)), 1),
            maxOverForecastMW=round(float(err.max()), 1),
            maxUnderForecastMW=round(float(err.min()), 1)
        )

    def get_aligned_data(self, cutoff_hour: int = DEFAULT_CUTOFF_HOUR, target_date: Optional[str] = None) -> pd.DataFrame:
        """
        Aligns forecasts to actuals for each hour based on the decision cutoff.
        If cutoff_hour == -1, represents latest Intraday forecast available before delivery.
        Otherwise, cutoff is on D-1 at cutoff_hour:00 UTC.
        """
        if self._df_actuals_hourly is None or self._df_forecasts is None:
            self._prepare_dataframes()

        df_act = self._df_actuals_hourly.copy()
        if target_date:
            df_act = df_act[df_act['settlementDate'] == target_date]

        records = []
        for _, h_row in df_act.iterrows():
            h_time = h_row['hour_start']
            d_date = h_time.date()

            if cutoff_hour == -1:
                # Latest Intraday forecast published up to the delivery hour start
                cutoff = h_time
            else:
                # Day-ahead decision cutoff on D-1 at cutoff_hour:00 UTC
                cutoff = pd.Timestamp(d_date - timedelta(days=1), tz='UTC') + timedelta(hours=cutoff_hour)

            matching = self._df_forecasts[
                (self._df_forecasts['startTime'] == h_time) &
                (self._df_forecasts['publishTime'] <= cutoff)
            ]

            if not matching.empty:
                latest = matching.sort_values('publishTime', ascending=False).iloc[0]
                fc_val = float(latest['generation'])
                pub_time = latest['publishTime'].isoformat()
            else:
                fc_val = np.nan
                pub_time = None

            records.append({
                'hour_start': h_time,
                'settlementDate': h_row['settlementDate'],
                'actual_mw': float(h_row['actual_mw']),
                'forecast_mw': fc_val,
                'publish_time': pub_time,
                'is_peak': (PEAK_HOUR_START <= h_time.hour < PEAK_HOUR_END)
            })

        df_res = pd.DataFrame(records).dropna(subset=['forecast_mw'])
        df_res['error_mw'] = df_res['forecast_mw'] - df_res['actual_mw']
        df_res['abs_error_mw'] = df_res['error_mw'].abs()
        return df_res

    def get_day_ahead_view(self, delivery_date: str, cutoff_hour: int = DEFAULT_CUTOFF_HOUR) -> DayAheadResponse:
        df = self.get_aligned_data(cutoff_hour=cutoff_hour, target_date=delivery_date)
        metrics = self._calc_metrics_from_df(df)

        points = []
        for _, row in df.iterrows():
            h_time = row['hour_start']
            hour_val = h_time.hour
            sp1 = hour_val * 2 + 1
            sp2 = hour_val * 2 + 2

            act = row['actual_mw']
            fc = row['forecast_mw']
            err = row['error_mw']
            abs_err = row['abs_error_mw']
            pct_err = round((abs_err / act * 100), 2) if act > 0 else None

            points.append(DayAheadTimeSeriesPoint(
                startTime=h_time.isoformat(),
                settlementPeriod=sp1,
                forecastMW=round(fc, 1),
                actualMW=round(act, 1),
                errorMW=round(err, 1),
                absErrorMW=round(abs_err, 1),
                percentageError=pct_err,
                publishTime=row['publish_time'],
                isPeak=row['is_peak']
            ))

        cutoff_label = (
            f"Intraday (up to delivery hour)" if cutoff_hour == -1
            else f"Day-Ahead D-1 at {cutoff_hour:02d}:00 UTC"
        )

        return DayAheadResponse(
            deliveryDate=delivery_date,
            decisionCutoffUsed=cutoff_label,
            cutoffHour=cutoff_hour,
            metrics=metrics,
            timeSeries=points
        )

    def get_monthly_overview(self, cutoff_hour: int = DEFAULT_CUTOFF_HOUR) -> MonthlyOverviewResponse:
        df = self.get_aligned_data(cutoff_hour=cutoff_hour)
        overall_metrics = self._calc_metrics_from_df(df)

        # Peak vs Off-Peak
        peak_df = df[df['is_peak']]
        offpeak_df = df[~df['is_peak']]
        segment_metrics = MarketSegmentMetrics(
            peak=self._calc_metrics_from_df(peak_df),
            offPeak=self._calc_metrics_from_df(offpeak_df)
        )

        # Diurnal (hour 0 to 23 across all 31 days)
        diurnal_points = []
        for hour in range(24):
            hour_df = df[df['hour_start'].dt.hour == hour]
            if not hour_df.empty:
                h_mae = float(hour_df['abs_error_mw'].mean())
                h_rmse = float(np.sqrt((hour_df['error_mw'] ** 2).mean()))
                h_bias = float(hour_df['error_mw'].mean())
                h_act = float(hour_df['actual_mw'].mean())
                h_fc = float(hour_df['forecast_mw'].mean())
            else:
                h_mae = h_rmse = h_bias = h_act = h_fc = 0.0

            diurnal_points.append(DiurnalPoint(
                hour=hour,
                settlementPeriods=[hour * 2 + 1, hour * 2 + 2],
                maeMW=round(h_mae, 1),
                rmseMW=round(h_rmse, 1),
                biasMW=round(h_bias, 1),
                meanActualMW=round(h_act, 1),
                meanForecastMW=round(h_fc, 1),
                isPeak=(PEAK_HOUR_START <= hour < PEAK_HOUR_END)
            ))

        # Daily summaries
        daily_summaries = []
        for d_str, day_df in df.groupby('settlementDate'):
            d_mae = float(day_df['abs_error_mw'].mean())
            d_rmse = float(np.sqrt((day_df['error_mw'] ** 2).mean()))
            d_bias = float(day_df['error_mw'].mean())
            act_sum = float(day_df['actual_mw'].sum())
            d_wape = float((day_df['abs_error_mw'].sum() / act_sum) * 100) if act_sum > 0 else 0.0
            max_over = float(day_df['error_mw'].max())
            max_under = float(day_df['error_mw'].min())

            if d_bias > 500:
                dom_risk = "Deficit (Over-forecast)"
            elif d_bias < -500:
                dom_risk = "Surplus (Under-forecast)"
            else:
                dom_risk = "Balanced"

            daily_summaries.append(DailySummary(
                date=str(d_str),
                actualMWh=round(act_sum, 1),
                forecastMWh=round(float(day_df['forecast_mw'].sum()), 1),
                maeMW=round(d_mae, 1),
                biasMW=round(d_bias, 1),
                rmseMW=round(d_rmse, 1),
                wapePercent=round(d_wape, 2),
                maxOverForecastMW=round(max_over, 1),
                maxUnderForecastMW=round(max_under, 1),
                dominantRisk=dom_risk
            ))

        daily_summaries.sort(key=lambda x: x.date)

        return MonthlyOverviewResponse(
            month="2026-01",
            cutoffHour=cutoff_hour,
            metrics=overall_metrics,
            segmentMetrics=segment_metrics,
            diurnalProfile=diurnal_points,
            dailySummaries=daily_summaries
        )

    def get_forecast_evolution(self, target_start_time: str) -> EvolutionSeries:
        """
        Tracks all forecast releases published prior to delivery for a specific target hour,
        illustrating how the forecast evolved towards actuals (vintage curves).
        """
        if self._df_forecasts is None:
            self._prepare_dataframes()

        target_dt = pd.to_datetime(target_start_time, utc=True)
        # Find actual for this hour
        act_row = self._df_actuals_hourly[self._df_actuals_hourly['hour_start'] == target_dt]
        actual_val = float(act_row.iloc[0]['actual_mw']) if not act_row.empty else 0.0

        # All forecasts for this target_dt published up to target_dt
        fc_rows = self._df_forecasts[
            (self._df_forecasts['startTime'] == target_dt) &
            (self._df_forecasts['publishTime'] <= target_dt)
        ].sort_values('publishTime')

        points = []
        for _, r in fc_rows.iterrows():
            lead_hours = (target_dt - r['publishTime']).total_seconds() / 3600.0
            points.append(EvolutionPoint(
                publishTime=r['publishTime'].isoformat(),
                forecastMW=round(float(r['generation']), 1),
                hoursBeforeDelivery=round(lead_hours, 1)
            ))

        return EvolutionSeries(
            targetStartTime=target_dt.isoformat(),
            actualMW=round(actual_val, 1),
            forecasts=points
        )

    def simulate_procurement(self, req: ProcurementSimRequest, cutoff_hour: int = DEFAULT_CUTOFF_HOUR) -> ProcurementSimResult:
        """
        Simulates utility power procurement with and without risk-buffer protection:
        - Raw Procurement = max(0, Demand - WindForecast)
        - Buffered Procurement = max(0, Demand - (WindForecast - Buffer))
        - Actual Net Deficit = max(0, Demand - WindActual)
        Quantifies avoided imbalance exposure and financial savings.
        """
        df = self.get_aligned_data(cutoff_hour=cutoff_hour)
        metrics = self._calc_metrics_from_df(df)

        # Determine buffer in MW
        if req.confidenceLevel == "None":
            buffer_mw = 0.0
            strategy_name = "Raw Wind Forecast (No Buffer / Zero Protection)"
        elif req.confidenceLevel == "Mean_Bias":
            buffer_mw = max(0.0, metrics.biasMW)
            strategy_name = f"Mean Bias Correction (+{round(buffer_mw)} MW)"
        elif req.confidenceLevel == "P75":
            buffer_mw = max(0.0, metrics.p75ErrorMW)
            strategy_name = f"P75 Confidence Buffer (+{round(buffer_mw)} MW)"
        elif req.confidenceLevel == "P90":
            buffer_mw = max(0.0, metrics.p90ErrorMW)
            strategy_name = f"P90 Confidence Buffer (+{round(buffer_mw)} MW)"
        elif req.confidenceLevel == "P95":
            buffer_mw = max(0.0, metrics.p95ErrorMW)
            strategy_name = f"P95 Conservative Buffer (+{round(buffer_mw)} MW)"
        elif req.confidenceLevel == "Custom" and req.customBufferMW is not None:
            buffer_mw = max(0.0, req.customBufferMW)
            strategy_name = f"Custom Safety Buffer (+{round(buffer_mw)} MW)"
        else:
            buffer_mw = max(0.0, metrics.p90ErrorMW)
            strategy_name = f"P90 Confidence Buffer (+{round(buffer_mw)} MW)"

        # Raw schedule: procurement based on raw forecast
        # If forecast is higher than actual, utility under-procured!
        # Under-procured deficit = max(0, actual_thermal_needed - raw_procured_thermal)
        demand = req.demandMW
        raw_thermal = np.maximum(0.0, demand - df['forecast_mw'])
        buffered_thermal = np.maximum(0.0, demand - (df['forecast_mw'] - buffer_mw))
        actual_thermal_needed = np.maximum(0.0, demand - df['actual_mw'])

        raw_deficit = np.maximum(0.0, actual_thermal_needed - raw_thermal)
        buffered_deficit = np.maximum(0.0, actual_thermal_needed - buffered_thermal)

        unhedged_hours = int((raw_deficit > 0).sum())
        raw_deficit_mwh = float(raw_deficit.sum())
        buffered_deficit_mwh = float(buffered_deficit.sum())
        avoided_exposure_mwh = float(raw_deficit_mwh - buffered_deficit_mwh)

        penalty = req.imbalancePenaltyPerMWh
        raw_cost = raw_deficit_mwh * penalty
        savings = avoided_exposure_mwh * penalty

        return ProcurementSimResult(
            strategy=strategy_name,
            appliedBufferMW=round(buffer_mw, 1),
            rawThermalRequiredMWh=round(float(raw_thermal.sum()), 1),
            adjustedThermalRequiredMWh=round(float(buffered_thermal.sum()), 1),
            unhedgedDeficitHours=unhedged_hours,
            unhedgedDeficitMWh=round(raw_deficit_mwh, 1),
            avoidedImbalanceExposureMWh=round(avoided_exposure_mwh, 1),
            estimatedImbalanceRiskCostGBP=round(raw_cost, 2),
            estimatedRiskSavingsGBP=round(savings, 2),
            notes=(
                f"Applying a {round(buffer_mw)} MW safety buffer across January 2026 protects the utility "
                f"against {round(avoided_exposure_mwh):,} MWh of high-cost peak deficit imbalance volume, "
                f"yielding an estimated £{round(savings):,} in avoided balancing cashout exposure."
            )
        )

# Singleton instance
analytics_engine = AnalyticsEngine()
