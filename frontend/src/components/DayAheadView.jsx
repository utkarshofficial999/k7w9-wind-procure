import React, { useState } from 'react';
import { AlertCircle, ArrowUpRight, ArrowDownRight, Info, Eye } from 'lucide-react';

export default function DayAheadView({ dayData, selectedDate, cutoffHour }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!dayData || !dayData.timeSeries || dayData.timeSeries.length === 0) {
    return (
      <div className="empty-state glass-panel">
        <AlertCircle size={32} className="text-amber" />
        <p>No day-ahead data available for {selectedDate}. Please select another date.</p>
      </div>
    );
  }

  const series = dayData.timeSeries;
  const maxGen = Math.max(...series.map((d) => Math.max(d.actualMW, d.forecastMW)), 1000);
  const chartHeight = 280;
  const chartWidth = 900;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Scales
  const getX = (i) => padding.left + (i / (series.length - 1)) * innerWidth;
  const getY = (val) => padding.top + innerHeight - (val / (maxGen * 1.15)) * innerHeight;

  // Build SVG Paths
  const actualPath = series
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.actualMW)}`)
    .join(' ');

  const forecastPath = series
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.forecastMW)}`)
    .join(' ');

  // Actual area fill
  const actualArea = `${actualPath} L ${getX(series.length - 1)} ${padding.top + innerHeight} L ${getX(0)} ${padding.top + innerHeight} Z`;

  const hoveredPoint = hoveredIndex !== null ? series[hoveredIndex] : null;

  return (
    <div className="dayahead-container">
      {/* Chart Section */}
      <div className="chart-card glass-panel">
        <div className="chart-header">
          <div>
            <div className="chart-tag">DAY-AHEAD PROCUREMENT DISPATCH</div>
            <h2 className="chart-title">
              Delivery Profile: {selectedDate}
              <span className="chart-subtitle">
                (Cutoff: {dayData.decisionCutoffUsed})
              </span>
            </h2>
          </div>
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
        </div>

        {/* Interactive SVG Chart */}
        <div className="svg-chart-wrapper">
          <svg 
            viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
            className="interactive-svg"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Peak Hours Background Highlight (07:00 to 19:00 UTC) */}
            <rect
              x={getX(7)}
              y={padding.top}
              width={getX(19) - getX(7)}
              height={innerHeight}
              fill="rgba(245, 158, 11, 0.06)"
              stroke="rgba(245, 158, 11, 0.15)"
              strokeDasharray="4 4"
            />
            <text
              x={getX(13)}
              y={padding.top + 15}
              fill="#f59e0b"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
              opacity="0.8"
            >
              UK DAY-AHEAD PEAK PERIOD (07:00 - 19:00 UTC)
            </text>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const yVal = maxGen * 1.15 * pct;
              const yPos = getY(yVal);
              return (
                <g key={idx}>
                  <line
                    x1={padding.left}
                    y1={yPos}
                    x2={padding.left + innerWidth}
                    y2={yPos}
                    stroke="rgba(255, 255, 255, 0.07)"
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
                    y={padding.top + innerHeight + 20}
                    fill="#94a3b8"
                    fontSize="11"
                    fontFamily="monospace"
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

            {/* Actual Curve */}
            <path
              d={actualPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Forecast Curve */}
            <path
              d={forecastPath}
              fill="none"
              stroke="#818cf8"
              strokeWidth="2.5"
              strokeDasharray="5 3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Points & Vertical Slices */}
            {series.map((d, i) => (
              <g key={i}>
                {/* Invisible hover zone */}
                <rect
                  x={getX(i) - innerWidth / (series.length * 2)}
                  y={padding.top}
                  width={innerWidth / series.length}
                  height={innerHeight}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(i)}
                  style={{ cursor: 'pointer' }}
                />

                {/* Point markers */}
                <circle
                  cx={getX(i)}
                  cy={getY(d.actualMW)}
                  r={hoveredIndex === i ? 5 : 2.5}
                  fill="#10b981"
                  stroke="#080c14"
                  strokeWidth="1.5"
                />
                <circle
                  cx={getX(i)}
                  cy={getY(d.forecastMW)}
                  r={hoveredIndex === i ? 5 : 2.5}
                  fill="#818cf8"
                  stroke="#080c14"
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
                stroke="#00e5ff"
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
      </div>

      {/* Hourly Detail Table */}
      <div className="table-card glass-panel">
        <div className="table-header-row">
          <div>
            <h3 className="section-title">Hourly Settlement Breakdown & Market Action</h3>
            <p className="section-desc">
              Resolution: 24 Delivery Hours (Aligned with Elexon BMRS Settlement Periods 1 to 48)
            </p>
          </div>
          <div className="table-stats-badge">
            24 Trading Intervals | Daily MAE: <strong>{dayData.metrics.maeMW} MW</strong>
          </div>
        </div>

        <div className="table-responsive">
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
              {series.map((row, i) => {
                const hour = new Date(row.startTime).getUTCHours();
                const isOver = row.errorMW > 0;
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
                      <span className={isOver ? 'text-rose' : 'text-amber'}>
                        {isOver ? `+${row.errorMW.toLocaleString()}` : row.errorMW.toLocaleString()} MW
                      </span>
                    </td>
                    <td className="font-mono text-muted">
                      {row.percentageError !== null ? `${row.percentageError}%` : 'N/A'}
                    </td>
                    <td>
                      {isOver ? (
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
        </div>
      </div>
    </div>
  );
}
