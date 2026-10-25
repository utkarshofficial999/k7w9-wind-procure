# AURA WIND | UK Day-Ahead Renewable Procurement & Forecast Risk Portal

An executive-grade decision-support platform designed for UK electricity utility trading desks responsible for Day-Ahead wholesale power procurement. Grounded in official Elexon BMRS market data (`FUELHH` actuals and `WINDFOR` forecasts) for **January 2026**.

---

## 🚀 Live Demo & Repository
- **Live Application Link**: [https://k7w9-wind-procure.onrender.com](https://k7w9-wind-procure.onrender.com) *(or local http://localhost:8050)*
- **GitHub Repository**: [https://github.com/utkarshofficial999/k7w9-wind-procure](https://github.com/utkarshofficial999/k7w9-wind-procure)
- **Video Walkthrough (YouTube Unlisted)**: [Link to 10-Minute Video Demo](https://youtu.be/sample-video-link)


---

## 📌 Executive Summary & Key Market Findings (January 2026)

In the UK wholesale power market, day-ahead auction orders on EPEX SPOT / Nord Pool must be submitted by **11:00 UTC on Day D-1** (Auction Gate Closure) for delivery across all 48 half-hour settlement periods of Day D. To determine how much thermal/peaker power to buy beyond renewable generation, utilities must rely on the latest wind forecasts published prior to gate closure.

### Key Analytical Findings:
1. **Systematic Over-Forecasting Bias (+1,840.3 MW)**:
   - Throughout January 2026 (744 delivery hours), day-ahead wind forecasts available at gate closure systematically **over-predicted** wind generation by an average of **+1,840.3 MW**.
   - Mean Actual Wind: **11,580.7 MW** | Mean Forecast Wind: **13,421.0 MW**.
2. **Deficit Risk Exposure (P90: +4,312.4 MW)**:
   - In 10% of trading hours, wind generation was over-estimated by more than **4,312 MW**, with a peak shortfall of **+6,833 MW**.
   - A utility relying on raw wind forecasts would have severely under-procured day-ahead power, exposing their portfolio to distressed real-time intraday purchases and punitive Balancing Mechanism cashout charges.
3. **Peak vs Off-Peak Divergence**:
   - Peak hours (07:00–19:00 UTC) exhibited an average MAE of **2,240 MW** and Bias of **+1,910 MW**, coinciding with peak wholesale price periods.
4. **Quantified Safety Buffer Value**:
   - Applying our recommended **P90 Confidence Buffer (+4,312 MW)** avoids **1.37 TWh** of emergency peak deficit imbalance exposure in January 2026, saving an estimated **£116.8 Million** at prevailing cashout spreads (£85/MWh).

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, Vite, Lucide Icons, Pure CSS3 with Glassmorphism, Responsive SVG Data Visualizations.
- **Backend**: Python 3.11+, FastAPI, Pandas, NumPy, Uvicorn, Pydantic v2.
- **Data Ingestion**: Official Elexon BMRS REST Streams:
  - Actual Wind Generation: `FUELHH/stream` (`fuelType == "WIND"`, half-hourly settlement periods).
  - Forecast Wind Generation: `WINDFOR/stream` (publishTime, startTime, generation MW).
- **Containerization**: Multi-stage `Dockerfile` (`node:20-alpine` + `python:3.11-slim`), `docker-compose.yml`.

---

## 📂 File & Directory Structure

```text
e:/intern/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application, REST endpoints, static SPA mounting
│   │   ├── config.py            # Market constants (11:00 UTC gate closure, peak hours, price spreads)
│   │   ├── data_fetcher.py      # Elexon BMRS API client with local disk caching & resilience
│   │   ├── analytics.py         # Day-ahead cutoff engine, error quantiles, diurnal profile, simulator
│   │   └── models.py            # Pydantic schemas for request/response validation
│   ├── data/
│   │   ├── fuelhh_wind_jan2026.json # 1,488 half-hourly actual wind records (Jan 1-31, 2026)
│   │   └── windfor_jan2026.json     # 19,637 forecast records covering January 2026
│   ├── requirements.txt         # Python dependencies
│   └── test_api.py              # Automated pytest test suite
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx       # Global market bar, date selector, D-1 cutoff toggles
│   │   │   ├── MetricCards.jsx  # Executive KPI cards (MAE, Bias, RMSE, Peak, P90, Total Wind)
│   │   │   ├── DayAheadView.jsx # Day-Ahead Decision workbench: SVG curve & hourly breakdown
│   │   │   ├── ErrorAnalytics.jsx # Diurnal 24h pattern, quantiles (P10-P95), peak vs off-peak
│   │   │   ├── ForecastEvolution.jsx # Vintage waterfall tracker across publication lead times
│   │   │   ├── ProcurementSimulator.jsx # Risk-adjusted thermal dispatch & financial ROI calculator
│   │   │   └── DailyTable.jsx   # 31-day evaluation matrix with sorting & CSV export
│   │   ├── services/
│   │   │   └── api.js           # API client service
│   │   ├── App.jsx              # Application state and tab router
│   │   ├── App.css              # Custom styling, glassmorphism, responsive grid
│   │   ├── index.css            # Design tokens and base typography
│   │   └── main.jsx             # React entrypoint
│   ├── package.json
│   ├── vite.config.js           # Vite configuration with backend proxy
│   └── index.html
├── Dockerfile                   # Multi-stage production container build
├── docker-compose.yml           # Single-command Docker Compose orchestration
├── run_app.py                   # Unified local Python launcher (serves API & Frontend on port 8050)
└── README.md                    # Project documentation, pitch script, and architecture review
```

---

## ⚡ How to Start the Application

### Option A: Standard Local Execution (Recommended)

1. **Prerequisites**: Python 3.10+ and Node.js 18+.
2. **Install Backend Dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. **Build Frontend**:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```
4. **Launch Unified Application**:
   ```bash
   python run_app.py
   ```
5. **Open in Browser**:
   - Web App UI: [http://localhost:8050](http://localhost:8050)
   - Interactive Swagger API Docs: [http://localhost:8050/docs](http://localhost:8050/docs)

### Option B: Docker Execution (One Command)

```bash
docker compose up --build
```
The application will automatically build the React assets, initialize the FastAPI server, and expose the portal on `http://localhost:8050`.

### Option C: Run Automated Tests

```bash
python -m pytest backend/test_api.py -v
```
*(All 5 test suites validate health checks, month metrics, day-ahead curve matching, evolution trace, and procurement calculations).*

---

## ☁️ Deployment Instructions (Heroku / Vercel / Render)

### Deploying to Heroku
1. Install Heroku CLI and login: `heroku login`
2. Create app: `heroku create kjhwr-wind-portal`
3. Set stack to container or buildpacks:
   ```bash
   heroku stack:set container
   git push heroku main
   ```
4. Or use `Procfile`:
   ```text
   web: python run_app.py
   ```

### Deploying to Vercel / Render
- **Render / Railway**: Link GitHub repo; select Docker environment; deploy with default port `8050`.
- **Vercel**: Deploy the `frontend` directory with Vite preset, pointing API routes to the hosted backend URL or serverless functions in `api/`.

---

## 🤖 AI Disclosure

As permitted by the challenge instructions, AI coding tools (Google DeepMind's Antigravity assistant powered by Gemini) were used to assist with rapid prototyping, data extraction scripts, and CSS glassmorphic aesthetic tuning. All domain logic, market cutoff alignment algorithms, statistical risk formulas, and software architecture decisions were designed and validated specifically for the UK electricity market context.

---

## 📹 Video Demo Script & Outline (Max 10 Minutes Total)

### Part 1: Client Presentation & Product Pitch (0:00 - 5:00)
- **Target Audience**: Head of Power Trading & Day-Ahead Procurement Desk at a UK Energy Utility.
- **The Core Problem (0:00 - 1:15)**:
  - "Every morning at 11:00 UTC, your team must lock in day-ahead wholesale electricity purchases on EPEX SPOT to serve consumer load. You need to know how much thermal power to buy to cover the gap left by intermittent renewables like wind."
  - "If you rely on raw, unadjusted wind forecasts, what happens? In January 2026, the market experienced a massive **+1,840 MW systematic over-prediction bias**."
- **Day-Ahead Decision Workbench Walkthrough (1:15 - 2:30)**:
  - Demonstrate selecting delivery dates (e.g., Jan 10, Jan 15) and selecting the **D-1 11:00 UTC Auction Cutoff**.
  - Show how the portal reconstructs the exact latest forecast available at gate closure, comparing it directly to actual generation and settlement periods (SP 1–48).
  - Highlight the peak period (07:00–19:00 UTC) where wind shortfalls force expensive balancing purchases.
- **Forecast Error Quantification & Diurnal Patterns (2:30 - 3:30)**:
  - Walk through the Diurnal Error Profile: show how morning ramps (07:00–09:00) and evening peaks (17:00–19:00) suffer from heightened forecast error.
  - Review the quantified error percentiles (P10 to P95), pointing out the **P90 safety threshold of +4,312 MW**.
- **The Game-Changer: Procurement & Buffer Simulator (3:30 - 4:45)**:
  - Slide customer demand to 20,000 MW and select the **P90 Confidence Buffer**.
  - Show the live computation: By discounting the day-ahead wind forecast by 4,312 MW, the utility hedges 1.37 TWh of deficit risk, saving an estimated **£116.8 Million** in avoided emergency cashout penalties.
- **Client Pitch Wrap-Up (4:45 - 5:00)**:
  - "AURA WIND transforms uncertain weather forecasts into a quantifiable trading advantage, protecting your portfolio against balancing cashout exposure."

---

### Part 2: Technical Lead Architecture & Code Review (5:00 - 10:00)
- **Target Audience**: Internal Technical Lead / Engineering Reviewer.
- **System Architecture & Design Decisions (5:00 - 6:00)**:
  - Decoupled modular design: High-performance Python/FastAPI backend paired with a modern React SPA.
  - In production, FastAPI mounts the compiled static bundle (`/frontend/dist`) and serves both REST APIs and the UI on a single unified port, eliminating CORS complications in containerized deployments.
- **Data Ingestion & Cutoff Matching Engine (6:00 - 7:30)**:
  - Grounded strictly in Elexon BMRS streams:
    - Actuals: `FUELHH/stream` (`fuelType == "WIND"`, half-hourly).
    - Forecasts: `WINDFOR/stream` (`publishTime`, `startTime`, `generation`).
  - Explain the decision cutoff matching algorithm:
    For delivery day $D$, the auction gate closure occurs on $D-1$ at 11:00 UTC. The engine filters all forecasts published $\le D-1 \text{ 11:00 UTC}$ covering $D$, and selects the most recent forecast for each delivery hour.
  - Discuss timezone handling: All timestamps are strictly parsed as UTC (`datetime64[us, UTC]`) to prevent timezone drift across daylight saving or server environments.
  - Hourly and half-hourly settlement alignment: In FUELHH, SPs $2h+1$ and $2h+2$ are aggregated to determine the hourly power average (MW) matching the hourly WINDFOR forecasts.
- **Statistical Analytics & Risk Formulation (7:30 - 8:30)**:
  - Code walkthrough of `backend/app/analytics.py`:
    - MAE: $\frac{1}{N}\sum |F_i - A_i|$
    - Bias: $\frac{1}{N}\sum (F_i - A_i)$ (explicitly signed to indicate deficit vs surplus)
    - RMSE: $\sqrt{\frac{1}{N}\sum (F_i - A_i)^2}$
    - WAPE: $\frac{\sum |F_i - A_i|}{\sum A_i} \times 100\%$
    - Quantiles computed via `Series.quantile([0.10, 0.25, 0.50, 0.75, 0.90, 0.95])`.
- **Quality Assurance, Docker & Maintainability (8:30 - 9:45)**:
  - Highlight `backend/test_api.py`: Automated PyTest coverage validating endpoints, mathematical consistency ($F - A = \text{Error}$), and simulation outputs.
  - Multi-stage Docker build: Stage 1 creates production Vite build; Stage 2 builds a lightweight Python 3.11 container with health check.
  - Pre-cached JSON resilience: Ensures zero-latency startup and resilience even if Elexon BMRS experiences network throttling.
- **Conclusion & Next Steps (9:45 - 10:00)**:
  - Extensible architecture ready for live WebSocket streaming or integration with utility portfolio ETRM systems (e.g. Aligntrac, Endur).
