import React from 'react';
import { Wind, ChevronLeft, ChevronRight, Clock, Calendar, BookOpen, HelpCircle } from 'lucide-react';
import { GlossaryTooltip } from './Glossary';

export default function Header({
  selectedDate,
  onDateChange,
  cutoffHour,
  onCutoffChange,
  mode = 'beginner',
  onModeChange,
  onOpenGlossary,
  onOpenTour
}) {
  const dates = Array.from({ length: 31 }, (_, i) => `2026-01-${String(i + 1).padStart(2, '0')}`);
  const currentDayNum = parseInt(selectedDate.split('-')[2]);

  return (
    <header className="clean-navbar">
      <div className="navbar-left">
        <div className="clean-logo">
          <Wind size={20} className="logo-icon" />
          <span className="logo-text">AURA <span className="logo-sub">WIND</span></span>
        </div>
        <span className="navbar-badge">UK Day-Ahead Power</span>
      </div>

      <div className="navbar-controls">
        {/* Date Selector with clean chevrons */}
        <div className="clean-control-item" id="tour-date-picker">
          <Calendar size={14} className="control-icon" />
          <div className="date-picker-wrapper">
            <button
              className="chevron-btn"
              disabled={currentDayNum <= 1}
              onClick={() => onDateChange(`2026-01-${String(currentDayNum - 1).padStart(2, '0')}`)}
              title="Previous day"
              aria-label="Previous day"
            >
              <ChevronLeft size={16} />
            </button>
            <select
              className="clean-select"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              aria-label="Select delivery date"
            >
              {dates.map((d) => (
                <option key={d} value={d}>
                  Jan {parseInt(d.split('-')[2])}, 2026
                </option>
              ))}
            </select>
            <button
              className="chevron-btn"
              disabled={currentDayNum >= 31}
              onClick={() => onDateChange(`2026-01-${String(currentDayNum + 1).padStart(2, '0')}`)}
              title="Next day"
              aria-label="Next day"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Cutoff Control - Full pills in Expert mode, concise in Beginner mode */}
        {mode === 'expert' ? (
          <div className="clean-control-item">
            <Clock size={14} className="control-icon" />
            <div className="clean-segmented-pills">
              <button
                className={`pill-btn ${cutoffHour === 11 ? 'active' : ''}`}
                onClick={() => onCutoffChange(11)}
                title="EPEX SPOT / Nord Pool UK Day-Ahead Auction Cutoff (11:00 UTC D-1)"
              >
                11:00 UTC (D-1 Auction)
              </button>
              <button
                className={`pill-btn ${cutoffHour === 9 ? 'active' : ''}`}
                onClick={() => onCutoffChange(9)}
                title="Early morning desk prep (09:00 UTC D-1)"
              >
                09:00 UTC
              </button>
              <button
                className={`pill-btn ${cutoffHour === 14 ? 'active' : ''}`}
                onClick={() => onCutoffChange(14)}
                title="Afternoon schedule confirmation (14:00 UTC D-1)"
              >
                14:00 UTC
              </button>
              <button
                className={`pill-btn ${cutoffHour === -1 ? 'active' : ''}`}
                onClick={() => onCutoffChange(-1)}
                title="Latest Intraday forecast before delivery"
              >
                Intraday
              </button>
            </div>
          </div>
        ) : (
          <div className="clean-control-item text-muted text-xs flex items-center gap-1">
            <Clock size={13} className="control-icon" />
            <span>Auction Cutoff: <strong>11:00 UTC</strong> (D-1)</span>
          </div>
        )}

        {/* Beginner | Expert Mode Switcher (Requirement 1) */}
        <div className="mode-toggle-wrapper">
          <div className="mode-segmented-control" role="group" aria-label="Experience Mode">
            <button
              className={`mode-btn ${mode === 'beginner' ? 'active' : ''}`}
              onClick={() => onModeChange('beginner')}
              aria-pressed={mode === 'beginner'}
            >
              Beginner
            </button>
            <button
              className={`mode-btn ${mode === 'expert' ? 'active' : ''}`}
              onClick={() => onModeChange('expert')}
              aria-pressed={mode === 'expert'}
            >
              Expert
            </button>
          </div>
        </div>

        {/* Glossary Quick Button */}
        <button
          className="header-action-btn"
          onClick={onOpenGlossary}
          title="Open Plain English Glossary"
          aria-label="Open Plain English Glossary"
        >
          <BookOpen size={14} className="text-cyan" />
          <span>Glossary</span>
        </button>

        {/* Guided Tour Trigger Button */}
        <button
          className="header-tour-btn"
          onClick={onOpenTour}
          title="Take 30-Second Guided Tour"
          aria-label="Take Guided Tour"
        >
          <HelpCircle size={15} />
        </button>
      </div>
    </header>
  );
}
