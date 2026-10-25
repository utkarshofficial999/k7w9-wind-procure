import React, { useState, useEffect } from 'react';
import { Shield, DollarSign, Zap, Sliders, CheckCircle2, Calculator, Info, AlertTriangle } from 'lucide-react';
import { simulateProcurement } from '../services/api';
import { GlossaryTooltip } from './Glossary';

export default function ProcurementSimulator({ cutoffHour, defaultMonthlyP90 = 4312.4, mode = 'beginner' }) {
  const [demandMW, setDemandMW] = useState(20000);
  const [strategy, setStrategy] = useState('P90'); // Default to Monthly P90
  const [customBuffer, setCustomBuffer] = useState(2500);
  const [penaltySpread, setPenaltySpread] = useState(85); // Default £85/MWh
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

  const hedgedVolumeMWh = simResult ? simResult.avoidedImbalanceExposureMWh : 0;
  const hedgedVolumeTWh = hedgedVolumeMWh / 1_000_000;
  const liveSavingsGBP = simResult ? hedgedVolumeMWh * penaltySpread : 0;

  // ==================== BEGINNER 3-STEP FLOW (Requirement 8) ====================
  if (mode === 'beginner') {
    const isPlayingSafe = strategy !== 'None';

    return (
      <div className="simulator-container glass-panel">
        <div className="simulator-header">
          <div>
            <div className="chart-tag">SIMPLE PROCUREMENT GUIDE</div>
            <h3 className="section-title">How Much Extra Power Should I Buy?</h3>
            <p className="section-desc">
              Calculate the smart safety <GlossaryTooltip termKey="Buffer">buffer</GlossaryTooltip> to protect your utility against wind shortfall <GlossaryTooltip termKey="cashout">penalties</GlossaryTooltip>.
            </p>
          </div>
          <div className="header-badge-container">
            <span className="badge-illustrative">Estimate</span>
          </div>
        </div>

        <div className="beginner-flow-grid">
          {/* Step 1: Enter your demand */}
          <div className="flow-card">
            <div className="flow-step-num">Step 1</div>
            <h4 className="flow-title">Enter your consumer demand</h4>
            <p className="flow-desc">How much total power do your consumers need?</p>
            <div className="flow-input-box">
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted text-xs">Target Demand:</span>
                <strong className="font-mono text-cyan text-base">{demandMW.toLocaleString()} MW</strong>
              </div>
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
                <span>10k MW</span>
                <span>20k MW (Typical)</span>
                <span>35k MW</span>
              </div>
            </div>
          </div>

          {/* Step 2: Choose your strategy */}
          <div className="flow-card">
            <div className="flow-step-num">Step 2</div>
            <h4 className="flow-title">Choose your approach</h4>
            <p className="flow-desc">Trust the weather forecast or play safe?</p>
            <div className="flow-choices">
              <button
                className={`choice-card ${strategy === 'None' ? 'active danger' : ''}`}
                onClick={() => setStrategy('None')}
              >
                <div className="choice-header">
                  <AlertTriangle size={16} className="text-amber" />
                  <strong>Trust the forecast</strong>
                </div>
                <p className="choice-sub">0 MW buffer. Zero protection against forecast errors.</p>
              </button>

              <button
                className={`choice-card ${strategy === 'P90' ? 'active safe' : ''}`}
                onClick={() => setStrategy('P90')}
              >
                <div className="choice-header">
                  <Shield size={16} className="text-green" />
                  <strong>Play safe (recommended)</strong>
                </div>
                <p className="choice-sub">
                  Adds +{Math.round(defaultMonthlyP90).toLocaleString()} MW buffer. Covers 90% of deficit risk.
                </p>
              </button>
            </div>
          </div>

          {/* Step 3: See result in plain words */}
          <div className="flow-card result-flow-card">
            <div className="flow-step-num">Step 3</div>
            <div className="flex justify-between items-center">
              <h4 className="flow-title">Recommended Action</h4>
              <span className="badge-mini-illustrative">Estimate</span>
            </div>
            
            {loading ? (
              <div className="flow-loading">Calculating protection...</div>
            ) : simResult ? (
              <div className="flow-result-content">
                {strategy === 'None' ? (
                  <div className="flow-plain-result alert">
                    <p className="plain-result-text">
                      <strong>You are trusting the raw forecast.</strong> If wind collapses as it did across January, you will face unhedged cashout penalties on about <strong>{Math.round(simResult.unhedgedDeficitMWh).toLocaleString()} MWh</strong> of missing power!
                    </p>
                  </div>
                ) : (
                  <div className="flow-plain-result success">
                    {/* Requirement 8 Exact Quote Pattern */}
                    <p className="plain-result-text">
                      <strong>Playing safe</strong> means buying <strong>{Math.round(simResult.appliedBufferMW).toLocaleString()} MW</strong> more <GlossaryTooltip termKey="Thermal">thermal power</GlossaryTooltip> and avoiding about <strong>£{(liveSavingsGBP / 1_000_000).toFixed(1)} Million</strong> of last-minute costs.
                    </p>
                    <div className="plain-result-meta">
                      <span>Protected Volume: <strong>{(hedgedVolumeMWh / 1000).toFixed(0)} GWh ({hedgedVolumeTWh.toFixed(3)} TWh)</strong></span>
                      <span>Total Avoided Cashout: <strong>£{Math.round(liveSavingsGBP).toLocaleString()}</strong></span>
                    </div>
                  </div>
                )}

                {/* Editable Price Assumption */}
                <div className="flow-price-assumption">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted">Cashout price assumption:</span>
                    <div className="editable-price-wrapper">
                      <span>£</span>
                      <input
                        type="number"
                        min="0"
                        max="500"
                        value={penaltySpread}
                        onChange={(e) => setPenaltySpread(Math.max(0, Number(e.target.value)))}
                        className="editable-price-input"
                        aria-label="Cashout price assumption in pounds per MWh"
                      />
                      <span className="unit-label">/MWh</span>
                    </div>
                  </div>
                  <span className="text-muted text-xs block">
                    UK winter balancing cashout spread typically averages £85/MWh.
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // ==================== EXPERT MODE VIEW ====================
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
        <div className="header-badge-container">
          <span className="badge-illustrative">Illustrative estimate</span>
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

        {/* Safety Buffer Strategy (Defaults to Monthly P90) */}
        <div className="sim-control-box">
          <label className="sim-label">
            <Shield size={16} className="text-purple" />
            <span>Risk Buffer Strategy:</span>
          </label>
          <div className="strategy-btn-group">
            {[
              { id: 'P90', label: `Monthly P90 Confidence Buffer (+${Math.round(defaultMonthlyP90).toLocaleString()} MW) [Default]` },
              { id: 'Mean_Bias', label: 'Monthly Mean Bias (+1,840 MW)' },
              { id: 'P75', label: 'Monthly P75 (+2,991 MW)' },
              { id: 'P95', label: 'Monthly P95 (+5,419 MW)' },
              { id: 'None', label: 'Raw Forecast (0 MW Buffer)' },
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

        {/* Imbalance Penalty Spread (Editable Input with Sensible Default) */}
        <div className="sim-control-box">
          <label className="sim-label">
            <DollarSign size={16} className="text-green" />
            <span>Cashout Price Assumption (£/MWh):</span>
            <div className="editable-price-wrapper">
              <span>£</span>
              <input
                type="number"
                min="0"
                max="1000"
                step="1"
                value={penaltySpread}
                onChange={(e) => setPenaltySpread(Math.max(0, Number(e.target.value)))}
                className="editable-price-input"
              />
              <span className="unit-label">/MWh</span>
            </div>
          </label>
          <input
            type="range"
            min="20"
            max="250"
            step="5"
            value={penaltySpread}
            onChange={(e) => setPenaltySpread(Number(e.target.value))}
            className="sim-slider"
          />
          <div className="sim-slider-ticks">
            <span>£20/MWh</span>
            <span>£85/MWh (UK Winter Avg)</span>
            <span>£250/MWh (Stress)</span>
          </div>
        </div>
      </div>

      {/* Assumptions & Methodology Breakdown Box */}
      {simResult && (
        <div className="assumptions-card glass-panel">
          <div className="assumptions-header">
            <div className="flex items-center gap-2">
              <Calculator size={16} className="text-cyan" />
              <strong>Avoided Cashout Penalty Assumptions & Calculation</strong>
            </div>
            <span className="badge-illustrative">Illustrative estimate</span>
          </div>
          <div className="assumptions-grid">
            <div className="assumption-item">
              <span className="assump-lbl">Consumer Demand:</span>
              <span className="assump-val font-mono">{demandMW.toLocaleString()} MW</span>
            </div>
            <div className="assumption-item">
              <span className="assump-lbl">Cashout Penalty Spread:</span>
              <span className="assump-val font-mono text-green">£{penaltySpread}/MWh</span>
            </div>
            <div className="assumption-item">
              <span className="assump-lbl">Hedged Imbalance Volume:</span>
              <span className="assump-val font-mono text-cyan">
                {Math.round(hedgedVolumeMWh).toLocaleString()} MWh ({hedgedVolumeTWh.toFixed(4)} TWh)
              </span>
            </div>
            <div className="assumption-item">
              <span className="assump-lbl">Applied Strategy Buffer:</span>
              <span className="assump-val font-mono text-purple">
                +{simResult.appliedBufferMW.toLocaleString()} MW ({strategy === 'P90' ? 'Monthly P90' : strategy})
              </span>
            </div>
          </div>
          <div className="formula-box">
            <div className="formula-title">Live Valuation Formula:</div>
            <code>
              Avoided Cashout Penalty (£) = Hedged Volume ({Math.round(hedgedVolumeMWh).toLocaleString()} MWh) × Cashout Spread (£{penaltySpread}/MWh) = £{Math.round(liveSavingsGBP).toLocaleString()}
            </code>
            <div className="formula-subtext text-muted">
              Where Hedged Volume = Raw Deficit Imbalance MWh ({Math.round(simResult.unhedgedDeficitMWh).toLocaleString()} MWh) − Buffered Deficit Imbalance MWh ({Math.round(simResult.unhedgedDeficitMWh - hedgedVolumeMWh).toLocaleString()} MWh), derived from the dispatch rule: Thermal = max(0, Demand − (Forecast − Buffer)).
            </div>
          </div>
        </div>
      )}

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
              <span className="res-sub">Monthly P90 buffer default</span>
            </div>

            {/* KPI 2: Additional Day-Ahead Thermal Procured */}
            <div className="result-kpi-box glass-panel">
              <span className="res-lbl">Day-Ahead Thermal Scheduled</span>
              <span className="res-val text-purple">
                {(simResult.adjustedThermalRequiredMWh / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} GWh
              </span>
              <span className="res-sub">Procured ahead of gate closure</span>
            </div>

            {/* KPI 3: Avoided Deficit Volume */}
            <div className="result-kpi-box glass-panel">
              <span className="res-lbl">Avoided Deficit Imbalance</span>
              <span className="res-val text-green">
                {hedgedVolumeTWh.toFixed(3)} TWh
              </span>
              <span className="res-sub">{(hedgedVolumeMWh / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} GWh protected</span>
            </div>

            {/* KPI 4: Financial Risk Savings */}
            <div className="result-kpi-box glass-panel highlight-box">
              <div className="flex justify-between items-center">
                <span className="res-lbl">Avoided Cashout Penalty Savings</span>
                <span className="badge-mini-illustrative">Illustrative estimate</span>
              </div>
              <span className="res-val text-green font-bold">
                £{(liveSavingsGBP / 1_000_000).toFixed(2)} Million
              </span>
              <span className="res-sub">Live recomputed (£{Math.round(liveSavingsGBP).toLocaleString()})</span>
            </div>
          </div>

          {/* Rationale & Actionable Recommendation */}
          <div className="sim-rationale-box">
            <div className="rationale-header">
              <CheckCircle2 size={20} className="text-green" />
              <h4>Trading Desk Dispatch Recommendation (January 2026)</h4>
            </div>
            <p className="rationale-text">
              {simResult.notes}
            </p>
            <div className="dispatch-formula">
              <span className="formula-tag">DAY-AHEAD PROCUREMENT DISPATCH RULE</span>
              <code>
                Thermal Procured = MAX( 0, Demand ({demandMW.toLocaleString()} MW) - (Forecast Wind - {simResult.appliedBufferMW.toLocaleString()} MW) )
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
