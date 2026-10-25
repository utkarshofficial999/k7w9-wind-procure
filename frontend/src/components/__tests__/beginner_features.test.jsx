import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';
import { GlossaryTooltip } from '../Glossary';
import DayAheadView from '../DayAheadView';
import { GLOSSARY_TERMS } from '../../data/glossary';

describe('Beginner / Expert Mode and New Beginner Features', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // 1. Mode toggle persistence
  it('handles mode toggle between Beginner and Expert and persists in localStorage', () => {
    const handleModeChange = vi.fn((newMode) => {
      localStorage.setItem('aura_wind_mode', newMode);
    });

    const { rerender } = render(
      <Header
        selectedDate="2026-01-15"
        onDateChange={vi.fn()}
        cutoffHour={11}
        onCutoffChange={vi.fn()}
        mode="beginner"
        onModeChange={handleModeChange}
        onOpenGlossary={vi.fn()}
        onOpenTour={vi.fn()}
      />
    );

    const expertBtn = screen.getByRole('button', { name: /expert/i });
    expect(expertBtn).toBeInTheDocument();

    fireEvent.click(expertBtn);
    expect(handleModeChange).toHaveBeenCalledWith('expert');
    expect(localStorage.getItem('aura_wind_mode')).toBe('expert');

    // Rerender as expert
    rerender(
      <Header
        selectedDate="2026-01-15"
        onDateChange={vi.fn()}
        cutoffHour={11}
        onCutoffChange={vi.fn()}
        mode="expert"
        onModeChange={handleModeChange}
        onOpenGlossary={vi.fn()}
        onOpenTour={vi.fn()}
      />
    );

    const beginnerBtn = screen.getByRole('button', { name: /beginner/i });
    fireEvent.click(beginnerBtn);
    expect(handleModeChange).toHaveBeenCalledWith('beginner');
    expect(localStorage.getItem('aura_wind_mode')).toBe('beginner');
  });

  // 2. Glossary tooltip rendering
  it('renders glossary tooltip on hover with plain definition and example', () => {
    render(
      <div>
        <GlossaryTooltip termKey="P90">P90 Deficit</GlossaryTooltip>
      </div>
    );

    const termTrigger = screen.getByText('P90 Deficit');
    expect(termTrigger).toBeInTheDocument();

    // Hover to reveal tooltip popover
    fireEvent.mouseEnter(termTrigger.parentElement);

    const definition = screen.getByText(GLOSSARY_TERMS['P90'].plainDefinition);
    expect(definition).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes(GLOSSARY_TERMS['P90'].example))).toBeInTheDocument();
  });

  // 3. Auto-generated chart headline
  it('generates chart headline dynamically from biggest miss in the data', () => {
    const mockDayData = {
      decisionCutoffUsed: '11:00 UTC D-1',
      metrics: { maeMW: 1000 },
      timeSeries: [
        {
          startTime: '2026-01-15T08:00:00Z',
          actualMW: 10000,
          forecastMW: 10500,
          errorMW: 500,
          percentageError: 5,
          isPeak: true,
          settlementPeriod: 17
        },
        {
          startTime: '2026-01-15T12:00:00Z',
          actualMW: 8000,
          forecastMW: 9942,
          errorMW: 1942, // Biggest miss
          percentageError: 24,
          isPeak: true,
          settlementPeriod: 25
        },
        {
          startTime: '2026-01-15T18:00:00Z',
          actualMW: 12000,
          forecastMW: 12200,
          errorMW: 200,
          percentageError: 1.6,
          isPeak: true,
          settlementPeriod: 37
        }
      ]
    };

    render(
      <DayAheadView
        dayData={mockDayData}
        selectedDate="2026-01-15"
        cutoffHour={11}
        mode="beginner"
      />
    );

    // Expected: At 12:00 the forecast was 1,942 MW too high.
    expect(
      screen.getByText(/At 12:00 the forecast was 1,942 MW too high\./i)
    ).toBeInTheDocument();
  });

  // 4. Verdict chip logic
  it('correctly classifies hourly settlement rows into Bought too little, About right, and Bought too much', () => {
    const mockDayData = {
      decisionCutoffUsed: '11:00 UTC D-1',
      metrics: { maeMW: 500 },
      timeSeries: [
        {
          startTime: '2026-01-15T01:00:00Z',
          actualMW: 5000,
          forecastMW: 6000,
          errorMW: 1000, // > 300: Bought too little
          percentageError: 20,
          isPeak: false,
          settlementPeriod: 3
        },
        {
          startTime: '2026-01-15T02:00:00Z',
          actualMW: 6000,
          forecastMW: 6100,
          errorMW: 100, // between -300 and 300: About right
          percentageError: 1.6,
          isPeak: false,
          settlementPeriod: 5
        },
        {
          startTime: '2026-01-15T03:00:00Z',
          actualMW: 7000,
          forecastMW: 6500,
          errorMW: -500, // < -300: Bought too much
          percentageError: 7.1,
          isPeak: false,
          settlementPeriod: 7
        }
      ]
    };

    render(
      <DayAheadView
        dayData={mockDayData}
        selectedDate="2026-01-15"
        cutoffHour={11}
        mode="beginner"
      />
    );

    // Verify chips in table
    const deficitChips = screen.getAllByText('Bought too little');
    expect(deficitChips.length).toBeGreaterThan(0);

    const balancedChips = screen.getAllByText('About right');
    expect(balancedChips.length).toBeGreaterThan(0);

    const surplusChips = screen.getAllByText('Bought too much');
    expect(surplusChips.length).toBeGreaterThan(0);
  });
});
