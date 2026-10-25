import React, { useState } from 'react';
import { CloudRain, Gauge, AlertTriangle, ChevronDown, ChevronUp, Wind } from 'lucide-react';
import { GlossaryTooltip } from './Glossary';

export default function BeginnerHero({ summaryData }) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  return (
    <section className="beginner-hero-card glass-panel" aria-label="Introduction to AURA WIND">
      {/* 3-Line Plain English Explainer */}
      <div className="beginner-hero-text-block">
        <div className="hero-tag">
          <Wind size={14} className="text-cyan" />
          <span>WHAT IS THIS PLATFORM?</span>
        </div>
        <h2 className="beginner-hero-heading">
          Power traders must buy electricity a day ahead. They guess how much wind power will be available using a <GlossaryTooltip termKey="D-1 auction">forecast</GlossaryTooltip>. This site shows how wrong that forecast was, and how much extra power to buy so you don't get hit with expensive last-minute <GlossaryTooltip termKey="cashout">prices</GlossaryTooltip>.
        </h2>
      </div>

      {/* 3-Step Strip with Icons */}
      <div className="beginner-step-strip">
        <div className="step-strip-item">
          <div className="step-icon-circle blue">
            <CloudRain size={18} />
          </div>
          <div className="step-info">
            <span className="step-num">Step 1</span>
            <strong className="step-title">Forecast</strong>
            <span className="step-desc">Traders predict tomorrow’s wind</span>
          </div>
        </div>

        <div className="step-arrow">→</div>

        <div className="step-strip-item">
          <div className="step-icon-circle green">
            <Gauge size={18} />
          </div>
          <div className="step-info">
            <span className="step-num">Step 2</span>
            <strong className="step-title">Reality</strong>
            <span className="step-desc">Actual wind usually blows less</span>
          </div>
        </div>

        <div className="step-arrow">→</div>

        <div className="step-strip-item">
          <div className="step-icon-circle rose">
            <AlertTriangle size={18} />
          </div>
          <div className="step-info">
            <span className="step-num">Step 3</span>
            <strong className="step-title">Gap = Risk</strong>
            <span className="step-desc">Shortfalls mean emergency backup power</span>
          </div>
        </div>
      </div>

      {/* Expandable Technical Details Link */}
      <div className="technical-details-toggle">
        <button
          className="toggle-link-btn"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          aria-expanded={showTechnicalDetails}
        >
          <span>{showTechnicalDetails ? 'Hide technical market data' : 'Show technical market details (January 2026 data)'}</span>
          {showTechnicalDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {showTechnicalDetails && (
        <div className="expanded-technical-banner">
          <div className="tech-banner-badge">Month Scope (Jan 2026, 744 hrs)</div>
          <p className="tech-banner-text">
            Across January 2026, day-ahead wind forecasts exhibited a systematic{' '}
            <strong>+{summaryData?.monthlyMetrics?.biasMW ? Math.round(summaryData.monthlyMetrics.biasMW).toLocaleString() : '1,840'} MW over-prediction bias</strong>{' '}
            (<GlossaryTooltip termKey="P90">Monthly P90 Deficit Risk</GlossaryTooltip>:{' '}
            <strong>+{summaryData?.monthlyMetrics?.p90ErrorMW ? Math.round(summaryData.monthlyMetrics.p90ErrorMW).toLocaleString() : '4,312'} MW</strong>; Max monthly single-hour shortfall:{' '}
            <strong>+{summaryData?.maxMonthlyShortfallMW ? Math.round(summaryData.maxMonthlyShortfallMW).toLocaleString() : '6,833'} MW</strong>; Over-forecast in <strong>{summaryData?.shareOfHoursOverForecastPercent ?? '84.4'}%</strong> of hours).
            Without safety buffering, utilities under-procure day-ahead power and face severe cashout balancing penalties.
          </p>
        </div>
      )}
    </section>
  );
}
