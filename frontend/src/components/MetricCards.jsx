import React, { useState } from 'react';
import { AlertTriangle, BarChart2, ShieldAlert, Zap, Info } from 'lucide-react';

export default function MetricCards({ dayMetrics, monthMetrics, selectedDate = '2026-01-15' }) {
  const [scope, setScope] = useState('day'); // 'day' | 'month'
  const [showP90Tooltip, setShowP90Tooltip] = useState(false);

  const activeMetrics = scope === 'day' ? (dayMetrics || monthMetrics) : monthMetrics;
  if (!activeMetrics) return null;

  const isOver = activeMetrics.biasMW >= 0;
  const scopeBadgeText = scope === 'day' ? `Day: ${selectedDate}` : 'Month: Jan 2026';

  return (
    <div className="kpi-section-wrapper">
      {/* Scope Switcher Controls */}
      <div className="kpi-scope-bar">
        <div className="kpi-scope-left">
          <span className="kpi-scope-title">KPI Evaluation Scope:</span>
          <div className="kpi-scope-toggle-group">
            <button
              className={`kpi-scope-btn ${scope === 'day' ? 'active' : ''}`}
              onClick={() => setScope('day')}
            >
              Day Scope ({selectedDate})
            </button>
            <button
              className={`kpi-scope-btn ${scope === 'month' ? 'active' : ''}`}
              onClick={() => setScope('month')}
            >
              Month Scope (Jan 2026, 744 hrs)
            </button>
          </div>
        </div>
        <div className="kpi-scope-right">
          <span className="kpi-active-indicator">
            Viewing <strong>{scope === 'day' ? `Selected Day (${selectedDate})` : 'Entire Month (January 2026)'}</strong> Metrics
          </span>
        </div>
      </div>

      <div className="clean-metrics-grid">
        {/* 1. Forecast Bias */}
        <div className="clean-metric-card">
          <div className="clean-metric-header">
            <div className="title-with-badge">
              <span className="clean-metric-title">Forecast Bias (Mean Error)</span>
              <span className="metric-scope-badge">{scopeBadgeText}</span>
            </div>
            <div className="clean-icon-pill rose">
              <AlertTriangle size={15} />
            </div>
          </div>
          <div className="clean-metric-body">
            <div className="metric-main-val">
              <span className={`clean-metric-number ${isOver ? 'text-rose' : 'text-amber'}`}>
                {isOver ? `+${activeMetrics.biasMW.toLocaleString()}` : activeMetrics.biasMW.toLocaleString()}
              </span>
              <span className="clean-metric-unit">MW</span>
            </div>
            {monthMetrics && dayMetrics && (
              <div className="companion-metric-pill">
                {scope === 'day' ? (
                  <span>Month: <strong>+{monthMetrics.biasMW.toLocaleString()} MW</strong></span>
                ) : (
                  <span>Day: <strong>+{dayMetrics.biasMW.toLocaleString()} MW</strong></span>
                )}
              </div>
            )}
          </div>

          {/* Same-Sign Error Note */}
          {activeMetrics.allErrorsSameSign && activeMetrics.sameSignNote && (
            <div className="same-sign-alert">
              <Info size={13} className="shrink-0" />
              <span>{activeMetrics.sameSignNote}</span>
            </div>
          )}

          {/* Curtailment / Constraint Clarification Note */}
          <div className="curtailment-note">
            Forecast = potential output; actual = metered generation. Curtailment/constraints can explain part of the over-forecast.
          </div>

          <div className="clean-metric-footer">
            <span className="clean-status-pill danger">
              {isOver ? 'Over-forecast (Deficit Risk)' : 'Under-forecast (Surplus)'}
            </span>
            <span className="clean-metric-context">Median: {activeMetrics.p50ErrorMW} MW</span>
          </div>
        </div>

        {/* 2. Mean Absolute Error */}
        <div className="clean-metric-card">
          <div className="clean-metric-header">
            <div className="title-with-badge">
              <span className="clean-metric-title">Mean Absolute Error (MAE)</span>
              <span className="metric-scope-badge">{scopeBadgeText}</span>
            </div>
            <div className="clean-icon-pill blue">
              <BarChart2 size={15} />
            </div>
          </div>
          <div className="clean-metric-body">
            <div className="metric-main-val">
              <span className="clean-metric-number">
                {activeMetrics.maeMW.toLocaleString()}
              </span>
              <span className="clean-metric-unit">MW</span>
            </div>
            {monthMetrics && dayMetrics && (
              <div className="companion-metric-pill">
                {scope === 'day' ? (
                  <span>Month: <strong>{monthMetrics.maeMW.toLocaleString()} MW</strong></span>
                ) : (
                  <span>Day: <strong>{dayMetrics.maeMW.toLocaleString()} MW</strong></span>
                )}
              </div>
            )}
          </div>
          <div className="clean-metric-footer">
            <span className="clean-status-pill neutral">
              WAPE: {activeMetrics.wapePercent}%
            </span>
            <span className="clean-metric-context">RMSE: {activeMetrics.rmseMW.toLocaleString()} MW</span>
          </div>
        </div>

        {/* 3. P90 Deficit Risk */}
        <div className="clean-metric-card">
          <div className="clean-metric-header">
            <div className="title-with-badge">
              <span className="clean-metric-title">P90 Deficit Risk Exposure</span>
              <span className="metric-scope-badge">{scopeBadgeText}</span>
            </div>
            <div 
              className="clean-icon-pill amber cursor-pointer relative"
              onMouseEnter={() => setShowP90Tooltip(true)}
              onMouseLeave={() => setShowP90Tooltip(false)}
              onClick={() => setShowP90Tooltip(!showP90Tooltip)}
              title="Click to learn why Daily P90 differs from Monthly P90"
            >
              <ShieldAlert size={15} />
            </div>
          </div>
          <div className="clean-metric-body">
            <div className="metric-main-val">
              <span className="clean-metric-number text-rose">
                +{activeMetrics.p90ErrorMW.toLocaleString()}
              </span>
              <span className="clean-metric-unit">MW</span>
            </div>
            {monthMetrics && dayMetrics && (
              <div className="companion-metric-pill">
                {scope === 'day' ? (
                  <span>Month: <strong>+{monthMetrics.p90ErrorMW.toLocaleString()} MW</strong></span>
                ) : (
                  <span>Day: <strong>+{dayMetrics.p90ErrorMW.toLocaleString()} MW</strong></span>
                )}
              </div>
            )}
          </div>

          {/* Interactive Tooltip on P90 Card */}
          <div className="p90-tooltip-box">
            <div className="p90-tooltip-trigger" onClick={() => setShowP90Tooltip(!showP90Tooltip)}>
              <Info size={13} className="text-amber" />
              <span>Why daily P90 (+{(dayMetrics?.p90ErrorMW ?? 1668.5).toLocaleString()} MW) differs from monthly P90 (+{(monthMetrics?.p90ErrorMW ?? 4312).toLocaleString()} MW)</span>
            </div>
            {showP90Tooltip && (
              <div className="p90-tooltip-content">
                <strong>Scope Variance Rationale:</strong>
                <p>
                  • <strong>Daily P90 (+{(dayMetrics?.p90ErrorMW ?? 1668.5).toLocaleString()} MW)</strong>: Evaluates the 90th percentile error across the 24 delivery hours of {selectedDate}. It measures within-day variation under a single, localized meteorological regime.
                </p>
                <p>
                  • <strong>Monthly P90 (+{(monthMetrics?.p90ErrorMW ?? 4312).toLocaleString()} MW)</strong>: Evaluates all 744 hours in January 2026, capturing extreme weather front shifts, rapid ramp events, and month-wide tail risk collapses. For hedging day-ahead thermal procurement, the Monthly P90 provides true multi-day downside coverage.
                </p>
              </div>
            )}
          </div>

          <div className="clean-metric-footer">
            <span className="clean-status-pill warning">
              {scope === 'month' ? 'Default Procurement Buffer' : 'Intra-Day Tail Target'}
            </span>
            <span className="clean-metric-context">Max: +{activeMetrics.maxOverForecastMW.toLocaleString()} MW</span>
          </div>
        </div>

        {/* 4. Actual Wind Generation */}
        <div className="clean-metric-card">
          <div className="clean-metric-header">
            <div className="title-with-badge">
              <span className="clean-metric-title">Mean Actual Wind Generation</span>
              <span className="metric-scope-badge">{scopeBadgeText}</span>
            </div>
            <div className="clean-icon-pill green">
              <Zap size={15} />
            </div>
          </div>
          <div className="clean-metric-body">
            <div className="metric-main-val">
              <span className="clean-metric-number text-green">
                {activeMetrics.meanActualMW.toLocaleString()}
              </span>
              <span className="clean-metric-unit">MW</span>
            </div>
            {monthMetrics && dayMetrics && (
              <div className="companion-metric-pill">
                {scope === 'day' ? (
                  <span>Month: <strong>{monthMetrics.meanActualMW.toLocaleString()} MW</strong></span>
                ) : (
                  <span>Day: <strong>{dayMetrics.meanActualMW.toLocaleString()} MW</strong></span>
                )}
              </div>
            )}
          </div>
          <div className="clean-metric-footer">
            <span className="clean-status-pill success">
              Forecast: {activeMetrics.meanForecastMW.toLocaleString()} MW
            </span>
            <span className="clean-metric-context">
              {scope === 'day' ? `Day ${selectedDate}` : 'Month Jan 2026 (744h)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
