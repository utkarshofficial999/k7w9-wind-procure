import React, { useState } from 'react';
import { AlertCircle, ArrowUpRight, ArrowDownRight, Info, ArrowUpDown, Clock } from 'lucide-react';
import { GlossaryTooltip } from './Glossary';

export default function DayAheadView({ dayData, selectedDate, cutoffHour, mode = 'beginner' }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isHoveringPeak, setIsHoveringPeak] = useState(false);
  const [sortByMiss, setSortByMiss] = useState(false);

  if (!dayData || !dayData.timeSeries || dayData.timeSeries.length === 0) {
    return (
      <div className="empty-state glass-panel">
        <AlertCircle size={32} className="text-amber" />
        <p>No day-ahead data available for {selectedDate}. Please select another date.</p>
      </div>
    );
  }

  const series = dayData.timeSeries;
  const minVal = Math.min(...series.map((d) => Math.min(d.actualMW, d.forecastMW)));
  const maxVal = Math.max(...series.map((d) => Math.max(d.actualMW, d.forecastMW)));

  // Auto-generated data-driven headline (Requirement 6)
  const biggestMissPoint = series.reduce((max, pt) => (Math.abs(pt.errorMW) > Math.abs(max.errorMW) ? pt : max), series[0]);
  const missHour = new Date(biggestMissPoint.startTime).getUTCHours();
  const missHourStr = `${String(missHour).padStart(2, '0')}:00`;
  const isOver = biggestMissPoint.errorMW > 0;
  const chartHeadline = `At ${missHourStr} the forecast was ${Math.round(Math.abs(biggestMissPoint.errorMW)).toLocaleString()} MW ${isOver ? 'too high' : 'too low'}.`;

  // Y-axis starts at rounded minimum: floor to nearest 1,000 MW below min of actual and forecast
  let yMin = Math.floor(minVal / 1000) * 1000;
  if (yMin >= minVal && yMin >= 1000) {
    yMin -= 1000;
  }
  yMin = Math.max(0, yMin);

  // Even tick steps with ample headroom to guarantee no clipping of lines or markers
  const span = maxVal - yMin;
  let step = 2000;
  if (span <= 4000) step = 1000;
  else if (span <= 10000) step = 2000;
  else if (span <= 18000) step = 2500;
  else step = 5000;

  const numSteps = Math.ceil((maxVal - yMin) / step) + 1;
  const yMax = yMin + numSteps * step;

  const yTicks = [];
  for (let v = yMin; v <= yMax; v += step) {
    yTicks.push(v);
  }

  const chartHeight = 310;
  const chartWidth = 920;
  const padding = { top: 35, right: mode === 'beginner' ? 85 : 35, bottom: 45, left: 85 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Scales
  const getX = (i) => padding.left + (i / (series.length - 1)) * innerWidth;
  const getY = (val) => padding.top + innerHeight - ((val - yMin) / (yMax - yMin)) * innerHeight;

  // Build SVG Paths
  const actualPath = series
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.actualMW)}`)
    .join(' ');

  const forecastPath = series
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.forecastMW)}`)
    .join(' ');

  // Gap polygon between forecast and actual (Requirement 6)
  const gapPolygonPoints = [
    ...series.map((d, i) => `${getX(i)},${getY(d.forecastMW)}`),
    ...series.slice().reverse().map((d, i) => `${getX(series.length - 1 - i)},${getY(d.actualMW)}`)
  ].join(' ');

  // Actual area fill down to baseline (yMin)
  const actualArea = `${actualPath} L ${getX(series.length - 1)} ${padding.top + innerHeight} L ${getX(0)} ${padding.top + innerHeight} Z`;

  const hoveredPoint = hoveredIndex !== null ? series[hoveredIndex] : null;

  // Sorted rows for table (Requirement 7)
  const displayedRows = sortByMiss
    ? [...series].sort((a, b) => Math.abs(b.errorMW) - Math.abs(a.errorMW))
    : series;

  return (
    <div className="dayahead-container" id="tour-chart">
      {/* Chart Section */}
      <div className="chart-card glass-panel">
        <div className="chart-header">
          <div>
            <div className="chart-tag">
              {mode === 'beginner' ? 'HOURLY COMPARISON' : 'DAY-AHEAD PROCUREMENT DISPATCH'}
            </div>
            {/* Auto-generated data-driven headline (Requirement 6) */}
            <h2 className="chart-title">
              {chartHeadline}
              <span className="chart-subtitle">
                (Delivery: {selectedDate} • Cutoff: {dayData.decisionCutoffUsed})
              </span>
            </h2>
          </div>

          {/* Expert mode shows full box legend; Beginner mode has direct line labels */}
          {mode === 'expert' && (
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-line line-green"></span>
                <span>Actual Generation (MW)</span>
              </div>
              <div className="legend-item">
                <span className="legend-line line-purple"></span>
                <span>Day-Ahead Forecast (MW)</span>
              </div>
              <div className="legend-item">
                <span className="legend-box box-rose"></span>
                <span>Deficit Risk (Over-forecast)</span>
              </div>
              <div className="legend-item">
                <span className="legend-box box-amber"></span>
                <span>Surplus (Under-forecast)</span>
              </div>
            </div>
          )}
        </div>

        {/* Interactive SVG Chart */}
        <div className="svg-chart-wrapper">
          <svg 
            viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
            className="interactive-svg"
            onMouseLeave={() => {
              setHoveredIndex(null);
              setIsHoveringPeak(false);
            }}
          >
            <defs>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Peak Hours Background Highlight (07:00 to 19:00 UTC) */}
            <rect
              x={getX(7)}
              y={padding.top}
              width={getX(19) - getX(7)}
              height={innerHeight}
              fill="rgba(245, 158, 11, 0.08)"
              stroke="rgba(245, 158, 11, 0.3)"
              strokeDasharray="4 4"
              onMouseEnter={() => setIsHoveringPeak(true)}
              onMouseLeave={() => setIsHoveringPeak(false)}
            />

            {/* Peak Label: Always in Expert, shown on hover in Beginner (Requirement 6) */}
            {(mode === 'expert' || isHoveringPeak || (hoveredPoint && hoveredPoint.isPeak)) && (
              <text
                x={getX(13)}
                y={padding.top + 16}
                fill="#b45309"
                fontSize="11"
                fontWeight="700"
                textAnchor="middle"
              >
                Peak 07:00-19:00 UTC (winter/GMT mapping)
              </text>
            )}

            {/* Grid Lines with Even Tick Steps */}
            {yTicks.map((yVal, idx) => {
              const yPos = getY(yVal);
              return (
                <g key={idx}>
                  <line
                    x1={padding.left}
                    y1={yPos}
                    x2={padding.left + innerWidth}
                    y2={yPos}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padding.left - 10}
                    y={yPos + 4}
                    fill="#64748b"
                    fontSize="11"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {Math.round(yVal).toLocaleString()} MW
                  </text>
                </g>
              );
            })}

            {/* X-Axis Hour Labels */}
            {series.map((d, i) => {
              if (i % 3 === 0 || i === series.length - 1) {
                const hour = new Date(d.startTime).getUTCHours();
                return (
                  <text
                    key={i}
                    x={getX(i)}
                    y={padding.top + innerHeight + 22}
                    fill="#475569"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="500"
                    textAnchor="middle"
                  >
                    {String(hour).padStart(2, '0')}:00
                  </text>
                );
              }
              return null;
            })}

            {/* Area Fill for Actuals */}
            <path d={actualArea} fill="url(#actualGrad)" />

            {/* Shaded Gap Between Forecast and Actual (Requirement 6) */}
            <polygon
              points={gapPolygonPoints}
              fill="rgba(225, 29, 72, 0.16)"
              stroke="rgba(225, 29, 72, 0.25)"
              strokeWidth="0.5"
            />

            {/* Actual Curve (Green) */}
            <path
              d={actualPath}
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Forecast Curve (Purple Dashed) */}
            <path
              d={forecastPath}
              fill="none"
              stroke="#4f46e5"
              strokeWidth="2.5"
              strokeDasharray="5 3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Direct Line Labels in Beginner Mode (Requirement 6) */}
            {mode === 'beginner' && (
              <g className="direct-line-labels">
                <text
                  x={getX(series.length - 1) + 8}
                  y={getY(series[series.length - 1].forecastMW) + 4}
                  fill="#4f46e5"
                  fontSize="12"
                  fontWeight="700"
                >
                  Forecast
                </text>
                <text
                  x={getX(series.length - 1) + 8}
                  y={getY(series[series.length - 1].actualMW) + 4}
                  fill="#059669"
                  fontSize="12"
                  fontWeight="700"
                >
                  Actual
                </text>
              </g>
            )}

            {/* Interactive Points & Vertical Slices */}
            {series.map((d, i) => (
              <g key={i}>
                <rect
                  x={getX(i) - innerWidth / (series.length * 2)}
                  y={padding.top}
                  width={innerWidth / series.length}
                  height={innerHeight}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(i)}
                  style={{ cursor: 'pointer' }}
                />

                <circle
                  cx={getX(i)}
                  cy={getY(d.actualMW)}
                  r={hoveredIndex === i ? 5 : 3}
                  fill="#059669"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <circle
                  cx={getX(i)}
                  cy={getY(d.forecastMW)}
                  r={hoveredIndex === i ? 5 : 3}
                  fill="#4f46e5"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              </g>
            ))}

            {/* Hover Crosshair */}
            {hoveredIndex !== null && (
              <line
                x1={getX(hoveredIndex)}
                y1={padding.top}
                x2={getX(hoveredIndex)}
                y2={padding.top + innerHeight}
                stroke="#0284c7"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}
          </svg>

          {/* Dynamic Tooltip */}
          {hoveredPoint && (
            <div 
              className="chart-tooltip glass-panel"
              style={{
                left: `${Math.min(Math.max((getX(hoveredIndex) / chartWidth) * 100, 15), 85)}%`,
                top: '15px'
              }}
            >
              <div className="tooltip-header">
                <strong>Hour {new Date(hoveredPoint.startTime).getUTCHours()}:00 UTC</strong>
                <span className="tooltip-sp">SPs {hoveredPoint.settlementPeriod} & {hoveredPoint.settlementPeriod + 1}</span>
                {hoveredPoint.isPeak && <span className="badge-peak-mini">PEAK</span>}
              </div>
              <div className="tooltip-row">
                <span className="text-green">Actual:</span>
                <strong>{hoveredPoint.actualMW.toLocaleString()} MW</strong>
              </div>
              <div className="tooltip-row">
                <span className="text-purple">Day-Ahead Forecast:</span>
                <strong>{hoveredPoint.forecastMW.toLocaleString()} MW</strong>
              </div>
              <div className="tooltip-row">
                <span>Error (Fc - Act):</span>
                <strong className={hoveredPoint.errorMW >= 0 ? 'text-rose' : 'text-amber'}>
                  {hoveredPoint.errorMW >= 0 ? `+${hoveredPoint.errorMW.toLocaleString()}` : hoveredPoint.errorMW.toLocaleString()} MW
                  {hoveredPoint.percentageError !== null && ` (${hoveredPoint.percentageError}%)`}
                </strong>
              </div>
              <div className="tooltip-procurement-note">
                {hoveredPoint.errorMW > 0 ? (
                  <span className="text-rose">
                    ⚠️ Shortfall of {hoveredPoint.errorMW.toFixed(0)} MW wind. Requires thermal purchase / balancing power.
                  </span>
                ) : (
                  <span className="text-amber">
                    ⚡ Surplus of {Math.abs(hoveredPoint.errorMW).toFixed(0)} MW wind beyond forecast.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Shaded Gap Caption (Requirement 6) */}
        <div className="chart-gap-caption">
          <span className="gap-color-box"></span>
          <span>Red gap = power you expected but didn't get.</span>
        </div>
      </div>

      {/* Hourly Detail Table (Requirement 7) */}
      <div className="table-card glass-panel">
        <div className="table-header-row">
          <div>
            <h3 className="section-title">
              {mode === 'beginner' ? 'Hourly Performance Summary' : 'Hourly Settlement Breakdown & Market Action'}
            </h3>
            <p className="section-desc">
              {mode === 'beginner' 
                ? 'Check whether your day-ahead power purchase fell short, was balanced, or had surplus energy.' 
                : 'Resolution: 24 Delivery Hours (Aligned with Elexon BMRS Settlement Periods 1 to 48)'}
            </p>
          </div>

          <div className="table-actions-right">
            {/* Sort by biggest miss toggle (Requirement 7) */}
            <button
              className={`sort-miss-btn ${sortByMiss ? 'active' : ''}`}
              onClick={() => setSortByMiss(!sortByMiss)}
              title="Sort rows by largest forecast miss"
            >
              <ArrowUpDown size={14} />
              <span>{sortByMiss ? 'Sorted: Biggest Miss First' : 'Sort by biggest miss'}</span>
            </button>
            <div className="table-stats-badge">
              24 Intervals | MAE: <strong>{dayData.metrics.maeMW} MW</strong>
            </div>
          </div>
        </div>

        {/* Beginner Verdict Legend (Requirement 7) */}
        {mode === 'beginner' && (
          <div className="table-verdict-legend">
            <span className="legend-lbl">Verdict Legend:</span>
            <span className="verdict-chip-mini deficit">Bought too little (Shortfall &gt; 300 MW)</span>
            <span className="verdict-chip-mini balanced">About right (Within ±300 MW)</span>
            <span className="verdict-chip-mini surplus">Bought too much (Surplus &gt; 300 MW)</span>
          </div>
        )}

        <div className="table-responsive">
          {mode === 'beginner' ? (
            /* BEGINNER MODE TABLE (Requirement 7): Hour | Actual | Forecast | Miss | Verdict */
            <table className="custom-table beginner-table">
              <thead>
                <tr>
                  <th>Hour</th>
                  <th>Actual Wind</th>
                  <th>Forecast Wind</th>
                  <th>Miss Size</th>
                  <th>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.map((row, i) => {
                  const hour = new Date(row.startTime).getUTCHours();
                  const miss = row.errorMW;
                  
                  let verdictText = 'About right';
                  let verdictClass = 'balanced';
                  if (miss > 300) {
                    verdictText = 'Bought too little';
                    verdictClass = 'deficit';
                  } else if (miss < -300) {
                    verdictText = 'Bought too much';
                    verdictClass = 'surplus';
                  }

                  return (
                    <tr key={i}>
                      <td className="font-mono">
                        {String(hour).padStart(2, '0')}:00 UTC
                      </td>
                      <td className="font-mono text-green font-semibold">
                        {row.actualMW.toLocaleString()} MW
                      </td>
                      <td className="font-mono text-purple font-semibold">
                        {row.forecastMW.toLocaleString()} MW
                      </td>
                      <td className="font-mono font-semibold">
                        <span className={miss > 0 ? 'text-rose' : 'text-amber'}>
                          {miss > 0 ? `+${miss.toLocaleString()}` : miss.toLocaleString()} MW
                        </span>
                      </td>
                      <td>
                        <span className={`verdict-chip ${verdictClass}`}>
                          {verdictText}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            /* EXPERT MODE TABLE: Full columns */
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Delivery Hour</th>
                  <th>Settlement Periods</th>
                  <th>Market Period</th>
                  <th>Actual Generation</th>
                  <th>Day-Ahead Forecast</th>
                  <th>Forecast Error (MW)</th>
                  <th>% Error</th>
                  <th>Procurement Implication</th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.map((row, i) => {
                  const hour = new Date(row.startTime).getUTCHours();
                  const isOverRow = row.errorMW > 0;
                  return (
                    <tr key={i} className={hoveredIndex === i ? 'row-active' : ''}>
                      <td className="font-mono">
                        {String(hour).padStart(2, '0')}:00 - {String(hour + 1).padStart(2, '0')}:00 UTC
                      </td>
                      <td className="font-mono text-muted">
                        SP {row.settlementPeriod} & {row.settlementPeriod + 1}
                      </td>
                      <td>
                        {row.isPeak ? (
                          <span className="badge-peak-pill">Peak</span>
                        ) : (
                          <span className="badge-offpeak-pill">Off-Peak</span>
                        )}
                      </td>
                      <td className="font-mono text-green font-semibold">
                        {row.actualMW.toLocaleString()} MW
                      </td>
                      <td className="font-mono text-purple font-semibold">
                        {row.forecastMW.toLocaleString()} MW
                      </td>
                      <td className="font-mono font-semibold">
                        <span className={isOverRow ? 'text-rose' : 'text-amber'}>
                          {isOverRow ? `+${row.errorMW.toLocaleString()}` : row.errorMW.toLocaleString()} MW
                        </span>
                      </td>
                      <td className="font-mono text-muted">
                        {row.percentageError !== null ? `${row.percentageError}%` : 'N/A'}
                      </td>
                      <td>
                        {isOverRow ? (
                          <span className="risk-indicator deficit">
                            <ArrowUpRight size={14} /> Under-procured ({row.errorMW.toFixed(0)} MW Deficit)
                          </span>
                        ) : (
                          <span className="risk-indicator surplus">
                            <ArrowDownRight size={14} /> Over-procured ({Math.abs(row.errorMW).toFixed(0)} MW Surplus)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footnote on SP-to-Hour mapping */}
        <div className="table-settlement-footnote">
          <Info size={14} className="footnote-icon" />
          <span>
            <strong>Settlement & Time Standard Note:</strong> SP-to-hour mapping shown is valid for GMT (winter). During BST, SP 1 starts 23:00 UTC of the prior day; peak is defined in local time and applies to weekdays.
          </span>
        </div>
      </div>
    </div>
  );
}
