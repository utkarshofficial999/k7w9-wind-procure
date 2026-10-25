import React from 'react';
import { Wind, Clock, Calendar, Zap, ShieldAlert, Activity } from 'lucide-react';

export default function Header({
  selectedDate,
  onDateChange,
  cutoffHour,
  onCutoffChange,
  health
}) {
  const dates = Array.from({ length: 31 }, (_, i) => `2026-01-${String(i + 1).padStart(2, '0')}`);

  return (
    <header className="header-container glass-panel">
      <div className="header-top">
        <div className="brand-group">
          <div className="brand-icon-wrapper">
            <Wind className="brand-icon" />
          </div>
          <div>
            <div className="brand-badge-row">
              <span className="badge-uk">UK NATIONAL GRID / BMRS</span>
              <span className="badge-live">
                <span className="pulse-dot"></span>
                ACTIVE TRADING DATA
              </span>
            </div>
            <h1 className="brand-title">AURA WIND <span className="title-sub">| Day-Ahead Decision & Forecast Risk Portal</span></h1>
          </div>
        </div>

        <div className="header-meta">
          <div className="meta-item">
            <span className="meta-label">Market Source</span>
            <span className="meta-value">Elexon BMRS (FUELHH + WINDFOR)</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Evaluation Horizon</span>
            <span className="meta-value text-cyan">January 2026 (744 Delivery Hours)</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">System Health</span>
            <span className="meta-value text-green">
              <Activity size={14} style={{ display: 'inline', marginRight: 4 }} />
              100% Operational
            </span>
          </div>
        </div>
      </div>

      <div className="header-controls">
        <div className="control-group">
          <label className="control-label">
            <Calendar size={15} />
            <span>Delivery Date:</span>
          </label>
          <select 
            className="control-select" 
            value={selectedDate} 
            onChange={(e) => onDateChange(e.target.value)}
          >
            {dates.map((d) => (
              <option key={d} value={d}>
                {d} (Day {parseInt(d.split('-')[2])})
              </option>
            ))}
          </select>

          <div className="quick-date-buttons">
            <button 
              className="btn-quick"
              disabled={selectedDate === '2026-01-01'}
              onClick={() => {
                const day = parseInt(selectedDate.split('-')[2]);
                if (day > 1) onDateChange(`2026-01-${String(day - 1).padStart(2, '0')}`);
              }}
            >
              Prev Day
            </button>
            <button 
              className="btn-quick"
              disabled={selectedDate === '2026-01-31'}
              onClick={() => {
                const day = parseInt(selectedDate.split('-')[2]);
                if (day < 31) onDateChange(`2026-01-${String(day + 1).padStart(2, '0')}`);
              }}
            >
              Next Day
            </button>
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">
            <Clock size={15} />
            <span>Decision Cutoff Time:</span>
          </label>
          <div className="cutoff-toggle-group">
            <button 
              className={`cutoff-btn ${cutoffHour === 11 ? 'active' : ''}`}
              onClick={() => onCutoffChange(11)}
              title="UK EPEX SPOT / Nord Pool Day-Ahead Auction Gate Closure (11:00 UTC D-1)"
            >
              11:00 UTC (D-1 Auction)
            </button>
            <button 
              className={`cutoff-btn ${cutoffHour === 9 ? 'active' : ''}`}
              onClick={() => onCutoffChange(9)}
              title="Early morning trading desk portfolio prep (09:00 UTC D-1)"
            >
              09:00 UTC (Early D-1)
            </button>
            <button 
              className={`cutoff-btn ${cutoffHour === 14 ? 'active' : ''}`}
              onClick={() => onCutoffChange(14)}
              title="Post-auction / afternoon schedule confirmation (14:00 UTC D-1)"
            >
              14:00 UTC (Afternoon D-1)
            </button>
            <button 
              className={`cutoff-btn ${cutoffHour === -1 ? 'active' : ''}`}
              onClick={() => onCutoffChange(-1)}
              title="Latest Intraday forecast available immediately prior to delivery"
            >
              Intraday (Latest Pre-Delivery)
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
