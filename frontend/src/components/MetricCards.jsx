import React from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, BarChart3, ShieldAlert, Zap, Flame } from 'lucide-react';

export default function MetricCards({ metrics, segmentMetrics, isDayView = false, selectedDate = '' }) {
  if (!metrics) return null;

  const biasDirection = metrics.biasMW >= 0 ? 'Over-forecast (Deficit Risk)' : 'Under-forecast (Surplus)';
  const biasClass = metrics.biasMW >= 0 ? 'text-rose' : 'text-amber';

  return (
    <div className="metrics-grid">
      {/* 1. MAE Card */}
      <div className="metric-card glass-panel">
        <div className="metric-header">
          <span className="metric-title">Mean Absolute Error (MAE)</span>
          <div className="metric-icon-box cyan">
            <BarChart3 size={18} />
          </div>
        </div>
        <div className="metric-value-row">
          <span className="metric-value text-cyan">{metrics.maeMW.toLocaleString()}</span>
          <span className="metric-unit">MW</span>
        </div>
        <div className="metric-subtext">
          <span>WAPE: <strong className="text-white">{metrics.wapePercent}%</strong></span>
          <span className="metric-tag">{isDayView ? `Day ${selectedDate}` : 'Month Jan 2026'}</span>
        </div>
      </div>

      {/* 2. Bias (Mean Error) Card */}
      <div className="metric-card glass-panel">
        <div className="metric-header">
          <span className="metric-title">Forecast Bias (Mean Error)</span>
          <div className="metric-icon-box rose">
            <AlertTriangle size={18} />
          </div>
        </div>
        <div className="metric-value-row">
          <span className={`metric-value ${biasClass}`}>
            {metrics.biasMW >= 0 ? `+${metrics.biasMW.toLocaleString()}` : metrics.biasMW.toLocaleString()}
          </span>
          <span className="metric-unit">MW</span>
        </div>
        <div className="metric-subtext">
          <span className={`badge-risk ${metrics.biasMW > 500 ? 'risk-high' : 'risk-moderate'}`}>
            {biasDirection}
          </span>
          <span className="text-muted">Median: {metrics.p50ErrorMW} MW</span>
        </div>
      </div>

      {/* 3. RMSE Card */}
      <div className="metric-card glass-panel">
        <div className="metric-header">
          <span className="metric-title">Root Mean Squared Error</span>
          <div className="metric-icon-box purple">
            <TrendingUp size={18} />
          </div>
        </div>
        <div className="metric-value-row">
          <span className="metric-value text-purple">{metrics.rmseMW.toLocaleString()}</span>
          <span className="metric-unit">MW</span>
        </div>
        <div className="metric-subtext">
          <span>Correlation (r): <strong className="text-white">{metrics.correlation}</strong></span>
          <span className="text-muted">R²: {metrics.rSquared}</span>
        </div>
      </div>

      {/* 4. Peak Market Exposure Card */}
      <div className="metric-card glass-panel">
        <div className="metric-header">
          <span className="metric-title">Peak Period Error (07-19 UTC)</span>
          <div className="metric-icon-box amber">
            <Flame size={18} />
          </div>
        </div>
        <div className="metric-value-row">
          <span className="metric-value text-amber">
            {segmentMetrics ? segmentMetrics.peak.maeMW.toLocaleString() : (metrics.maeMW * 1.05).toFixed(0)}
          </span>
          <span className="metric-unit">MW</span>
        </div>
        <div className="metric-subtext">
          <span>Off-Peak MAE: <strong className="text-white">{segmentMetrics ? segmentMetrics.offPeak.maeMW.toLocaleString() : (metrics.maeMW * 0.95).toFixed(0)} MW</strong></span>
          <span className="badge-peak">High Cashout Impact</span>
        </div>
      </div>

      {/* 5. Worst-Case Deficit (P90) */}
      <div className="metric-card glass-panel">
        <div className="metric-header">
          <span className="metric-title">P90 Deficit Risk Exposure</span>
          <div className="metric-icon-box red">
            <ShieldAlert size={18} />
          </div>
        </div>
        <div className="metric-value-row">
          <span className="metric-value text-rose">
            +{metrics.p90ErrorMW.toLocaleString()}
          </span>
          <span className="metric-unit">MW</span>
        </div>
        <div className="metric-subtext">
          <span>Max Over-forecast: <strong className="text-rose">+{metrics.maxOverForecastMW.toLocaleString()} MW</strong></span>
          <span className="text-muted">P10: {metrics.p10ErrorMW} MW</span>
        </div>
      </div>

      {/* 6. Total Generation Delivered */}
      <div className="metric-card glass-panel">
        <div className="metric-header">
          <span className="metric-title">Mean Actual Wind Generation</span>
          <div className="metric-icon-box green">
            <Zap size={18} />
          </div>
        </div>
        <div className="metric-value-row">
          <span className="metric-value text-green">{metrics.meanActualMW.toLocaleString()}</span>
          <span className="metric-unit">MW</span>
        </div>
        <div className="metric-subtext">
          <span>Mean Forecast: <strong className="text-purple">{metrics.meanForecastMW.toLocaleString()} MW</strong></span>
          <span className="text-muted">Total Hours: {metrics.totalHours}</span>
        </div>
      </div>
    </div>
  );
}
