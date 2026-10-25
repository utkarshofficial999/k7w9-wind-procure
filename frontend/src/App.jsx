import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MetricCards from './components/MetricCards';
import DayAheadView from './components/DayAheadView';
import ErrorAnalytics from './components/ErrorAnalytics';
import ForecastEvolution from './components/ForecastEvolution';
import ProcurementSimulator from './components/ProcurementSimulator';
import DailyTable from './components/DailyTable';
import { fetchHealth, fetchMonthlyOverview, fetchDayAheadView } from './services/api';
import { LineChart, Compass, Layers, Sliders, Table2, AlertCircle, Info } from 'lucide-react';
import './App.css';

export default function App() {
  const [selectedDate, setSelectedDate] = useState('2026-01-15');
  const [cutoffHour, setCutoffHour] = useState(11); // 11:00 UTC D-1 default
  const [activeTab, setActiveTab] = useState('dayahead');

  const [health, setHealth] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [dayData, setDayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load health & monthly data on initial mount or cutoff change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      fetchHealth(),
      fetchMonthlyOverview(cutoffHour)
    ])
      .then(([healthRes, monthRes]) => {
        if (isMounted) {
          setHealth(healthRes);
          setMonthlyData(monthRes);
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

  return (
    <div className="clean-app-shell">
      {/* Sleek Minimalist Navbar */}
      <Header
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        cutoffHour={cutoffHour}
        onCutoffChange={setCutoffHour}
      />

      {/* Main Content Area */}
      <main className="clean-main-container">
        {/* Subtle, Crisp Market Notice Bar */}
        <div className="clean-notice-bar">
          <div className="notice-content">
            <span className="notice-badge">Market Analysis (Jan 2026)</span>
            <span className="notice-text">
              Day-ahead forecasts exhibited a systematic <strong>+1,840 MW over-prediction bias</strong> (P90 Deficit Risk: <strong>+4,312 MW</strong>). 
              Without error buffering, a utility under-procures day-ahead thermal power, triggering severe Balancing Mechanism cashout charges.
            </span>
          </div>
          <span className="notice-meta">744 Delivery Hours Evaluated</span>
        </div>

        {/* 4 Clean Metric Cards */}
        {monthlyData && (
          <MetricCards
            metrics={activeTab === 'dayahead' && dayData ? dayData.metrics : monthlyData.metrics}
            isDayView={activeTab === 'dayahead'}
            selectedDate={selectedDate}
          />
        )}

        {/* Modern Clean Tabs */}
        <div className="clean-tabs-row">
          <button
            className={`clean-tab ${activeTab === 'dayahead' ? 'active' : ''}`}
            onClick={() => setActiveTab('dayahead')}
          >
            <LineChart size={15} />
            <span>Day-Ahead Workbench</span>
          </button>
          <button
            className={`clean-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <Compass size={15} />
            <span>Error & Accuracy Analytics</span>
          </button>
          <button
            className={`clean-tab ${activeTab === 'evolution' ? 'active' : ''}`}
            onClick={() => setActiveTab('evolution')}
          >
            <Layers size={15} />
            <span>Forecast Evolution Waterfall</span>
          </button>
          <button
            className={`clean-tab ${activeTab === 'simulator' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulator')}
          >
            <Sliders size={15} />
            <span>Procurement & Buffer Optimizer</span>
          </button>
          <button
            className={`clean-tab ${activeTab === 'table' ? 'active' : ''}`}
            onClick={() => setActiveTab('table')}
          >
            <Table2 size={15} />
            <span>Daily Performance Matrix</span>
          </button>
        </div>

        {/* Tab Content Display */}
        {loading ? (
          <div className="clean-state-box">
            <div className="clean-spinner"></div>
            <p>Loading Elexon BMRS day-ahead market data...</p>
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
              />
            )}

            {activeTab === 'analytics' && (
              <ErrorAnalytics monthlyData={monthlyData} />
            )}

            {activeTab === 'evolution' && (
              <ForecastEvolution selectedDate={selectedDate} />
            )}

            {activeTab === 'simulator' && (
              <ProcurementSimulator cutoffHour={cutoffHour} />
            )}

            {activeTab === 'table' && (
              <DailyTable
                dailySummaries={monthlyData?.dailySummaries}
                onSelectDate={handleSelectDateFromTable}
              />
            )}
          </div>
        )}
      </main>

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
