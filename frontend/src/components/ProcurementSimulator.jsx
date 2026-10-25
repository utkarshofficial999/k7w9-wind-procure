import React, { useState, useEffect } from 'react';
import { Shield, DollarSign, Zap, Sliders, CheckCircle2, AlertOctagon, TrendingDown, ArrowRight } from 'lucide-react';
import { simulateProcurement } from '../services/api';

export default function ProcurementSimulator({ cutoffHour }) {
  const [demandMW, setDemandMW] = useState(20000);
  const [strategy, setStrategy] = useState('P90');
  const [customBuffer, setCustomBuffer] = useState(2500);
  const [penaltySpread, setPenaltySpread] = useState(85);
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const payload = {
      demandMW: parseFloat(demandMW),
      confidenceLevel: strategy,
      customBufferMW: strategy === 'Custom' ? parseFloat(customBuffer) : null,
      imbalancePenaltyPerMWh: parseFloat(penaltySpread)
    };

    simulateProcurement(payload, cutoffHour)
      .then((res) => {
        if (isMounted) {
          setSimResult(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Simulation error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [demandMW, strategy, customBuffer, penaltySpread, cutoffHour]);

  return (
    <div className="simulator-container glass-panel">
      <div className="simulator-header">
        <div>
          <div className="chart-tag">TRADING DESK DECISION SUPPORT</div>
          <h3 className="section-title">Procurement & Thermal Buffer Optimizer</h3>
          <p className="section-desc">
            Quantifies required thermal procurement beyond wind and simulates financial protection against imbalance cashout penalties.
          </p>
        </div>
      </div>

      {/* Interactive Controls Grid */}
      <div className="sim-controls-grid">
        {/* Demand Control */}
        <div className="sim-control-box">
          <label className="sim-label">
            <Zap size={16} className="text-cyan" />
            <span>Consumer Electricity Demand:</span>
            <strong className="text-cyan font-mono">{demandMW.toLocaleString()} MW</strong>
          </label>
          <input
            type="range"
            min="10000"
            max="35000"
            step="1000"
            value={demandMW}
            onChange={(e) => setDemandMW(Number(e.target.value))}
            className="sim-slider"
          />
          <div className="sim-slider-ticks">
            <span>10,000 MW</span>
            <span>20,000 MW (Standard)</span>
            <span>35,000 MW</span>
          </div>
        </div>

        {/* Safety Buffer Strategy */}
        <div className="sim-control-box">
          <label className="sim-label">
            <Shield size={16} className="text-purple" />
            <span>Risk Buffer Strategy:</span>
          </label>
          <div className="strategy-btn-group">
            {[
              { id: 'None', label: 'Raw Forecast (0 MW)' },
              { id: 'Mean_Bias', label: 'Mean Bias (+1,840 MW)' },
              { id: 'P75', label: 'P75 (+2,890 MW)' },
              { id: 'P90', label: 'P90 Standard (+4,312 MW)' },
              { id: 'P95', label: 'P95 Max (+5,120 MW)' },
              { id: 'Custom', label: 'Custom' }
            ].map((st) => (
              <button
                key={st.id}
                className={`strat-btn ${strategy === st.id ? 'active' : ''}`}
                onClick={() => setStrategy(st.id)}
              >
                {st.label}
              </button>
            ))}
          </div>

          {strategy === 'Custom' && (
            <div className="custom-buffer-input">
              <label>Enter Custom Buffer (MW):</label>
              <input
                type="number"
                value={customBuffer}
                onChange={(e) => setCustomBuffer(Number(e.target.value))}
                className="control-input"
              />
            </div>
          )}
        </div>

        {/* Imbalance Penalty Spread */}
        <div className="sim-control-box">
          <label className="sim-label">
            <DollarSign size={16} className="text-green" />
            <span>Balancing Penalty Spread:</span>
            <strong className="text-green font-mono">£{penaltySpread}/MWh</strong>
          </label>
          <input
            type="range"
            min="30"
            max="250"
            step="5"
            value={penaltySpread}
            onChange={(e) => setPenaltySpread(Number(e.target.value))}
            className="sim-slider"
          />
          <div className="sim-slider-ticks">
            <span>£30/MWh</span>
            <span>£85/MWh (UK Jan Avg)</span>
            <span>£250/MWh (Stress)</span>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {simResult && (
        <div className="sim-results-card">
          <div className="results-kpi-row">
            {/* KPI 1: Applied Buffer */}
            <div className="result-kpi-box glass-panel">
              <span className="res-lbl">Applied Wind Discount Buffer</span>
              <span className="res-val text-cyan">
                +{simResult.appliedBufferMW.toLocaleString()} MW
              </span>
              <span className="res-sub">Subtracted from raw forecast</span>
            </div>

            {/* KPI 2: Additional Day-Ahead Thermal Procured */}
            <div className="result-kpi-box glass-panel">
              <span className="res-lbl">Day-Ahead Thermal Scheduled</span>
              <span className="res-val text-purple">
                {(simResult.adjustedThermalRequiredMWh / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} GWh
              </span>
              <span className="res-sub">Procured cheaply day-ahead</span>
            </div>

            {/* KPI 3: Avoided Deficit Volume */}
            <div className="result-kpi-box glass-panel">
              <span className="res-lbl">Avoided Deficit Imbalance</span>
              <span className="res-val text-green">
                {(simResult.avoidedImbalanceExposureMWh / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} GWh
              </span>
              <span className="res-sub">Saved from emergency cashout</span>
            </div>

            {/* KPI 4: Financial Risk Savings */}
            <div className="result-kpi-box glass-panel highlight-box">
              <span className="res-lbl">Estimated Imbalance Cost Savings</span>
              <span className="res-val text-green font-bold">
                £{(simResult.estimatedRiskSavingsGBP / 1_000_000).toFixed(2)} Million
              </span>
              <span className="res-sub">Net financial risk avoided</span>
            </div>
          </div>

          {/* Rationale & Actionable Recommendation */}
          <div className="sim-rationale-box">
            <div className="rationale-header">
              <CheckCircle2 size={20} className="text-green" />
              <h4>Trading Desk Recommendation for January 2026</h4>
            </div>
            <p className="rationale-text">
              {simResult.notes}
            </p>
            <div className="dispatch-formula">
              <span className="formula-tag">DAY-AHEAD PROCUREMENT DISPATCH RULE</span>
              <code>
                Procure Thermal Power = MAX( 0, Demand ({demandMW.toLocaleString()} MW) - (Forecast Wind - {simResult.appliedBufferMW.toLocaleString()} MW) )
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
