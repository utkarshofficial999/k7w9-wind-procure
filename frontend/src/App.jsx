import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BeginnerHero from './components/BeginnerHero';
import MetricCards from './components/MetricCards';
import DayAheadView from './components/DayAheadView';
import ErrorAnalytics from './components/ErrorAnalytics';
import ForecastEvolution from './components/ForecastEvolution';
import ProcurementSimulator from './components/ProcurementSimulator';
import DailyTable from './components/DailyTable';
import { GlossaryDrawer } from './components/Glossary';
import GuidedTour from './components/GuidedTour';
import { fetchHealth, fetchMonthlyOverview, fetchDayAheadView, fetchSummary } from './services/api';
import { LineChart, Compass, Layers, Sliders, Table2, AlertCircle, Eye, Compass as CompassIcon } from 'lucide-react';
import './App.css';

const TAB_META = {
  dayahead: {
    beginnerTitle: '1. Forecast vs Reality',
    expertTitle: 'Day-Ahead Workbench',
    lookingAt: 'Hourly comparison of predicted wind vs actual metered wind output.',
    doWithIt: 'Spot the red shortfall gap so you know when extra backup power needs to be bought.'
  },
  analytics: {
    beginnerTitle: '2. When is it most wrong?',
    expertTitle: 'Error & Accuracy Analytics',
    lookingAt: '24-hour clock showing which times of day forecasts miss most severely.',
    doWithIt: 'Increase safety margins during early morning and peak trading intervals.'
  },
  evolution: {
    beginnerTitle: '3. Did forecasts improve over time?',
    expertTitle: 'Forecast Evolution Waterfall',
    lookingAt: 'How wind forecasts shifted as time got closer to gate closure.',
    doWithIt: 'Learn how many hours ahead forecasts become trustworthy enough to trade.'
  },
  simulator: {
    beginnerTitle: '4. How much extra should I buy?',
    expertTitle: 'Procurement & Buffer Optimizer',
    lookingAt: 'Interactive safety buffer tool to protect against emergency balancing charges.',
    doWithIt: 'Choose a protection strategy and see your estimated savings in pounds.'
  },
  table: {
    beginnerTitle: '5. Day-by-day scorecard',
    expertTitle: 'Daily Performance Matrix',
    lookingAt: 'Full calendar scorecard of every day in January 2026.',
    doWithIt: 'Click any high-deficit day to inspect its 24-hour delivery profile.'
  }
};

