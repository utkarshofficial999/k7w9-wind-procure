# GB Wind Day-Ahead Decision Portal

Pilot application for a UK energy utility buying electricity in the day-ahead market.

## What it does

The portal uses only the two requested Elexon BMRS datasets:

- `FUELHH` — half-hourly actual generation by fuel type; the app filters `fuelType = WIND`.
- `WINDFOR` — wind generation forecasts, including `startTime`, `publishTime`, and `generation`.

For January 2026 delivery periods, the application:

1. Shows the latest wind forecast available at a configurable D-1 decision cutoff.
2. Compares the selected forecast against actual wind generation.
3. Quantifies forecast error using MAE, RMSE, mean bias, and error percentiles.
4. Shows a time-series chart and an error-distribution view.
5. Lets the reviewer change the decision cutoff and delivery date range.

### Important pilot assumption

The exact commercial decision timestamp was not supplied in the brief. The UI therefore makes the decision cutoff explicit and configurable. The default is **09:30 GMT on D-1**, positioned around the UK day-ahead decision window. This is a modelling assumption for the pilot, not a claim about the client's internal gate closure.

Elexon states that WINDFOR updates can be published up to eight times per day at 03:30, 05:30, 08:30, 10:30, 12:30, 16:30, 19:30 and 23:30. The product therefore selects, for every delivery interval, the most recent forecast whose `publishTime` is at or before the configured D-1 cutoff.

## Architecture

```text
                    ┌─────────────────────────┐
                    │      React + Vite        │
                    │ Dashboard / Charts / UX  │
                    └────────────┬────────────┘
                                 │ HTTP/JSON
                    ┌────────────▼────────────┐
                    │       FastAPI API        │
                    │  validation + analytics │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    Elexon BMRS API       │
                    │ FUELHH + WINDFOR datasets│
                    └─────────────────────────┘
```

The backend deliberately owns data retrieval and metric calculation so that the browser never calls Elexon directly and the analytical logic is testable independently of the UI.

## Repository layout

```text
.
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── elexon.py
│   │   └── analytics.py
│   ├── tests/
│   │   └── test_analytics.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── styles.css
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Run locally

### Docker

```bash
docker compose up --build
```

Then open:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:8000/api/health`
- API docs: `http://localhost:8000/docs`

### Without Docker

Backend:

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL=http://localhost:8000` if the frontend is not using its default local backend.

## API

`GET /api/analysis?start_date=2026-01-01&end_date=2026-01-31&cutoff=09:30`

Returns:

- selected forecast points
- actual wind points
- aligned comparison points
- summary metrics
- forecast publication timestamp used for each delivery interval

## Metrics

For error `e = forecast - actual`:

- **MAE** = mean(|e|)
- **RMSE** = sqrt(mean(e²))
- **Bias** = mean(e)
- **Absolute percentage error** is reported only where actual generation is non-zero.

The dashboard labels bias as **forecast minus actual**, so positive bias means the forecast overestimated wind.

## Data and provenance

Source: Elexon BMRS / Insights API.

- FUELHH documentation: https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream
- WINDFOR documentation: https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream

No additional generation, weather, price, or demand dataset is used.

## AI tools

AI assistance was used during development for code scaffolding, UI iteration, documentation drafting, and review of implementation ideas. The analytical definitions, source constraints, and decision-time selection logic were explicitly reviewed against the assignment requirements.

## Deployment

### 1. Backend on Railway (Live)

The FastAPI backend is deployed and running live on Railway:
- **Base URL**: `https://k7w9-wind-procure-production.up.railway.app`
- **Health check**: `https://k7w9-wind-procure-production.up.railway.app/api/health`
- **Interactive API docs**: `https://k7w9-wind-procure-production.up.railway.app/docs`

### 2. Frontend on Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. Select repository `utkarshofficial999/k7w9-wind-procure`.
3. In Project Settings:
   - **Root Directory**: click **Edit** and select `frontend`
   - **Framework Preset**: `Vite` (auto-detected)
4. Click **Deploy**. (The frontend is pre-configured to default directly to the live Railway backend).

### 3. Docker & Container Deployment (Local or VM)

You can also run both services via Docker Compose locally or on any VM / container host:

```bash
docker compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`

## Video demo plan

### Part 1 — customer pitch, <=5 minutes

1. Problem: uncertainty in wind generation creates procurement risk.
2. Dashboard: latest forecast available at decision time.
3. January 2026 forecast-vs-actual view.
4. Error metrics: MAE, RMSE, bias and percentile error.
5. Decision takeaway: use the quantified error as a risk band rather than treating the forecast as exact.
6. Explain that cutoff is configurable and all values are traceable to Elexon.

### Part 2 — technical review, <=5 minutes

1. React/Vite frontend and FastAPI backend.
2. Backend retrieves Elexon data and owns analytical logic.
3. D-1 cutoff selection algorithm.
4. Forecast/actual interval alignment.
5. Metric calculations and tests.
6. Docker setup, environment variables, limitations and next steps.

## Limitations / next production steps

- Confirm the client's exact day-ahead decision/gate timestamp.
- Add persistent caching and scheduled ingestion rather than fetching the entire month on every cold start.
- Add authentication and audit logging.
- Add retries/backoff and Elexon rate-limit handling.
- Add a production data store for forecast vintages.
- Add monitoring for missing settlement periods and source schema changes.
