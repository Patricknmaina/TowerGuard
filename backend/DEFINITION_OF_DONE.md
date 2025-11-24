# Definition of Done Checklist

## ✅ Project Structure

- [x] `backend/app/api/` - All API routers
- [x] `backend/app/core/` - Loaders and config
- [x] `backend/app/db/` - Database session management
- [x] `backend/app/ml/` - Feature pipeline and model
- [x] `backend/app/schemas/` - All Pydantic schemas
- [x] `backend/app/services/` - All data services
- [x] `backend/data/water_towers/` - 18 water towers GeoJSON
- [x] `backend/data/nurseries/` - Nurseries CSV
- [x] `backend/data/biodiversity/` - Biodiversity CSVs
- [x] `backend/data/fixtures/` - Fallback fixtures
- [x] `backend/tests/` - Smoke tests

## ✅ Dependencies

- [x] fastapi==0.115.0
- [x] uvicorn[standard]==0.30.6
- [x] pymongo==4.4.1
- [x] mongomock==4.2.0
- [x] shapely==2.0.6
- [x] pydantic==2.9.2
- [x] rasterio==1.4.2
- [x] torchgeo==0.6.0
- [x] xarray==2024.10.0
- [x] netCDF4==1.7.2
- [x] httpx==0.27.2
- [x] pandas==2.2.3

## ✅ Persistence Layer

- [x] `app/db/session.py` uses `MongoClient` + env-configured database
- [x] `app/core/loaders.py` seeds water towers / nurseries / biodiversity collections
- [x] Collections: `sites`, `site_features`, `site_predictions`, `water_towers`, `nurseries`, `biodiversity_records`
- [x] `features`/`predictions` routers store Mongo documents with timestamps + partial flag

## ✅ Pydantic Schemas

- [x] `site.py` - SiteCreate, SiteRead with GeoJSON
- [x] `features.py` - FeatureRequestBody, SiteFeatureRead
- [x] `predictions.py` - PredictionRequestBody, SitePredictionRead
- [x] `water_towers.py` - WaterTowerRead with GeoJSON
- [x] `nurseries.py` - NurseryRead
- [x] `biodiversity.py` - BiodiversitySpeciesRead (aggregated), BiodiversityRecordRead
- [x] All dates as "YYYY-MM-DD"
- [x] partial: bool in feature/prediction responses

## ✅ Data Services

- [x] `http.py` - HTTPService with timeout + retry (3 attempts)
- [x] `ndvi_service.py` - Sentinel-2 estimation with partial flag
- [x] `soil_service.py` - SoilGrids API + fallback to fixture
- [x] `rainfall_service.py` - CHIRPS estimation with partial flag
- [x] `climate_service.py` - NASA POWER API + fallback to fixture
- [x] `weather_service.py` - Open-Meteo API + fallback to fixture
- [x] All services return dict with partial: bool
- [x] No synthetic/random values, only real data or fallback
- [x] Fixtures in `backend/data/fixtures/`

## ✅ ML Pipeline

- [x] `feature_pipeline.py` - extract_features_for_site() calls all services
- [x] `feature_pipeline.py` - build_feature_vector_from_site_features() flattens to dict
- [x] `model.py` - compute_health_score() deterministic rule-based (NO random)
- [x] `model.py` - create_prediction_for_site_features() saves prediction
- [x] Health score weights: NDVI (30%), Rainfall (25%), SOC (15%), pH (10%), Temp (10%), Solar (10%)
- [x] Score clamped to [0, 1]
- [x] Partial flag propagates from services to features to predictions

## ✅ Data Loaders

- [x] `loaders.py` - load_water_towers() from GeoJSON (18 towers)
- [x] `loaders.py` - load_nurseries() from CSV with water_tower_id FK
- [x] `loaders.py` - load_biodiversity_records() from CSVs with local names join
- [x] No data fabrication - only loads what's in files
- [x] Missing local names remain null (not invented)
- [x] Upsert by name for water towers

## ✅ API Routers

- [x] `health.py` - GET /api/health returns {status: ok}
- [x] `sites.py` - GET /api/sites, POST /api/sites, GET /api/sites/{id}, DELETE /api/sites/{id}
- [x] `features.py` - POST /api/sites/{id}/features, GET /api/sites/{id}/features
- [x] `predictions.py` - POST /api/sites/{id}/predict, GET /api/sites/{id}/predictions
- [x] `water_towers.py` - GET /api/water-towers, GET /api/water-towers/{id}
- [x] `nurseries.py` - GET /api/nurseries, GET /api/nurseries/{id}
- [x] `biodiversity.py` - GET /api/biodiversity?site_id=... OR water_tower_id=...
- [x] All endpoints use correct schemas
- [x] GeoJSON for geometry input/output
- [x] Predictions use latest features if features_id not specified

## ✅ Application Wiring

- [x] `main.py` - FastAPI app with lifespan events
- [x] CORS middleware configured
- [x] All routers included under /api prefix
- [x] Database tables created on startup
- [x] Canonical datasets loaded on startup if empty
- [x] Root endpoint returns API info

## ✅ Canonical Datasets

- [x] kenya_water_towers_18.geojson - 18 gazetted water towers with real names
- [x] nurseries_kenya.csv - Nursery locations with water_tower reference
- [x] biodiversity_points.csv - Species observations
- [x] species_local_names.csv - Scientific + local + English names mapping
- [x] Water towers not hardcoded, loaded from GeoJSON
- [x] Biodiversity returns scientific + local names where available

## ✅ Tests

- [x] `test_smoke.py` exercises health check + site CRUD
- [x] `test_smoke.py` verifies water tower, nursery, and biodiversity endpoints
- [x] Tests run against mongomock-powered MongoDB instance
- [x] Test requirements in `test-requirements.txt`

## ✅ Documentation

- [x] README.md - Project overview, structure, API endpoints, setup
- [x] QUICKSTART.md - Step-by-step setup guide
- [x] .env.example - Example environment variables
- [x] requirements.txt - Pinned dependencies
- [x] .gitignore - Proper exclusions
- [x] `app.core.loaders.load_all_data` - Seeds canonical Mongo datasets

## ✅ Quality Checks

- [x] No endpoint invents values
- [x] External failure → partial: true (not fake data)
- [x] Feature extraction works for any created site
- [x] All Mongo documents store UUID primary `id` values
- [x] All documents carry `created_at`/`updated_at` timestamps
- [x] Geometry stored as GeoJSON (no PostGIS dependency)
- [x] No random numbers in health score computation

## 🎯 Definition of Done Summary

**Complete** when:

1. ✅ All endpoints exist and respond with correct schema
2. ✅ Water tower list returns the 18 gazetted towers from GeoJSON (not hardcoded)
3. ✅ Biodiversity endpoint returns scientific + local names where available
4. ✅ Feature extraction + prediction works for any created site
5. ✅ No random numbers / synthetic values anywhere
6. ✅ External failure → partial: true not fake data

## Status: ✅ COMPLETE

All requirements met. Project is ready for deployment and testing.