export default function App() {
  const [selectedDate, setSelectedDate] = useState('2026-01-15');
  const [cutoffHour, setCutoffHour] = useState(11); // 11:00 UTC D-1 default
  const [activeTab, setActiveTab] = useState('dayahead');

  // Beginner / Expert Mode (Requirement 1 - Default: Beginner, persisted in localStorage)
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('aura_wind_mode') || 'beginner';
  });

  // Guided Tour State (Requirement 9)
  const [tourOpen, setTourOpen] = useState(() => {
    return localStorage.getItem('aura_wind_tour_seen') !== 'true';
  });

  // Glossary Side Drawer State (Requirement 4)
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const [health, setHealth] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [dayData, setDayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    localStorage.setItem('aura_wind_mode', newMode);
  };

  const handleCloseTour = () => {
    setTourOpen(false);
    localStorage.setItem('aura_wind_tour_seen', 'true');
  };

  const handleOpenTour = () => {
    setTourOpen(true);
  };

  // Load health, monthly overview, and summary data on mount or cutoff change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      fetchHealth(),
      fetchMonthlyOverview(cutoffHour),
      fetchSummary(cutoffHour)
    ])
      .then(([healthRes, monthRes, summaryRes]) => {
        if (isMounted) {
          setHealth(healthRes);
          setMonthlyData(monthRes);
          setSummaryData(summaryRes);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [cutoffHour]);

  // Load day data when selectedDate or cutoffHour changes
  useEffect(() => {
    let isMounted = true;
    fetchDayAheadView(selectedDate, cutoffHour)
      .then((data) => {
        if (isMounted) setDayData(data);
      })
      .catch((err) => {
        console.error('Failed to load day data:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate, cutoffHour]);

  const handleSelectDateFromTable = (dateStr) => {
    setSelectedDate(dateStr);
    setActiveTab('dayahead');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentTabMeta = TAB_META[activeTab];

  return (
    <div className={`clean-app-shell mode-${mode}`}>
      {/* Sleek Minimalist Navbar with Mode Toggle, Glossary & Tour */}
      <Header
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        cutoffHour={cutoffHour}
        onCutoffChange={setCutoffHour}
        mode={mode}
        onModeChange={handleModeChange}
        onOpenGlossary={() => setGlossaryOpen(true)}
        onOpenTour={handleOpenTour}
      />

      {/* Main Content Area */}
      <main className="clean-main-container">
        {/* Requirement 2: Beginner Hero OR Expert Market Banner */}
        {mode === 'beginner' ? (
          <BeginnerHero summaryData={summaryData} />
        ) : (
          <div className="clean-notice-bar">
            <div className="notice-content">
              <span className="notice-badge">Month: Jan 2026 ({summaryData?.totalHours || 744} hrs)</span>
              <span className="notice-text">
                <strong>Month Scope:</strong> Day-ahead forecasts exhibited a systematic{' '}
                <strong>
                  +{summaryData?.monthlyMetrics?.biasMW ? Math.round(summaryData.monthlyMetrics.biasMW).toLocaleString() : '1,840'} MW over-prediction bias
                </strong>{' '}
                (Monthly P90 Deficit Risk:{' '}
                <strong>
                  +{summaryData?.monthlyMetrics?.p90ErrorMW ? Math.round(summaryData.monthlyMetrics.p90ErrorMW).toLocaleString() : '4,312'} MW
                </strong>; Max monthly shortfall:{' '}
                <strong>
                  +{summaryData?.maxMonthlyShortfallMW ? Math.round(summaryData.maxMonthlyShortfallMW).toLocaleString() : '6,833'} MW
                </strong>; Over-forecast across <strong>{summaryData?.shareOfHoursOverForecastPercent ?? '84.4'}%</strong> of delivery hours).
                Without risk buffering, the utility under-procures day-ahead thermal power, triggering severe cashout penalties.
              </span>
            </div>
            <span className="notice-meta">Scope: Month (Jan 2026)</span>
          </div>
        )}

        {/* 4 Clean Metric Cards (Requirement 3: Plain-English in Beginner mode) */}
        {monthlyData && (
          <MetricCards
            dayMetrics={dayData?.metrics}
            monthMetrics={monthlyData?.metrics}
            selectedDate={selectedDate}
            mode={mode}
          />
        )}

        {/* Modern Clean Tabs (Requirement 5) */}
        <div className="clean-tabs-section" id="tour-tabs">
          <div className="clean-tabs-row" role="tablist">
            <button
              className={`clean-tab ${activeTab === 'dayahead' ? 'active' : ''}`}
              onClick={() => setActiveTab('dayahead')}
              role="tab"
              aria-selected={activeTab === 'dayahead'}
            >
              <LineChart size={15} />
              <span>{mode === 'beginner' ? TAB_META.dayahead.beginnerTitle : TAB_META.dayahead.expertTitle}</span>
            </button>
            <button
              className={`clean-tab ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
              role="tab"
              aria-selected={activeTab === 'analytics'}
            >
              <Compass size={15} />
              <span>{mode === 'beginner' ? TAB_META.analytics.beginnerTitle : TAB_META.analytics.expertTitle}</span>
            </button>
            <button
              className={`clean-tab ${activeTab === 'evolution' ? 'active' : ''}`}
              onClick={() => setActiveTab('evolution')}
              role="tab"
              aria-selected={activeTab === 'evolution'}
            >
              <Layers size={15} />
              <span>{mode === 'beginner' ? TAB_META.evolution.beginnerTitle : TAB_META.evolution.expertTitle}</span>
            </button>
            <button
              className={`clean-tab ${activeTab === 'simulator' ? 'active' : ''}`}
              onClick={() => setActiveTab('simulator')}
              role="tab"
              aria-selected={activeTab === 'simulator'}
            >
              <Sliders size={15} />
              <span>{mode === 'beginner' ? TAB_META.simulator.beginnerTitle : TAB_META.simulator.expertTitle}</span>
            </button>
            <button
              className={`clean-tab ${activeTab === 'table' ? 'active' : ''}`}
              onClick={() => setActiveTab('table')}
              role="tab"
              aria-selected={activeTab === 'table'}
            >
              <Table2 size={15} />
              <span>{mode === 'beginner' ? TAB_META.table.beginnerTitle : TAB_META.table.expertTitle}</span>
            </button>
          </div>

          {/* Requirement 5: One-line 'What you're looking at' and 'What to do with it' in Beginner mode */}
          {mode === 'beginner' && (
            <div className="tab-context-strip">
              <div className="context-item">
                <span className="context-label">What you're looking at:</span>
                <span className="context-text">{currentTabMeta.lookingAt}</span>
              </div>
              <div className="context-item">
                <span className="context-label">What to do with it:</span>
                <span className="context-text">{currentTabMeta.doWithIt}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Content Display */}
        {loading ? (
          <div className="clean-state-box">
            <div className="clean-spinner"></div>
            <p>Loading wind data...</p>
          </div>
        ) : error ? (
          <div className="clean-state-box error">
            <AlertCircle size={24} className="text-rose" />
            <p>Error connecting to analytics engine: {error}</p>
          </div>
        ) : (
          <div className="clean-tab-content">
            {activeTab === 'dayahead' && (
              <DayAheadView
                dayData={dayData}
                selectedDate={selectedDate}
                cutoffHour={cutoffHour}
                mode={mode}
              />
            )}

            {activeTab === 'analytics' && (
              <ErrorAnalytics 
                monthlyData={monthlyData} 
                summaryData={summaryData}
                mode={mode}
              />
            )}

            {activeTab === 'evolution' && (
              <ForecastEvolution selectedDate={selectedDate} mode={mode} />
            )}

            {activeTab === 'simulator' && (
              <ProcurementSimulator 
                cutoffHour={cutoffHour} 
                defaultMonthlyP90={summaryData?.monthlyMetrics?.p90ErrorMW || monthlyData?.metrics?.p90ErrorMW || 4312.4}
                mode={mode}
              />
            )}

            {activeTab === 'table' && (
              <DailyTable
                dailySummaries={monthlyData?.dailySummaries}
                onSelectDate={handleSelectDateFromTable}
                mode={mode}
              />
            )}
          </div>
        )}
      </main>

      {/* Searchable Side Panel Glossary Drawer (Requirement 4) */}
      <GlossaryDrawer 
        isOpen={glossaryOpen} 
        onClose={() => setGlossaryOpen(false)} 
      />

      {/* First-Visit Guided Tour (Requirement 9) */}
      <GuidedTour 
        isOpen={tourOpen} 
        onClose={handleCloseTour} 
      />

      {/* Minimal Footer */}
      <footer className="clean-footer">
        <div className="footer-left">
          <strong>AURA WIND</strong> — UK Day-Ahead Electricity Market Decision Support System
        </div>
        <div className="footer-right">
          <span>Elexon BMRS Official Datasets (FUELHH & WINDFOR)</span>
          <span>•</span>
          <span>January 2026</span>
        </div>
      </footer>
    </div>
  );
}
