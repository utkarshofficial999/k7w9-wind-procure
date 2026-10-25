import React from 'react';
import { AlertTriangle, BarChart2, ShieldAlert, Zap } from 'lucide-react';

export default function MetricCards({ metrics, isDayView = false, selectedDate = '' }) {
  if (!metrics) return null;

  const isOver = metrics.biasMW >= 0;

  return (
    <div className="clean-metrics-grid">
      {/* 1. Forecast Bias */}
      <div className="clean-metric-card">
        <div className="clean-metric-header">
          <span className="clean-metric-title">Forecast Bias (Mean Error)</span>
          <div className="clean-icon-pill rose">
            <AlertTriangle size={15} />
          </div>
        </div>
        <div className="clean-metric-body">
          <span className={`clean-metric-number ${isOver ? 'text-rose' : 'text-amber'}`}>
            {isOver ? `+${metrics.biasMW.toLocaleString()}` : metrics.biasMW.toLocaleString()}
          </span>
          <span className="clean-metric-unit">MW</span>
        </div>
        <div className="clean-metric-footer">
          <span className="clean-status-pill danger">
            {isOver ? 'Over-forecast (Deficit Risk)' : 'Under-forecast (Surplus)'}
          </span>
          <span className="clean-metric-context">Median: {metrics.p50ErrorMW} MW</span>
        </div>
      </div>

      {/* 2. Mean Absolute Error */}
      <div className="clean-metric-card">
        <div className="clean-metric-header">
          <span className="clean-metric-title">Mean Absolute Error (MAE)</span>
          <div className="clean-icon-pill blue">
            <BarChart2 size={15} />
          </div>
        </div>
        <div className="clean-metric-body">
          <span className="clean-metric-number">
            {metrics.maeMW.toLocaleString()}
          </span>
          <span className="clean-metric-unit">MW</span>
        </div>
        <div className="clean-metric-footer">
          <span className="clean-status-pill neutral">
            WAPE: {metrics.wapePercent}%
          </span>
          <span className="clean-metric-context">RMSE: {metrics.rmseMW.toLocaleString()} MW</span>
        </div>
      </div>

      {/* 3. P90 Deficit Risk */}
      <div className="clean-metric-card">
        <div className="clean-metric-header">
          <span className="clean-metric-title">P90 Deficit Risk Exposure</span>
          <div className="clean-icon-pill amber">
            <ShieldAlert size={15} />
          </div>
        </div>
        <div className="clean-metric-body">
          <span className="clean-metric-number text-rose">
            +{metrics.p90ErrorMW.toLocaleString()}
          </span>
          <span className="clean-metric-unit">MW</span>
        </div>
        <div className="clean-metric-footer">
          <span className="clean-status-pill warning">
            Recommended Buffer Target
          </span>
          <span className="clean-metric-context">Max: +{metrics.maxOverForecastMW.toLocaleString()} MW</span>
        </div>
      </div>

      {/* 4. Actual Wind Generation */}
      <div className="clean-metric-card">
        <div className="clean-metric-header">
          <span className="clean-metric-title">Mean Actual Wind Generation</span>
          <div className="clean-icon-pill green">
            <Zap size={15} />
          </div>
        </div>
        <div className="clean-metric-body">
          <span className="clean-metric-number text-green">
            {metrics.meanActualMW.toLocaleString()}
          </span>
          <span className="clean-metric-unit">MW</span>
        </div>
        <div className="clean-metric-footer">
          <span className="clean-status-pill success">
            Forecast: {metrics.meanForecastMW.toLocaleString()} MW
          </span>
          <span className="clean-metric-context">
            {isDayView ? `Delivery ${selectedDate}` : 'Month Jan 2026 (744h)'}
          </span>
        </div>
      </div>
    </div>
  );
}
