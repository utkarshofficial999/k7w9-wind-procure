import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Clock3,
  RefreshCw,
  Wind,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = {
  startTime: string;
  publishTime: string;
  forecast: number;
  actual: number;
  error: number;
  absoluteError: number;
};

type Response = {
  period: { start: string; end: string };
  decision_cutoff_gmt: string;
  metrics: {
    intervals: number;
    mae: number;
    rmse: number;
    bias: number;
    p90_abs_error: number;
    p95_abs_error: number;
    mean_actual: number;
    mean_forecast: number;
  };
  points: Point[];
};

const rawApi =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://k7w9-wind-procure-production.up.railway.app"
    : "http://localhost:8000");
const API = rawApi.replace(/\/+$/, "");

function fmt(value: number) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value);
}

function App() {
  const [cutoff, setCutoff] = useState("09:30");
  const [start, setStart] = useState("2026-01-01");
  const [end, setEnd] = useState("2026-01-31");
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ start_date: start, end_date: end, cutoff });
      const res = await fetch(`${API}/api/analysis?${qs}`);
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load analysis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const chartData = useMemo(() =>
    data?.points.map((p) => ({
      ...p,
      label: new Date(p.startTime).toLocaleString("en-GB", { day: "2-digit", hour: "2-digit" }),
    })) ?? [], [data]);

  const latest = data?.points.at(-1);

  return (
    <main>
      <header className="topbar">
        <div className="brand"><Wind size={20} /> GRIDWISE <span>/ WIND DECISION</span></div>
        <div className="status"><span className="dot" /> ELEXON CONNECTED</div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">DAY-AHEAD PROCUREMENT INTELLIGENCE</p>
          <h1>Know the wind.<br /><span>Buy with confidence.</span></h1>
          <p className="hero-copy">
            A decision cockpit for understanding the latest wind forecast available before
            the day-ahead purchase decision — with the historical error quantified.
          </p>
        </div>

        <div className="control-card">
          <div className="control-title"><Clock3 size={16} /> Decision snapshot</div>
          <label>D-1 cutoff (GMT)
            <select value={cutoff} onChange={e => setCutoff(e.target.value)}>
              {["08:30","09:00","09:20","09:30","09:50","10:30","12:30","23:30"].map(t => <option key={t}>{t}</option>)}
            </select>
          </label>
          <div className="date-row">
            <label>From<input type="date" value={start} onChange={e => setStart(e.target.value)} /></label>
            <label>To<input type="date" value={end} onChange={e => setEnd(e.target.value)} /></label>
          </div>
          <button onClick={load} disabled={loading}>
            {loading ? <RefreshCw className="spin" size={16} /> : <Activity size={16} />}
            {loading ? "Refreshing…" : "Refresh analysis"}
          </button>
        </div>
      </section>

      {error && <div className="error"><AlertTriangle size={18}/><span>{error}</span></div>}

      {data && (
        <>
          <section className="kpis">
            <Kpi title="Mean absolute error" value={`${fmt(data.metrics.mae)} MW`} sub="Typical forecast miss" />
            <Kpi title="RMSE" value={`${fmt(data.metrics.rmse)} MW`} sub="Penalises large misses" />
            <Kpi title="Mean bias" value={`${data.metrics.bias >= 0 ? "+" : ""}${fmt(data.metrics.bias)} MW`}
              sub={data.metrics.bias >= 0 ? "Systematic over-forecast" : "Systematic under-forecast"}
              icon={data.metrics.bias >= 0 ? <ArrowUp size={16}/> : <ArrowDown size={16}/>} />
            <Kpi title="P95 absolute error" value={`${fmt(data.metrics.p95_abs_error)} MW`} sub="High-confidence risk band" />
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">JANUARY 2026 • SELECTED D-1 VINTAGE</p>
                <h2>Forecast vs actual wind generation</h2>
              </div>
              {latest && <div className="latest"><span>Latest delivery interval</span><b>{new Date(latest.startTime).toLocaleString("en-GB")}</b></div>}
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" minTickGap={50} />
                  <YAxis unit=" MW" />
                  <Tooltip formatter={(v: number) => [`${fmt(v)} MW`, ""]} />
                  <Line type="monotone" dataKey="actual" strokeWidth={2.5} dot={false} name="Actual" />
                  <Line type="monotone" dataKey="forecast" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Forecast" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="legend"><span><i className="actual" /> Actual generation</span><span><i className="forecast" /> Selected forecast vintage</span></div>
          </section>

          <section className="lower-grid">
            <div className="panel">
              <div className="panel-head compact">
                <div><p className="eyebrow">ERROR PROFILE</p><h2>Forecast error by interval</h2></div>
                <span className="unit">MW • forecast − actual</span>
              </div>
              <div className="chart-wrap small">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" minTickGap={50} />
                    <YAxis unit=" MW" />
                    <Tooltip formatter={(v: number) => [`${fmt(v)} MW`, "Error"]} />
                    <ReferenceLine y={0} />
                    <Line type="monotone" dataKey="error" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel insight">
              <p className="eyebrow">DECISION BRIEF</p>
              <h2>How should the desk use this?</h2>
              <div className="callout">
                <BarChart3 size={20}/>
                <div><b>Use the P95 error as a conservative planning band.</b>
                <p>A forecast is an estimate, not a guaranteed delivery volume. The dashboard quantifies the historical miss for the exact decision vintage being reviewed.</p></div>
              </div>
              <div className="mini-stat"><span>Intervals analysed</span><b>{fmt(data.metrics.intervals)}</b></div>
              <div className="mini-stat"><span>Average forecast</span><b>{fmt(data.metrics.mean_forecast)} MW</b></div>
              <div className="mini-stat"><span>Average actual</span><b>{fmt(data.metrics.mean_actual)} MW</b></div>
            </div>
          </section>

          <footer>
            <span>Source: Elexon BMRS • FUELHH + WINDFOR</span>
            <span>Decision cutoff: {data.decision_cutoff_gmt} GMT D-1 • Pilot scope: January 2026</span>
          </footer>
        </>
      )}
    </main>
  );
}

function Kpi({title, value, sub, icon}: {title: string; value: string; sub: string; icon?: React.ReactNode}) {
  return <div className="kpi"><div className="kpi-top"><span>{title}</span>{icon}</div><strong>{value}</strong><small>{sub}</small></div>;
}

export default App;
