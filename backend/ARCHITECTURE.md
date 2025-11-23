# System Architecture Overview

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│                     (Not included in this PR)                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP/REST
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Application                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    API Routers (/api)                       │ │
│  │  • Health Check     • Sites          • Features            │ │
│  │  • Predictions      • Water Towers   • Nurseries           │ │
│  │  • Biodiversity                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────┐  ┌──────────────────────────────────────┐ │
│  │  ML Pipeline    │  │       Data Services                   │ │
│  │                 │  │  • NDVI (Sentinel-2)                  │ │
│  │  • Feature      │  │  • Soil (SoilGrids API)               │ │
│  │    Extraction   │  │  • Rainfall (CHIRPS)                  │ │
│  │  • Health Score │  │  • Climate (NASA POWER)               │ │
│  │    Computation  │  │  • Weather (Open-Meteo)               │ │
│  │    (Rule-based) │  │                                        │ │
│  └─────────────────┘  └──────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              MongoDB Collections (Document Store)            │ │
│  │  • sites            • site_features    • site_predictions  │ │
│  │  • water_towers     • nurseries        • biodiversity_records│ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                    MongoDB Database                             │
│  • GeoJSON geometry storage                                     │
│  • Time-series features                                         │
│  • Predictions history                                          │
│  • Canonical datasets (water towers, nurseries, biodiversity) │
└─────────────────────────────────────────────────────────────────┘

External Data Sources (with fallbacks):
  • Sentinel-2 → NDVI calculation
  • SoilGrids REST API → Soil properties
  • CHIRPS NetCDF → Rainfall data
  • NASA POWER API → Climate data
  • Open-Meteo API → Current weather
```

## 🔄 Data Flow

### 1. Site Creation
```
User → POST /api/sites
  → Validate GeoJSON geometry
  → Store GeoJSON in MongoDB
  → Return site with UUID
```

### 2. Feature Extraction
```
User → POST /api/sites/{id}/features
  → Load site geometry from DB
  → Compute centroid for point queries
  → Call data services in parallel:
      ├─ NDVI Service (satellite imagery)
      ├─ Soil Service (SoilGrids API)
      ├─ Rainfall Service (CHIRPS data)
      ├─ Climate Service (NASA POWER)
      └─ Weather Service (Open-Meteo)
  → Merge all results
  → Flag as partial if any service failed
  → Store in site_features table
  → Return feature vector
```

### 3. Health Score Prediction
```
User → POST /api/sites/{id}/predict
  → Load latest features (or use specified features_id)
  → Build feature vector (12 numeric values)
  → Compute health score:
      score = NDVI(30%) + Rainfall(25%) + SOC(15%) +
              pH(10%) + Temp(10%) + Solar(10%)
  → Normalize to [0, 1]
  → Store prediction in site_predictions table
  → Return score with metadata
```

### 4. Query Canonical Data
```
User → GET /api/water-towers
  → Query MongoDB collection
  → Return 18 gazetted water towers (GeoJSON already stored)

User → GET /api/biodiversity?site_id=...
  → Query biodiversity_records by site
  → Join with species names
  → Aggregate by scientific name
  → Return species with observation records
