import React, { useState } from 'react';
import { AlertTriangle, BarChart2, ShieldAlert, Zap, Info, HelpCircle } from 'lucide-react';
import { GlossaryTooltip } from './Glossary';

export default function MetricCards({ dayMetrics, monthMetrics, selectedDate = '2026-01-15', mode = 'beginner' }) {
  const [scope, setScope] = useState('day'); // 'day' | 'month'
  const [activeInfoCard, setActiveInfoCard] = useState(null); // which card's 'i' popover is open
  const [hoveredCard, setHoveredCard] = useState(null);

  const activeMetrics = scope === 'day' ? (dayMetrics || monthMetrics) : monthMetrics;
  if (!activeMetrics) return null;

  const isOver = activeMetrics.biasMW >= 0;
  const otherScopeMetrics = scope === 'day' ? monthMetrics : (dayMetrics || monthMetrics);
  const otherScopeLabel = scope === 'day' ? 'Whole month' : `This day (${selectedDate})`;

  // ==================== EXPERT MODE VIEW ====================
  if (mode === 'expert') {
    const scopeBadgeText = scope === 'day' ? `Day: ${selectedDate}` : 'Month: Jan 2026';

    return (
      <div className="kpi-section-wrapper" id="tour-kpi-cards">
        {/* Scope Switcher Controls */}
        <div className="kpi-scope-bar" id="tour-scope-switch">
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
                <span className="clean-metric-title">
                  <GlossaryTooltip termKey="Over-forecast">Forecast Bias (Mean Error)</GlossaryTooltip>
                </span>
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

            {activeMetrics.allErrorsSameSign && activeMetrics.sameSignNote && (
              <div className="same-sign-alert">
                <Info size={13} className="shrink-0" />
                <span>{activeMetrics.sameSignNote}</span>
              </div>
            )}

            <div className="curtailment-note">
              Forecast = potential output; actual = metered generation. <GlossaryTooltip termKey="Curtailment">Curtailment</GlossaryTooltip>/constraints can explain part of the over-forecast.
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
                <span className="clean-metric-title">
                  <GlossaryTooltip termKey="MAE">Mean Absolute Error (MAE)</GlossaryTooltip>
                </span>
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
                <GlossaryTooltip termKey="WAPE">WAPE</GlossaryTooltip>: {activeMetrics.wapePercent}%
              </span>
              <span className="clean-metric-context">
                <GlossaryTooltip termKey="RMSE">RMSE</GlossaryTooltip>: {activeMetrics.rmseMW.toLocaleString()} MW
              </span>
            </div>
          </div>

          {/* 3. P90 Deficit Risk */}
          <div className="clean-metric-card">
            <div className="clean-metric-header">
              <div className="title-with-badge">
                <span className="clean-metric-title">
                  <GlossaryTooltip termKey="P90">P90 Deficit Risk Exposure</GlossaryTooltip>
                </span>
                <span className="metric-scope-badge">{scopeBadgeText}</span>
              </div>
              <div className="clean-icon-pill amber">
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

            <div className="p90-tooltip-box">
              <div className="p90-tooltip-trigger">
                <Info size={13} className="text-amber" />
                <span>Why daily P90 (+{(dayMetrics?.p90ErrorMW ?? 1668.5).toLocaleString()} MW) differs from monthly P90 (+{(monthMetrics?.p90ErrorMW ?? 4312).toLocaleString()} MW)</span>
              </div>
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

  // ==================== BEGINNER MODE VIEW (Requirement 3) ====================
  const toggleInfo = (cardId) => {
    setActiveInfoCard(activeInfoCard === cardId ? null : cardId);
  };

  return (
    <div className="beginner-kpi-container" id="tour-kpi-cards">
      {/* Single Simplified Scope Control (Requirement 3) */}
      <div className="beginner-scope-row" id="tour-scope-switch">
        <span className="beginner-scope-label">Show:</span>
        <div className="beginner-scope-switch" role="radiogroup" aria-label="Data Scope">
          <button
            className={`scope-pill-btn ${scope === 'day' ? 'active' : ''}`}
            onClick={() => setScope('day')}
            role="radio"
            aria-checked={scope === 'day'}
          >
            This day ({selectedDate})
          </button>
          <button
            className={`scope-pill-btn ${scope === 'month' ? 'active' : ''}`}
            onClick={() => setScope('month')}
            role="radio"
            aria-checked={scope === 'month'}
          >
            Whole month (Jan 2026)
          </button>
        </div>
        <span className="text-muted text-xs hidden-mobile">
          Hover over cards to compare with {otherScopeLabel.toLowerCase()}
        </span>
      </div>

      {/* 4 Plain-English Cards */}
      <div className="clean-metrics-grid">
        {/* Card 1: Average over-estimate */}
        <div 
          className="clean-metric-card beginner-card"
          onMouseEnter={() => setHoveredCard('bias')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="clean-metric-header">
            <div>
              <h3 className="beginner-metric-title">Average over-estimate</h3>
              <span className="beginner-metric-sub">Forecast Bias</span>
            </div>
            <button 
              className="info-icon-btn" 
              onClick={() => toggleInfo('bias')}
              title="Show technical statistics"
              aria-label="Show technical details for Forecast Bias"
            >
              <Info size={16} />
            </button>
          </div>

          <div className="beginner-metric-body">
            <div className="metric-main-val">
              <span className={`clean-metric-number ${isOver ? 'text-rose' : 'text-amber'}`}>
                {isOver ? `+${activeMetrics.biasMW.toLocaleString()}` : activeMetrics.biasMW.toLocaleString()}
              </span>
              <span className="clean-metric-unit">MW</span>
            </div>

            {/* Subtle other-scope preview on hover */}
            {hoveredCard === 'bias' && otherScopeMetrics && (
              <div className="other-scope-hint">
                {otherScopeLabel}: <strong>+{otherScopeMetrics.biasMW.toLocaleString()} MW</strong>
              </div>
            )}
          </div>

          {/* Verdict & Plain English Sentence */}
          <div className="beginner-verdict-row">
            <span className={`clean-status-pill ${isOver ? 'danger' : 'warning'}`}>
              {isOver ? 'Over-promised wind' : 'Under-promised wind'}
            </span>
          </div>
          <p className="beginner-plain-sentence">
            On average the forecast promised <strong>{Math.abs(activeMetrics.biasMW).toLocaleString()} MW</strong> {isOver ? 'more wind than we got' : 'less wind than we got'}.
          </p>

          {/* Technical Info Drawer for Card 1 */}
          {activeInfoCard === 'bias' && (
            <div className="beginner-info-popover">
              <div className="popover-line">Median error: <strong>{activeMetrics.p50ErrorMW} MW</strong></div>
              {activeMetrics.allErrorsSameSign && activeMetrics.sameSignNote && (
                <div className="popover-line highlight">{activeMetrics.sameSignNote}</div>
              )}
              <div className="popover-note">
                Forecast = potential output; actual = metered generation. Curtailment/constraints can explain part of the over-forecast.
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Typical miss size */}
        <div 
          className="clean-metric-card beginner-card"
          onMouseEnter={() => setHoveredCard('mae')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="clean-metric-header">
            <div>
              <h3 className="beginner-metric-title">Typical miss size</h3>
              <span className="beginner-metric-sub">Mean Absolute Error (MAE)</span>
            </div>
            <button 
              className="info-icon-btn" 
              onClick={() => toggleInfo('mae')}
              title="Show technical statistics"
              aria-label="Show technical details for MAE"
            >
              <Info size={16} />
            </button>
          </div>

          <div className="beginner-metric-body">
            <div className="metric-main-val">
              <span className="clean-metric-number">
                {activeMetrics.maeMW.toLocaleString()}
              </span>
              <span className="clean-metric-unit">MW</span>
            </div>

            {hoveredCard === 'mae' && otherScopeMetrics && (
              <div className="other-scope-hint">
                {otherScopeLabel}: <strong>{otherScopeMetrics.maeMW.toLocaleString()} MW</strong>
              </div>
            )}
          </div>

          <div className="beginner-verdict-row">
            <span className="clean-status-pill neutral">
              Typical margin of error
            </span>
          </div>
          <p className="beginner-plain-sentence">
            Hourly forecasts were off by about <strong>{activeMetrics.maeMW.toLocaleString()} MW</strong> in either direction.
          </p>

          {activeInfoCard === 'mae' && (
            <div className="beginner-info-popover">
              <div className="popover-line">WAPE (Weighted % Error): <strong>{activeMetrics.wapePercent}%</strong></div>
              <div className="popover-line">RMSE (Extreme Miss Penalty): <strong>{activeMetrics.rmseMW.toLocaleString()} MW</strong></div>
            </div>
          )}
        </div>

        {/* Card 3: Worst-case shortfall (9 days in 10) */}
        <div 
          className="clean-metric-card beginner-card"
          onMouseEnter={() => setHoveredCard('p90')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="clean-metric-header">
            <div>
              <h3 className="beginner-metric-title">Worst-case shortfall (9 days in 10)</h3>
              <span className="beginner-metric-sub">P90 Deficit Risk</span>
            </div>
            <button 
              className="info-icon-btn" 
              onClick={() => toggleInfo('p90')}
              title="Show technical statistics"
              aria-label="Show technical details for P90"
            >
              <Info size={16} />
            </button>
          </div>

          <div className="beginner-metric-body">
            <div className="metric-main-val">
              <span className="clean-metric-number text-rose">
                +{activeMetrics.p90ErrorMW.toLocaleString()}
              </span>
              <span className="clean-metric-unit">MW</span>
            </div>

            {hoveredCard === 'p90' && otherScopeMetrics && (
              <div className="other-scope-hint">
                {otherScopeLabel}: <strong>+{otherScopeMetrics.p90ErrorMW.toLocaleString()} MW</strong>
              </div>
            )}
          </div>

          <div className="beginner-verdict-row">
            <span className="clean-status-pill danger">
              Critical safety margin
            </span>
          </div>
          <p className="beginner-plain-sentence">
            On 90% of hours, wind fell short of the forecast by up to <strong>{activeMetrics.p90ErrorMW.toLocaleString()} MW</strong>.
          </p>

          {activeInfoCard === 'p90' && (
            <div className="beginner-info-popover">
              <div className="popover-line">
                Scope explanation: Daily P90 (+{(dayMetrics?.p90ErrorMW ?? 1668.5).toLocaleString()} MW) measures intra-day volatility. Monthly P90 (+{(monthMetrics?.p90ErrorMW ?? 4312).toLocaleString()} MW) covers multi-day front collapses.
              </div>
              <div className="popover-line">Worst single-hour over-forecast: <strong>+{activeMetrics.maxOverForecastMW.toLocaleString()} MW</strong></div>
            </div>
          )}
        </div>

        {/* Card 4: Average wind actually produced */}
        <div 
          className="clean-metric-card beginner-card"
          onMouseEnter={() => setHoveredCard('act')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="clean-metric-header">
            <div>
              <h3 className="beginner-metric-title">Average wind actually produced</h3>
              <span className="beginner-metric-sub">Mean Actual Wind</span>
            </div>
            <button 
              className="info-icon-btn" 
              onClick={() => toggleInfo('act')}
              title="Show technical statistics"
              aria-label="Show technical details for Mean Actual Wind"
            >
              <Info size={16} />
            </button>
          </div>

          <div className="beginner-metric-body">
            <div className="metric-main-val">
              <span className="clean-metric-number text-green">
                {activeMetrics.meanActualMW.toLocaleString()}
              </span>
              <span className="clean-metric-unit">MW</span>
            </div>

            {hoveredCard === 'act' && otherScopeMetrics && (
              <div className="other-scope-hint">
                {otherScopeLabel}: <strong>{otherScopeMetrics.meanActualMW.toLocaleString()} MW</strong>
              </div>
            )}
          </div>

          <div className="beginner-verdict-row">
            <span className="clean-status-pill success">
              Metered grid power
            </span>
          </div>
          <p className="beginner-plain-sentence">
            Actual delivered output across UK wind turbines during this period.
          </p>

          {activeInfoCard === 'act' && (
            <div className="beginner-info-popover">
              <div className="popover-line">Predicted mean: <strong>{activeMetrics.meanForecastMW.toLocaleString()} MW</strong></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
