// API Service for communicating with FastAPI Backend

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch system health');
  return res.json();
}

export async function fetchMonthlyOverview(cutoffHour = 11) {
  const res = await fetch(`${API_BASE}/monthly-overview?cutoff_hour=${cutoffHour}`);
  if (!res.ok) throw new Error('Failed to fetch monthly overview');
  return res.json();
}

export async function fetchDayAheadView(date = '2026-01-15', cutoffHour = 11) {
  const res = await fetch(`${API_BASE}/day-ahead?date=${date}&cutoff_hour=${cutoffHour}`);
  if (!res.ok) throw new Error(`Failed to fetch day-ahead data for ${date}`);
  return res.json();
}

export async function fetchForecastEvolution(targetStartTime = '2026-01-15T12:00:00Z') {
  const res = await fetch(`${API_BASE}/forecast-evolution?target_start_time=${encodeURIComponent(targetStartTime)}`);
  if (!res.ok) throw new Error('Failed to fetch forecast evolution');
  return res.json();
}

export async function simulateProcurement(payload, cutoffHour = 11) {
  const res = await fetch(`${API_BASE}/procurement-simulation?cutoff_hour=${cutoffHour}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to simulate procurement');
  return res.json();
}
