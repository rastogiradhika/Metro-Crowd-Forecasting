# METROAI — Delhi Metro Passenger Flow Forecasting Frontend

A production-style, hackathon/MVP React frontend for station-level passenger inflow forecasting and relative crowd risk prediction across 262 Delhi Metro stations.

## Architecture

- **Framework**: React 19 + Vite
- **Styling**: Vanilla CSS Design Tokens (8px system, dark navy `#040d1a`, sky-blue `#38bdf8`, and authentic metro line palettes)
- **Icons**: Lucide React
- **Data Visualizations**: Recharts (dynamic code-split, loaded on-demand)
- **Data Layers**: GTFS Station Master (262 stations with accessibility infrastructure: gates, lifts, platforms, concourses)

## Quick Start

```powershell
cd metroai-frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

## Product Routes

- `/` — **Landing Page**: Verified project metrics (`262` stations, `~4.08` MAE), 3-step guide, commuter/operator mode cards, and core principles.
- `/passenger` — **Passenger Mode**: Searchable station dropdowns, screenshot-inspired journey timeline, origin crowd risk card with count-up animation, destination forecast, and smart departure advisories.
- `/admin` — **Operations Dashboard**: Network summary KPIs, top 5 priority alerts with reasons, 262-station sortable/filterable table, schematic corridor view, and deep station drill-down drawer.

## Connecting Real Backend

1. Copy `.env.example` to `.env`.
2. Configure `VITE_API_BASE_URL`:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   VITE_DEMO_MODE=false
   ```
3. When `VITE_API_BASE_URL` is not set, the frontend runs in **Demo Mode** with a mock prediction engine and displays a clear "Demo Data" indicator.
