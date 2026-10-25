import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MetricCards from './components/MetricCards';
import DayAheadView from './components/DayAheadView';
import ErrorAnalytics from './components/ErrorAnalytics';
import ForecastEvolution from './components/ForecastEvolution';
import ProcurementSimulator from './components/ProcurementSimulator';
import DailyTable from './components/DailyTable';
import { fetchHealth, fetchMonthlyOverview, fetchDayAheadView, fetchSummary } from './services/api';
import { LineChart, Compass, Layers, Sliders, Table2, AlertCircle } from 'lucide-react';
import './App.css';

export default function App() {
  const [selectedDate, setSelectedDate] = useState('2026-01-15');
  const [cutoffHour, setCutoffHour] = useState(11); // 11:00 UTC D-1 default
  const [activeTab, setActiveTab] = useState('dayahead');

  const [health, setHealth] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [dayData, setDayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        {/* Top Market Analysis Banner with Visible MONTH Scope Badge */}
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

        {/* 4 Clean Metric Cards with Day / Month Scope Toggle */}
        {monthlyData && (
          <MetricCards
            dayMetrics={dayData?.metrics}
            monthMetrics={monthlyData?.metrics}
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
              <ErrorAnalytics 
                monthlyData={monthlyData} 
                summaryData={summaryData} 
              />
            )}

            {activeTab === 'evolution' && (
              <ForecastEvolution selectedDate={selectedDate} />
            )}

            {activeTab === 'simulator' && (
              <ProcurementSimulator 
                cutoffHour={cutoffHour} 
                defaultMonthlyP90={summaryData?.monthlyMetrics?.p90ErrorMW || monthlyData?.metrics?.p90ErrorMW || 4312.4}
              />
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
