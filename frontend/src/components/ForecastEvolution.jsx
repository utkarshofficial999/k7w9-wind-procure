import React, { useState, useEffect } from 'react';
import { History, Clock, ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react';
import { fetchForecastEvolution } from '../services/api';

export default function ForecastEvolution({ selectedDate }) {
  const [targetHour, setTargetHour] = useState('12');
  const [evolutionData, setEvolutionData] = useState(null);
  const [loading, setLoading] = useState(false);

  const targetIso = `${selectedDate}T${String(targetHour).padStart(2, '0')}:00:00Z`;

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchForecastEvolution(targetIso)
      .then((data) => {
        if (isMounted) {
          setEvolutionData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load evolution:', err);
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [targetIso]);

  const forecasts = evolutionData?.forecasts || [];
  const actualMW = evolutionData?.actualMW || 0;

  // Chart setup
  const chartHeight = 260;
  const chartWidth = 840;
  const pad = { top: 25, right: 35, bottom: 45, left: 60 };
  const innerW = chartWidth - pad.left - pad.right;
  const innerH = chartHeight - pad.top - pad.bottom;

  const maxVal = Math.max(...forecasts.map((d) => d.forecastMW), actualMW, 1000);
  const maxHours = Math.max(...forecasts.map((d) => d.hoursBeforeDelivery), 48);

  const getX = (leadHours) => pad.left + innerW - (leadHours / maxHours) * innerW;
  const getY = (val) => pad.top + innerH - (val / (maxVal * 1.15)) * innerH;

  // Sorted by lead time descending (chronological publishing order)
  const sortedForecasts = [...forecasts].sort((a, b) => b.hoursBeforeDelivery - a.hoursBeforeDelivery);

  const linePath = sortedForecasts
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.hoursBeforeDelivery)} ${getY(d.forecastMW)}`)
    .join(' ');

  return (
    <div className="evolution-container glass-panel">
      <div className="evolution-header">
        <div>
          <div className="chart-tag">FORECAST VINTAGE & CONVERGENCE</div>
          <h3 className="section-title">Forecast Evolution Across Lead Time</h3>
          <p className="section-desc">
            Visualizes all consecutive Elexon WINDFOR publications leading up to delivery hour {selectedDate} {targetHour}:00 UTC.
          </p>
        </div>

        <div className="hour-selector-group">
          <label className="control-label">
            <Clock size={15} />
            <span>Select Delivery Hour:</span>
          </label>
          <select
            className="control-select"
            value={targetHour}
            onChange={(e) => setTargetHour(e.target.value)}
          >
            {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
              <option key={h} value={String(h)}>
                {String(h).padStart(2, '0')}:00 UTC {h >= 7 && h < 19 ? '(Peak)' : '(Off-Peak)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-box">Loading forecast revision waterfall...</div>
      ) : forecasts.length === 0 ? (
        <div className="empty-state">No prior forecasts published for this specific delivery hour.</div>
      ) : (
        <>
          {/* SVG Evolution Chart */}
          <div className="svg-chart-wrapper">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="interactive-svg">
              {/* Actual generation horizontal benchmark line */}
              <line
                x1={pad.left}
                y1={getY(actualMW)}
                x2={pad.left + innerW}
                y2={getY(actualMW)}
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />
              <text
                x={pad.left + innerW}
                y={getY(actualMW) - 8}
                fill="#10b981"
                fontSize="11"
                fontWeight="700"
                textAnchor="end"
              >
                Actual Generation: {actualMW.toLocaleString()} MW
              </text>

              {/* Day-Ahead Auction Cutoff Marker (~25 hours before delivery) */}
              <line
                x1={getX(25)}
                y1={pad.top}
                x2={getX(25)}
                y2={pad.top + innerH}
                stroke="#00e5ff"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={getX(25) + 6}
                y={pad.top + 16}
                fill="#00e5ff"
                fontSize="10"
                fontWeight="600"
              >
                Day-Ahead Auction Cutoff (D-1 11:00)
              </text>

              {/* Grid */}
              {[0, 0.5, 1].map((pct, idx) => {
                const yVal = maxVal * 1.15 * pct;
                const yPos = getY(yVal);
                return (
                  <g key={idx}>
                    <line
                      x1={pad.left}
                      y1={yPos}
                      x2={pad.left + innerW}
                      y2={yPos}
                      stroke="rgba(255, 255, 255, 0.06)"
                    />
                    <text
                      x={pad.left - 8}
                      y={yPos + 4}
                      fill="#64748b"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {Math.round(yVal).toLocaleString()} MW
                    </text>
                  </g>
                );
              })}

              {/* Forecast path */}
              <path
                d={linePath}
                fill="none"
                stroke="#818cf8"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Forecast Points */}
              {sortedForecasts.map((d, i) => {
                const cx = getX(d.hoursBeforeDelivery);
                const cy = getY(d.forecastMW);
                const isDayAhead = Math.abs(d.hoursBeforeDelivery - 25) < 3;
                return (
                  <g key={i}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isDayAhead ? 6 : 4}
                      fill={isDayAhead ? '#00e5ff' : '#818cf8'}
                      stroke="#080c14"
                      strokeWidth="2"
                    >
                      <title>
                        {`Published: ${d.publishTime} (${d.hoursBeforeDelivery}h before delivery) | Forecast: ${d.forecastMW} MW`}
                      </title>
                    </circle>
                  </g>
                );
              })}

              {/* X-Axis labels */}
              {[48, 36, 24, 12, 0].map((h, i) => (
                <text
                  key={i}
                  x={getX(h)}
                  y={pad.top + innerH + 22}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {h === 0 ? 'Delivery (0h)' : `${h}h Before`}
                </text>
              ))}
            </svg>
          </div>

          {/* Evolution Steps Table */}
          <div className="evolution-list">
            <h4 className="table-subtitle">Publication Timeline & Convergence Trace</h4>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Publish Timestamp</th>
                    <th>Lead Time</th>
                    <th>Market Phase</th>
                    <th>Forecast Value</th>
                    <th>Error to Final Actual</th>
                    <th>Shift from Prev Update</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedForecasts.map((fc, idx) => {
                    const err = fc.forecastMW - actualMW;
                    const prevFc = idx > 0 ? sortedForecasts[idx - 1].forecastMW : fc.forecastMW;
                    const shift = fc.forecastMW - prevFc;
                    const isDayAheadAuction = fc.hoursBeforeDelivery >= 24 && fc.hoursBeforeDelivery <= 28;

                    return (
                      <tr key={idx} className={isDayAheadAuction ? 'row-highlight-cyan' : ''}>
                        <td className="font-mono text-white">
                          {new Date(fc.publishTime).toUTCString().replace('GMT', 'UTC')}
                        </td>
                        <td className="font-mono text-cyan">
                          {fc.hoursBeforeDelivery} hours
                        </td>
                        <td>
                          {isDayAheadAuction ? (
                            <span className="badge-da-auction">Day-Ahead Auction Basis</span>
                          ) : fc.hoursBeforeDelivery > 26 ? (
                            <span className="badge-offpeak-pill">Medium Range (D-2)</span>
                          ) : (
                            <span className="badge-peak-pill">Intraday / Short Term</span>
                          )}
                        </td>
                        <td className="font-mono font-semibold text-purple">
                          {fc.forecastMW.toLocaleString()} MW
                        </td>
                        <td className="font-mono font-semibold">
                          <span className={err >= 0 ? 'text-rose' : 'text-amber'}>
                            {err >= 0 ? `+${err.toLocaleString()}` : err.toLocaleString()} MW
                          </span>
                        </td>
                        <td className="font-mono text-muted">
                          {idx === 0 ? 'Initial Release' : `${shift >= 0 ? '+' : ''}${shift.toLocaleString()} MW`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
