import React, { useState } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, Flame, Moon, Compass } from 'lucide-react';

export default function ErrorAnalytics({ monthlyData }) {
  const [activeMetric, setActiveMetric] = useState('mae'); // 'mae' | 'bias' | 'rmse'

  if (!monthlyData) return null;

  const { metrics, segmentMetrics, diurnalProfile } = monthlyData;
  const maxVal = Math.max(...diurnalProfile.map((d) => Math.max(d.maeMW, Math.abs(d.biasMW), d.rmseMW)), 100);

  const chartHeight = 220;
  const chartWidth = 840;
  const pad = { top: 20, right: 20, bottom: 35, left: 50 };
  const innerW = chartWidth - pad.left - pad.right;
  const innerH = chartHeight - pad.top - pad.bottom;

  return (
    <div className="analytics-container">
      {/* Diurnal Profile Section */}
      <div className="analytics-card glass-panel">
        <div className="analytics-header">
          <div>
            <div className="chart-tag">DIURNAL SETTLEMENT PATTERN</div>
            <h3 className="section-title">24-Hour Diurnal Error Profile (January 2026 Aggregate)</h3>
            <p className="section-desc">
              Evaluates systematic error and ramp risks across every delivery hour of the day across all 31 days.
            </p>
          </div>
          <div className="metric-switch-group">
            <button
              className={`metric-switch-btn ${activeMetric === 'mae' ? 'active' : ''}`}
              onClick={() => setActiveMetric('mae')}
            >
              MAE (Absolute Error)
            </button>
            <button
              className={`metric-switch-btn ${activeMetric === 'bias' ? 'active' : ''}`}
              onClick={() => setActiveMetric('bias')}
            >
              Bias (Directional Error)
            </button>
            <button
              className={`metric-switch-btn ${activeMetric === 'rmse' ? 'active' : ''}`}
              onClick={() => setActiveMetric('rmse')}
            >
              RMSE (Volatility Penalty)
            </button>
          </div>
        </div>

        {/* SVG Bar Chart for Diurnal */}
        <div className="svg-chart-wrapper">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="interactive-svg">
            {/* Peak period highlight */}
            <rect
              x={pad.left + (7 / 24) * innerW}
              y={pad.top}
              width={(12 / 24) * innerW}
              height={innerH}
              fill="rgba(245, 158, 11, 0.08)"
              stroke="rgba(245, 158, 11, 0.2)"
              strokeDasharray="4 4"
            />
            <text
              x={pad.left + (13 / 24) * innerW}
              y={pad.top + 14}
              fill="#f59e0b"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
            >
              PEAK DEMAND & TRADING HOURS (07:00 - 19:00 UTC)
            </text>

            {/* Grid */}
            {[0, 0.5, 1].map((pct, idx) => {
              const yVal = maxVal * 1.2 * pct;
              const yPos = pad.top + innerH - (pct * innerH);
              return (
                <g key={idx}>
                  <line
                    x1={pad.left}
                    y1={yPos}
                    x2={pad.left + innerW}
                    y2={yPos}
                    stroke="rgba(255, 255, 255, 0.06)"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={pad.left - 8}
                    y={yPos + 4}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {Math.round(yVal)} MW
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {diurnalProfile.map((pt, i) => {
              const val = activeMetric === 'mae' ? pt.maeMW : activeMetric === 'bias' ? pt.biasMW : pt.rmseMW;
              const barH = (Math.abs(val) / (maxVal * 1.2)) * innerH;
              const xPos = pad.left + (i / 24) * innerW + 4;
              const barW = innerW / 24 - 8;
              const yPos = pad.top + innerH - barH;

              const barColor =
                activeMetric === 'bias'
                  ? val >= 0 ? '#f43f5e' : '#f59e0b'
                  : pt.isPeak ? '#00e5ff' : '#818cf8';

              return (
                <g key={i}>
                  <rect
                    x={xPos}
                    y={yPos}
                    width={barW}
                    height={barH}
                    fill={barColor}
                    rx="3"
                    opacity="0.85"
                  >
                    <title>
                      {`Hour ${pt.hour}:00 (SPs ${pt.settlementPeriods.join('&')}) | ${activeMetric.toUpperCase()}: ${val} MW`}
                    </title>
                  </rect>
                  <text
                    x={xPos + barW / 2}
                    y={pad.top + innerH + 16}
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {pt.hour}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="diurnal-footer">
          <span className="text-muted">
            X-Axis: UTC Delivery Hour (0-23) | Y-Axis: Forecast Metric in MW. Notice higher error during morning ramp (07:00-09:00) and evening peak (17:00-19:00).
          </span>
        </div>
      </div>

      {/* Grid of Error Distribution & Segment Comparison */}
      <div className="analytics-subgrid">
        {/* Error Quantiles / Risk Distribution */}
        <div className="analytics-card glass-panel">
          <div className="card-heading-row">
            <Compass className="text-cyan" size={18} />
            <h4 className="card-heading">Quantified Error Distribution (MW)</h4>
          </div>
          <p className="section-desc">
            Essential for setting trading confidence intervals and risk-adjusted procurement buffers.
          </p>

          <div className="quantile-list">
            <div className="quantile-row">
              <span className="q-label">P10 (Heavy Under-forecast)</span>
              <span className="q-value text-amber">{metrics.p10ErrorMW} MW</span>
              <span className="q-desc">Wind unexpectedly high (Surplus)</span>
            </div>
            <div className="quantile-row">
              <span className="q-label">P25 (Moderate Low)</span>
              <span className="q-value text-white">{metrics.p25ErrorMW} MW</span>
              <span className="q-desc">25th percentile error</span>
            </div>
            <div className="quantile-row highlight">
              <span className="q-label">P50 (Median Error / Bias)</span>
              <span className="q-value text-rose font-bold">+{metrics.p50ErrorMW} MW</span>
              <span className="q-desc">Median over-prediction</span>
            </div>
            <div className="quantile-row">
              <span className="q-label">P75 (Upper Deficit)</span>
              <span className="q-value text-rose">+{metrics.p75ErrorMW} MW</span>
              <span className="q-desc">75% of hours under this deficit</span>
            </div>
            <div className="quantile-row alert-row">
              <span className="q-label">P90 (Critical Safety Margin)</span>
              <span className="q-value text-rose font-bold">+{metrics.p90ErrorMW} MW</span>
              <span className="q-desc">Standard 90% procurement buffer</span>
            </div>
            <div className="quantile-row alert-row">
              <span className="q-label">P95 (Extreme Deficit Tail)</span>
              <span className="q-value text-rose font-bold">+{metrics.p95ErrorMW} MW</span>
              <span className="q-desc">95% conservative reserve target</span>
            </div>
          </div>
        </div>

        {/* Peak vs Off-Peak Market Exposure */}
        <div className="analytics-card glass-panel">
          <div className="card-heading-row">
            <Flame className="text-amber" size={18} />
            <h4 className="card-heading">Peak vs Off-Peak Market Segmentation</h4>
          </div>
          <p className="section-desc">
            Peak hours (07:00 - 19:00 UTC) have 2-3x higher price volatility and cashout penalty rates in the UK.
          </p>

          <div className="segment-comparison-grid">
            <div className="segment-box peak-box">
              <div className="segment-tag">
                <Flame size={14} /> PEAK HOURS (07-19 UTC)
              </div>
              <div className="segment-metric">
                <span className="seg-lbl">Peak MAE</span>
                <span className="seg-val text-cyan">{segmentMetrics.peak.maeMW} MW</span>
              </div>
              <div className="segment-metric">
                <span className="seg-lbl">Peak Bias</span>
                <span className="seg-val text-rose">+{segmentMetrics.peak.biasMW} MW</span>
              </div>
              <div className="segment-metric">
                <span className="seg-lbl">Peak WAPE</span>
                <span className="seg-val text-white">{segmentMetrics.peak.wapePercent}%</span>
              </div>
              <div className="segment-metric">
                <span className="seg-lbl">Worst Over-forecast</span>
                <span className="seg-val text-rose">+{segmentMetrics.peak.maxOverForecastMW} MW</span>
              </div>
            </div>

            <div className="segment-box offpeak-box">
              <div className="segment-tag">
                <Moon size={14} /> OFF-PEAK HOURS (19-07 UTC)
              </div>
              <div className="segment-metric">
                <span className="seg-lbl">Off-Peak MAE</span>
                <span className="seg-val text-purple">{segmentMetrics.offPeak.maeMW} MW</span>
              </div>
              <div className="segment-metric">
                <span className="seg-lbl">Off-Peak Bias</span>
                <span className="seg-val text-rose">+{segmentMetrics.offPeak.biasMW} MW</span>
              </div>
              <div className="segment-metric">
                <span className="seg-lbl">Off-Peak WAPE</span>
                <span className="seg-val text-white">{segmentMetrics.offPeak.wapePercent}%</span>
              </div>
              <div className="segment-metric">
                <span className="seg-lbl">Worst Over-forecast</span>
                <span className="seg-val text-rose">+{segmentMetrics.offPeak.maxOverForecastMW} MW</span>
              </div>
            </div>
          </div>

          <div className="trading-insight-callout">
            <strong>Key Quantitative Takeaway:</strong> The forecast over-predicts wind during Peak hours by an average of <strong>+{segmentMetrics.peak.biasMW} MW</strong>. Relying on unadjusted forecasts during peak hours exposes the utility to severe deficit purchases at peak wholesale prices.
          </div>
        </div>
      </div>
    </div>
  );
}
