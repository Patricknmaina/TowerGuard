# Backend Integration Guide (TowerGuard Frontend)

This is a concise checklist to connect the React/Tailwind frontend to your FastAPI (or other) backend without surprises.

## Environment
- Frontend env: `VITE_API_BASE_URL=http://localhost:8000/api` (or your host). Keep `/.env` at `frontend/.env`.
- Mock mode (one terminal): `npm run dev:mock` in `frontend` (sets up `mock-server.mjs` + Vite). Point env to `http://localhost:8787/api` when using mock.

## Required Endpoints
- `GET /health` → `{ status: "ok" }` used for header status.
- `GET /water-towers` → list of towers.
- `GET /sites` / `GET /sites/:id` → lists and details for sites.
- `GET /sites/:id/features` and `POST /sites/:id/features` → feature extraction.
- `POST /sites/:id/predict` → returns prediction for a site.
- `GET /biodiversity?site_id=...` → species near the site.
- `GET /nurseries` → nursery inventory.

## Water Tower Payload (minimum)
```json
{
  "id": "mau",
  "name": "Mau Forest Complex",
  "counties": ["Nakuru", "Kericho", "Bomet"],
  "geometry": { "type": "FeatureCollection", "features": [] }
  // or provide latitude/longitude if geometry is not available
}
```
- If you don’t have `geometry`, include `latitude` and `longitude`.
- Optional extras the UI can use: `category` (gazetted/proposed), `imageUrl`, risk level, metrics.

## Nursery Payload (minimum)
```json
{
  "id": "nursery-1",
  "name": "Aberdare Youth Nursery",
  "latitude": -0.345,
  "longitude": 36.69,
  "water_tower_id": "aberdare",
  "species_local": "Mũnunga",
  "species_scientific": "Juniperus procera",
  "capacity_seedlings": 12000
}
```

## Feature & Prediction Payload (examples)
- `GET /sites/:id/features`:
```json
{
  "id": "f1",
  "site_id": "site-aberdare",
  "date": "2025-01-15",
  "ndvi_mean": 0.62,
  "ndvi_std": 0.08,
  "rainfall": 122.4,
  "temperature": 18.5,
  "soil_properties": { "soc": 2.1, "ph": 5.8 },
  "other_env_features": { "slope_deg": 6 }
}
```
- `POST /sites/:id/predict` response:
```json
{
  "id": "p1",
  "site_id": "site-aberdare",
  "date": "2025-02-16",
  "survival_score": 0.81,
  "model_version": "rule-based-v1",
  "raw_outputs": { "ndvi": 0.68, "rainfall": 138.2 }
}
```

## Biodiversity Payload
`GET /biodiversity?site_id=...`:
```json
[
  { "scientific_name": "Juniperus procera", "local_name": "Mũnunga", "english_common_name": "African pencil cedar", "records": 12 }
]
```

## Trees/Bubbles Data
The map “bubbles” are currently placeholders. To make them real, expose a dataset per tower/site with:
```json
[
  { "lat": -0.4, "lng": 35.6, "value": 118, "species": "Juniperus / Podocarpus" }
]
```
Wire it into `WaterTowersMap.tsx` instead of the mock `bubblePoints` function.

## CORS
Enable CORS for your frontend origin (e.g., `http://localhost:5173`) so API calls succeed during dev.

## Runbook
1) Set `.env` in `frontend` to your API URL.  
2) Start backend (FastAPI) with the endpoints above.  
3) Run frontend: `npm run dev` (or `npm run dev:mock` for mock+UI).  
4) Verify `/health` shows “Online” in the header.  
5) Open Search → ensure towers load; click a tower → map recenters; toggle layers; check nursery pop-ups; open analytics/alerts.

When backend data is present, the UI automatically uses it; placeholders are only for mock mode.
