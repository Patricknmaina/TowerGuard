# TowerGuard
A data-driven forest restoration platform for Kenya. Tracks tree survival using NDVI, rainfall, soil, and climate data; maps nurseries; visualizes biodiversity; and generates site health scores via a rule-based model. Built with FastAPI, TorchGeo, React, and real environmental datasets.

## Frontend (React + Tailwind)
The `/frontend` directory hosts the TowerGuard dashboard built with Vite + TypeScript, Tailwind CSS, React Router, React Query, React Leaflet, and Recharts. It implements the routes described in `spec.md`:

- `/` — overview dashboard with Kenya water tower overlays
- `/sites` — site management and creation form
- `/sites/:siteId` — per-site project, biodiversity, and nursery intelligence

### Getting Started
1) Install Node.js 18+ (and npm).
2) Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
3) Create an `.env` file to point at the backend (adjust host/port as needed):
   ```bash
   echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env
   ```
4) Run the development server against your backend:
   ```bash
   npm run dev
   ```
   Then open the printed URL (default `http://localhost:5173`).

### One-command mock + frontend
If you want to run the mock API and the frontend together in one terminal:
```bash
cd frontend
npm run dev:mock
```
This uses `concurrently` to start `mock-server.mjs` and Vite. Make sure your `.env` (or `.env.example`) points to the mock URL, e.g.:
```
VITE_API_BASE_URL=http://localhost:8787/api
```

### Notes for backend integration
- Expected endpoints: `/health`, `/water-towers`, `/sites`, `/sites/:id`, `/sites/:id/features`, `/sites/:id/predict`, `/biodiversity?site_id=...`, `/nurseries`.
- Water towers: supply either geometry or `latitude`/`longitude` plus `id`, `name`, `counties`.
- Nurseries: supply `id`, `name`, `latitude`, `longitude`, `species_local`, `species_scientific`, `capacity_seedlings`, and a tower link (e.g., `water_tower_id`).
- Tree bubble counts in the map are placeholders; provide a real dataset (counts + species per site/tower) to replace the mock `bubblePoints` in `WaterTowersMap.tsx`.

See `docs/backend-integration.md` for a concise checklist and payload expectations.
