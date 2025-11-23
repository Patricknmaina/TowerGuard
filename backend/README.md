# Wangaari Maathai Hackathon - Backend

Ecosystem health monitoring and prediction API built with FastAPI, MongoDB, and ML.

## Project Structure

```
backend/
├── app/
│   ├── api/          # API route handlers
│   ├── core/         # Core utilities (data loaders)
│   ├── db/           # MongoDB session management
│   ├── ml/           # ML pipeline and models
│   ├── schemas/      # Pydantic schemas
│   └── services/     # External data services
├── data/
│   ├── water_towers/ # Water tower GeoJSON data
│   ├── nurseries/    # Nursery CSV data
│   ├── biodiversity/ # Biodiversity CSV data
│   └── fixtures/     # Fallback fixture data
└── tests/            # Smoke tests
```

## Setup

### Prerequisites

- Python 3.11+
- MongoDB 6+ (or compatible hosted cluster)
- pip or uv

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file:
```bash
cp .env.example .env
# Edit MONGODB_URI / MONGODB_DB if your cluster differs from defaults
```

3. Initialize MongoDB collections:
```bash
python - <<'PY'
from app.db.session import get_db
from app.core.loaders import load_all_data

db = next(get_db())
load_all_data(db)
PY
```
Make sure your MongoDB instance is running before loading datasets.

### Ensuring a site per water tower
Seed the monitoring sites so each tower has an analytics site:
```bash
.\\venv\\Scripts\\python.exe seed_sites.py
```
The script wipes `sites` and reloads every demo site, adding auto-generated sites for any tower still missing a match. Run it after `load_all_data` whenever you refresh the catalog.

### Running the Server

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Health
- `GET /api/health` - Health check

### Sites
- `GET /api/sites` - List all sites
- `POST /api/sites` - Create new site
- `GET /api/sites/{site_id}` - Get site by ID
- `DELETE /api/sites/{site_id}` - Delete site (dev only)

### Features
- `POST /api/sites/{site_id}/features` - Extract features for a site
- `GET /api/sites/{site_id}/features` - List features for a site

### Predictions
- `POST /api/sites/{site_id}/predict` - Create prediction for a site
- `GET /api/sites/{site_id}/predictions` - List predictions for a site

### Water Towers
- `GET /api/water-towers` - List Kenya's 18 gazetted water towers
- `GET /api/water-towers/{water_tower_id}` - Get water tower by ID

### Nurseries
- `GET /api/nurseries` - List tree nurseries
- `GET /api/nurseries/{nursery_id}` - Get nursery by ID

### Biodiversity
- `GET /api/biodiversity?site_id=...` - Get biodiversity data for a site
- `GET /api/biodiversity?water_tower_id=...` - Get biodiversity data for a water tower

## Data Services

The API integrates with multiple environmental data sources:

1. **NDVI** - Vegetation health via Sentinel-2 (falls back to estimation)
2. **Soil** - SoilGrids REST API for soil properties
3. **Rainfall** - CHIRPS data (falls back to estimation)
4. **Climate** - NASA POWER API for temperature and solar radiation
5. **Weather** - Open-Meteo for current conditions

All services include fallback mechanisms and mark data as `partial: true` when using fixtures.

## ML Pipeline

The health score computation uses a deterministic rule-based model:

- **NDVI** (30%) - Vegetation density
- **Rainfall** (25%) - Precipitation patterns
- **Soil Organic Carbon** (15%) - Soil health
- **pH** (10%) - Soil acidity
- **Temperature** (10%) - Climate suitability
- **Solar Radiation** (10%) - Energy availability

Score range: [0, 1] where 1 is optimal ecosystem health.

## Testing

Run smoke tests:
```bash
pip install -r test-requirements.txt
pytest tests/test_smoke.py -v
```

## Database Schema (MongoDB collections)

- **sites** - Monitoring sites with GeoJSON geometry and metadata
- **site_features** - Environmental/climate features for each site
- **site_predictions** - Health score predictions and reasoning
- **water_towers** - Kenya's 18 gazetted water towers (GeoJSON)
- **nurseries** - Tree nurseries aligned to water towers
- **biodiversity_records** - Species observations grouped by site/water tower

## Development

The project follows these conventions:

- All models import from `app.models.base`
- GeoJSON for geometry input/output
- Dates in YYYY-MM-DD format
- UUID primary keys
- `partial: bool` flag for incomplete data
- No synthetic/random data generation

## License

MIT
### Earth Engine + TorchGeo setup
Install the supporting dependencies:
```bash
pip install earthengine-api torch torchvision numpy google-auth google-auth-oauthlib google-api-python-client
```

Set these env vars before running the backend:
```
EE_SERVICE_ACCOUNT_EMAIL=gee-ndvi-sa@tower-guard-479011.iam.gserviceaccount.com
EE_SERVICE_ACCOUNT_JSON=backend/credentials/ee_service_account.json
ENABLE_DRIVE_UPLOAD=false
DRIVE_FOLDER_ID=<optional Drive folder id>
DRIVE_CLIENT_SECRET_JSON=backend/credentials/drive_client_secret.json
# To skip NDVI when you don't have the key yet:
# EE_DISABLE=true
```
Drop the service account key JSON at `backend/credentials/ee_service_account.json`. If you later enable Drive uploads, place the OAuth client secret at `backend/credentials/drive_client_secret.json`; the flow will open your browser once to get a token.

### NDVI sanity check
Run this snippet to verify Earth Engine returns stats after you place the JSON and export credentials:
```bash
python - <<'PY'
from app.ml.gee_ndvi import compute_ndvi_stats
print(compute_ndvi_stats(lat=0.2, lon=37.3, start_date="2025-10-01", end_date="2025-10-10"))
PY
```

If all credentials are in place the call will succeed without a browser prompt and return the NDVI mean/std tuple.

### NASA POWER and SoilGrids notes
- NASA POWER climatology now hits `https://power.larc.nasa.gov/api/temporal/climatology/point` with the required parameters (`community=AG`, `start=1981`, `end=2010`). Set `NASA_POWER_API_KEY` if you have a key; otherwise it uses `DEMO_KEY`.
- SoilGrids is queried from `https://rest.isric.org/soilgrids/v2.0/` (the old `rest.soilgrids.org` DNS no longer resolves).