```

## 📊 Database Schema (MongoDB Collections)

The application uses MongoDB collections with the following document structure:

### Collections

**sites** - Monitoring sites
```json
{
  "_id": "UUID",
  "name": "string",
  "description": "string",
  "geometry": { GeoJSON },
  "country": "Kenya",
  "created_at": "ISO datetime",
  "updated_at": "ISO datetime"
}
```

**site_features** - Environmental data
```json
{
  "_id": "UUID",
  "site_id": "UUID",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "ndvi_mean": float,
  "ndvi_std": float,
  "rainfall_total_mm": float,
  "rainfall_mean_mm_per_day": float,
  "tmin_c": float,
  "tmax_c": float,
  "solar_radiation": float,
  "soc": float,
  "sand": float,
  "clay": float,
  "silt": float,
  "ph": float,
  "source_breakdown": { object },
  "partial": boolean,
  "created_at": "ISO datetime",
  "updated_at": "ISO datetime"
}
```

**site_predictions** - Health scores
```json
{
  "_id": "UUID",
  "site_id": "UUID",
  "features_id": "UUID",
  "score": float,
  "model_version": "string",
  "partial": boolean,
  "created_at": "ISO datetime",
  "updated_at": "ISO datetime"
}
```

**water_towers** - Kenya's gazetted towers
```json
{
  "_id": "UUID",
  "name": "string",
  "counties": [ "string" ],
  "geometry": { GeoJSON },
  "area_ha": float,
  "description": "string",
  "metadata": { object },
  "created_at": "ISO datetime",
  "updated_at": "ISO datetime"
}
```

**nurseries** - Tree nurseries
```json
{
  "_id": "UUID",
  "name": "string",
  "lat": float,
  "lon": float,
  "water_tower_id": "UUID",
  "metadata": { object },
  "created_at": "ISO datetime",
  "updated_at": "ISO datetime"
}
```

**biodiversity_records** - Species observations
```json
{
  "_id": "UUID",
  "scientific_name": "string",
  "local_name": "string",
  "english_common_name": "string",
  "lat": float,
  "lon": float,
  "site_id": "UUID",
  "water_tower_id": "UUID",
  "observed_at": "YYYY-MM-DD",
  "source": "string",
  "created_at": "ISO datetime",
  "updated_at": "ISO datetime"
}
```

## 🎯 API Endpoints Summary

### Core Operations
- `GET /api/health` - System health check
- `GET /` - API information

### Site Management
- `GET /api/sites` - List all sites (paginated)
- `POST /api/sites` - Create new site with geometry
- `GET /api/sites/{id}` - Get site details
- `DELETE /api/sites/{id}` - Delete site (dev only)

### Feature Extraction
- `POST /api/sites/{id}/features` - Extract environmental features
- `GET /api/sites/{id}/features` - List feature history

### Health Predictions
- `POST /api/sites/{id}/predict` - Generate health score
- `GET /api/sites/{id}/predictions` - List prediction history

### Reference Data
- `GET /api/water-towers` - List 18 gazetted water towers
- `GET /api/water-towers/{id}` - Get water tower details
- `GET /api/nurseries` - List tree nurseries
- `GET /api/nurseries/{id}` - Get nursery details
- `GET /api/biodiversity?site_id=...` - Get species by site
- `GET /api/biodiversity?water_tower_id=...` - Get species by tower

## 🔧 Technology Stack

### Backend Framework
- **FastAPI** - Modern, fast web framework
- **Uvicorn** - ASGI server
- **Pydantic v2** - Data validation

### Database
- **MongoDB 6+** - Document database
- **PyMongo** - MongoDB driver
- **GeoJSON** - Native spatial data format

### Geospatial
- **Shapely** - Geometry manipulation
- **Rasterio** - Raster data processing
- **TorchGeo** - Satellite imagery processing

### Data Processing
- **Pandas** - Data manipulation
- **NumPy** - Numerical computing
- **xarray** - Multi-dimensional arrays
- **netCDF4** - Climate data files

### External APIs
- **httpx** - Async HTTP client
- **SoilGrids** - Soil properties
- **NASA POWER** - Climate data
- **Open-Meteo** - Weather data

## 🚀 Deployment Options

### 1. Traditional Server
- Systemd service
- Nginx reverse proxy
- Let's Encrypt SSL
- MongoDB (local or remote cluster)

### 2. Docker
- Docker Compose
- MongoDB container
- API container
- Volume persistence

### 3. Cloud (Future)
- AWS/GCP/Azure
- Managed MongoDB (Atlas, DocumentDB, etc.)
- Container orchestration (ECS/GKE/AKS)
- CDN for static assets

## 📈 Performance Characteristics

### Response Times (expected)
- Health check: < 10ms
- List sites: < 100ms
- Create site: < 200ms
- Feature extraction: 2-10s (depends on external APIs)
- Prediction: < 100ms (cached features)
- List water towers: < 100ms

### Scalability
- **Horizontal**: Multiple API instances behind load balancer
- **Vertical**: Increase DB and API resources
- **Caching**: Redis for frequently accessed data
- **CDN**: Static assets and GeoJSON

## 🔐 Security Features

- CORS configuration
- Input validation (Pydantic)
- NoSQL injection prevention (PyMongo parameterization)
- Geometry validation (Shapely)
- Environment-based configuration
- Secure database credentials

## 📊 Monitoring & Observability

### Logging
- Application logs (stdout/stderr)
- Systemd journal
- Nginx access/error logs
- MongoDB logs

### Health Checks
- `/api/health` endpoint
- Database connectivity check
- External service availability

### Metrics (Future)
- Request count/latency
- Database query performance
- Feature extraction success rate
- Prediction accuracy tracking

## 🔄 Data Lifecycle

### Initial Load (Startup)
1. Connect to MongoDB
2. Load 18 water towers from GeoJSON into `water_towers` collection
3. Load nurseries from CSV into `nurseries` collection
4. Load biodiversity records from CSV into `biodiversity_records` collection
5. Join species local names during load

### Runtime Operations
1. Users create sites
2. Extract features on-demand
3. Generate predictions from features
4. Query historical data
5. Aggregate biodiversity by species

### Maintenance
- Database backups (daily)
- Log rotation
- Update external data sources
- Retrain ML model (future)
- Archive old predictions

---

**System Status**: ✅ Fully Implemented
**Test Coverage**: Smoke tests for critical paths
**Documentation**: Complete (README, QUICKSTART, DEPLOYMENT)
**Ready For**: Integration with frontend, production deployment
