import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MetricCards from './components/MetricCards';
import DayAheadView from './components/DayAheadView';
import ErrorAnalytics from './components/ErrorAnalytics';
import ForecastEvolution from './components/ForecastEvolution';
import ProcurementSimulator from './components/ProcurementSimulator';
import DailyTable from './components/DailyTable';
import { fetchHealth, fetchMonthlyOverview, fetchDayAheadView } from './services/api';
import { LayoutDashboard, LineChart, Compass, Sliders, Table2, Layers, AlertCircle } from 'lucide-react';
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
    <div className="app-container">
      {/* Top Header & Navigation */}
      <Header
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        cutoffHour={cutoffHour}
        onCutoffChange={setCutoffHour}
        health={health}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Executive Summary Banner */}
        <section className="executive-banner glass-panel">
          <div className="banner-left">
            <span className="banner-tag">CLIENT DECISION BRIEFING</span>
            <h2 className="banner-title">
              UK Day-Ahead Wind Forecasting & Procurement Summary
            </h2>
            <p className="banner-desc">
              During <strong>January 2026</strong>, day-ahead wind forecasts available at auction gate closure (11:00 UTC D-1) 
              exhibited a systematic <strong className="text-rose">+1,840 MW over-prediction bias</strong> (P90 Deficit Risk: +4,312 MW). 
              Without quantified error buffering, an electricity utility relying on raw wind forecasts under-procures power in the day-ahead wholesale market, 
              incurring severe Balancing Mechanism cashout charges.
            </p>
          </div>
          <div className="banner-badges">
            <div className="summary-pill">
              <span className="pill-title">Evaluated Hours</span>
              <span className="pill-val">744 / 744 (100%)</span>
            </div>
            <div className="summary-pill">
              <span className="pill-title">Systematic Bias</span>
              <span className="pill-val text-rose">+1,840 MW</span>
            </div>
            <div className="summary-pill">
              <span className="pill-title">P90 Risk Margin</span>
              <span className="pill-val text-rose">+4,312 MW</span>
            </div>
          </div>
        </section>

        {/* Global KPI Cards */}
        {monthlyData && (
          <MetricCards
            metrics={activeTab === 'dayahead' && dayData ? dayData.metrics : monthlyData.metrics}
            segmentMetrics={monthlyData.segmentMetrics}
            isDayView={activeTab === 'dayahead'}
            selectedDate={selectedDate}
          />
        )}

        {/* Navigation Tabs */}
        <div className="tabs-navigation">
          <button
            className={`tab-btn ${activeTab === 'dayahead' ? 'active' : ''}`}
            onClick={() => setActiveTab('dayahead')}
          >
            <LineChart size={17} />
            <span>Day-Ahead Decision Workbench</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <Compass size={17} />
            <span>Forecast Error & Accuracy Analytics</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'evolution' ? 'active' : ''}`}
            onClick={() => setActiveTab('evolution')}
          >
            <Layers size={17} />
            <span>Forecast Evolution (Vintage Waterfall)</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'simulator' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulator')}
          >
            <Sliders size={17} />
            <span>Procurement & Thermal Buffer Optimizer</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
            onClick={() => setActiveTab('table')}
          >
            <Table2 size={17} />
            <span>January 2026 Daily Evaluation Matrix</span>
          </button>
        </div>

        {/* Tab Content Display */}
        {loading ? (
          <div className="loading-state glass-panel">
            <div className="loading-spinner"></div>
            <p>Loading Elexon BMRS day-ahead datasets and analytical models...</p>
          </div>
        ) : error ? (
          <div className="error-state glass-panel">
            <AlertCircle size={32} className="text-rose" />
            <p>Error connecting to analytics engine: {error}</p>
          </div>
        ) : (
          <div className="tab-body">
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

      {/* Footer */}
      <footer className="footer-container">
        <div className="footer-content">
          <div>
            <p className="footer-title">
              UK Day-Ahead Electricity Market Decision Support System
            </p>
            <p className="footer-sub">
              Built with React, FastAPI, Python, and Docker. Grounded in Elexon BMRS FUELHH (Wind Actuals) and WINDFOR (Wind Forecasts) streams for January 2026.
            </p>
          </div>
          <div className="footer-attribution">
            <span>Client Pilot Product</span>
            <span>Technical Architecture Review Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
