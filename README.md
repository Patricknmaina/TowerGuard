# TowerGuard

**Real-time environmental monitoring and conservation analytics for Kenya's 18 gazetted water towers**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green.svg)](https://fastapi.tiangolo.com/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Data Sources](#data-sources)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## 🌍 Overview

TowerGuard is an advanced environmental monitoring platform designed to track, analyze, and predict the ecological health of Kenya's 18 legally protected water towers. By integrating satellite imagery, climate data, soil analytics, and biodiversity records, TowerGuard provides actionable insights for conservationists, policymakers, and community stakeholders.

The platform combines real-time data acquisition from multiple authoritative sources with machine learning-based health scoring to deliver a comprehensive view of ecosystem vitality across Kenya's critical water catchment areas.

### Mission

To empower evidence-based conservation decisions through accessible, accurate, and timely environmental data, honoring the legacy of Nobel Laureate Prof. Wangaari Maathai and supporting Kenya's commitment to ecosystem restoration.

---

## Problem It Solves

Managing Kenya’s 18 gazetted water towers is hard when satellite, climate, soil, and biodiversity data sit in separate silos. TowerGuard unifies these signals into a single, trusted health view so teams can spot change early, act faster, and justify interventions with evidence.

## What You Can Use It For

- See the latest health scores (0–1) per tower/site using combined NDVI, rainfall, soil, temperature, and solar data with clear `partial` flags when inputs are incomplete.
- Refresh the last 7/14/30 days of data to monitor trends, map hotspots, and target patrols or restoration where it matters most.
- Compare towers side by side to direct funding and policy toward the highest-need areas.
- Find nearby nurseries with contact details, align planting to observed gaps, and track community-led restoration impact.
- Pull structured features and predictions via the API, or export GIS-ready data without manual wrangling.

## Challenges We Solved

- Satellite access friction: moved to a simple service-account key flow and added an `EE_DISABLE` switch so the app runs even without NDVI credentials.
- Soil data endpoint drift: updated to the current SoilGrids API and added backups so soil fetches don’t break the pipeline.
- Finicky tower polygons: cleaned coordinates and seeded sample sites to keep maps and APIs stable.
- Flaky external calls: added timeouts, light caching, and fallbacks so refreshes succeed even when upstream services hiccup.
- Score consistency: locked deterministic weights and clamped outputs so health scores stay repeatable across runs.

## Technologies

- Backend: FastAPI (Python 3.11), Uvicorn, Pydantic; MongoDB for storage.
- Data/ML: Pandas, NumPy, Shapely, Rasterio, PyTorch/TorchGeo, httpx.
- Frontend: React + TypeScript with Vite, React Router, TanStack Query, Tailwind CSS.
- Visualization: Leaflet/React-Leaflet for maps; Recharts for charts.
- External data: Google Earth Engine (Sentinel-2 NDVI), SoilGrids, NASA POWER, CHIRPS, Open-Meteo.

---

## ✨ Features

### 🛰️ Environmental Monitoring
- **Real-time NDVI Analysis**: Vegetation health monitoring using Sentinel-2 satellite imagery via Google Earth Engine
- **Soil Analytics**: Comprehensive soil property assessment (texture, organic carbon, pH) from SoilGrids v2.0 API
- **Climate Integration**: Temperature, rainfall, and solar radiation data from NASA POWER and CHIRPS datasets
- **Weather Tracking**: Current conditions and forecasts via Open-Meteo

### 📊 Health Scoring System
- **Multi-factor Analysis**: Weighted scoring algorithm incorporating:
  - NDVI (30%) - Vegetation density and health
  - Rainfall (25%) - Precipitation patterns
  - Soil Organic Carbon (15%) - Soil fertility
  - pH (10%) - Soil acidity balance
  - Temperature (10%) - Climate suitability
  - Solar Radiation (10%) - Energy availability
- **Temporal Flexibility**: Configurable analysis periods (7, 14, or 30 days)
- **Trend Visualization**: Interactive charts showing historical health trends

### 🌱 Conservation Resources
- **Nursery Directory**: 20+ tree nurseries with contact information (phone, email, address)
- **Species Tracking**: Biodiversity records linked to specific water towers and monitoring sites
- **One-click Contact**: Direct email and phone integration for nursery outreach

### 🗺️ Interactive Mapping
- **Water Tower Visualization**: Complete coverage of all 18 gazetted water towers
- **Geospatial Analysis**: GeoJSON-based boundary mapping with coordinate precision
- **Location-aware Search**: Find nurseries and monitoring sites by water tower region

### 📈 Data Management
- **Bulk Refresh**: Update all 18 towers with latest environmental data in one operation
- **Intelligent Caching**: Minimize API calls while ensuring data freshness
- **Export Ready**: Structured data suitable for GIS tools and external analysis

---

## 🏗️ Architecture

TowerGuard follows a modern three-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐   │
│  │ Landing  │ Water    │ Tower    │ Nursery  │ Story    │   │
│  │ Page     │ Towers   │ Details  │ Pages    │ Page     │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘   │
│         │                                                     │
│         ▼ React Query + Axios                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/JSON API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Routes  │  Services  │  ML Pipeline  │  Core   │   │
│  └──────────────────────────────────────────────────────┘   │
│         │                                                     │
│         ▼                                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              MongoDB (Collections)                    │   │
│  │  • water_towers  • nurseries  • biodiversity_records │   │
│  │  • sites  • site_features  • site_predictions        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ External APIs
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Data Sources                     │
│  • Google Earth Engine (Sentinel-2 NDVI)                    │
│  • SoilGrids v2.0 (Soil properties)                         │
│  • NASA POWER (Climate data)                                │
│  • CHIRPS (Rainfall data)                                   │
│  • Open-Meteo (Weather forecasts)                           │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Frontend Request**: User triggers data refresh with selected time period (7/14/30 days)
2. **API Orchestration**: FastAPI backend coordinates parallel requests to external data sources
3. **Data Acquisition**: Services fetch NDVI, soil, climate, and weather data with intelligent caching
4. **Processing**: ML pipeline computes health scores using weighted multi-factor algorithm
5. **Storage**: MongoDB stores enriched tower data, features, and predictions
6. **Visualization**: Frontend displays interactive maps, charts, and analytics

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18.3 with TypeScript
- **Build Tool**: Vite 5.4
- **State Management**: TanStack Query (React Query) 5.56
- **Routing**: React Router 6.27
- **Styling**: Tailwind CSS 3.4
- **Mapping**: Leaflet 1.9 + React Leaflet 4.2
- **Charts**: Recharts 2.12
- **Icons**: Lucide React 0.468
- **Geospatial**: Turf.js 6.5

### Backend
- **Framework**: FastAPI 0.115
- **Server**: Uvicorn 0.30
- **Database**: MongoDB 4.4 (via PyMongo)
- **Data Processing**: Pandas 2.2, NumPy 1.26
- **Geospatial**: Shapely 2.0, Rasterio 1.4
- **Machine Learning**: PyTorch 2.5, TorchGeo 0.6
- **Climate Data**: xarray 2024.10, netCDF4 1.7
- **HTTP Client**: httpx 0.27
- **Validation**: Pydantic 2.9

### External APIs
- **Google Earth Engine**: Sentinel-2 satellite imagery (service account auth)
- **SoilGrids v2.0**: Global soil property database (REST API)
- **NASA POWER**: Solar and meteorological data (climatology endpoint)
- **CHIRPS**: Climate Hazards Group InfraRed Precipitation with Station data
- **Open-Meteo**: Weather forecasts and current conditions

---

## 🚀 Getting Started

### Prerequisites

- **Python**: 3.11 or higher
- **Node.js**: 18.x or higher
- **MongoDB**: 6.0 or higher (local or hosted)
- **Git**: For cloning the repository
- **Google Earth Engine Service Account**: For NDVI data (optional but recommended)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/Patricknmaina/TowerGuard.git
cd TowerGuard
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend/towerguard-frontend

# Install dependencies
npm install
```

### Configuration

#### Backend Environment Variables

Create a `.env` file in the `backend/backend/` directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=towerguard

# Google Earth Engine (for NDVI)
EE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
EE_SERVICE_ACCOUNT_JSON=backend/backend/credentials/ee_service_account.json
EE_DISABLE=false  # Set to true to skip NDVI computation

# NASA POWER API
NASA_POWER_API_KEY=DEMO_KEY  # Replace with your key if available

# Optional: Google Drive Upload
ENABLE_DRIVE_UPLOAD=false
DRIVE_FOLDER_ID=your-folder-id
DRIVE_CLIENT_SECRET_JSON=backend/backend/credentials/drive_client_secret.json

# Server Configuration
HOST=0.0.0.0
PORT=8080
```

#### Google Earth Engine Setup

1. Create a Google Cloud project
2. Enable Earth Engine API
3. Create a service account with Earth Engine permissions
4. Download the service account JSON key
5. Place the key file at `backend/backend/credentials/ee_service_account.json`

#### Database Initialization

```bash
# Start MongoDB (if running locally)
# On Windows: net start MongoDB
# On macOS: brew services start mongodb-community
# On Linux: sudo systemctl start mongod

# Load initial data
cd backend/backend
python -c "
from app.db.session import get_db
from app.core.loaders import load_all_data
db = next(get_db())
load_all_data(db)
"

# Seed monitoring sites
python seed_sites.py
```

This will populate MongoDB with:
- 18 water towers (GeoJSON boundaries)
- 20+ tree nurseries with contact information
- Biodiversity records
- Monitoring sites for each water tower

---

## 💻 Usage

### Running the Application

#### Start Backend Server

```bash
cd backend/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

Backend will be available at:
- **API**: http://localhost:8080
- **Swagger Docs**: http://localhost:8080/docs
- **ReDoc**: http://localhost:8080/redoc

#### Start Frontend Development Server

```bash
cd frontend/towerguard-frontend
npm run dev
```

Frontend will be available at:
- **App**: http://localhost:5173

### Key User Workflows

#### 1. View Water Tower Health

1. Navigate to **Water Towers Directory**
2. Browse the grid of all 18 water towers
3. View health scores, temperature ranges, rainfall, soil class, and biodiversity counts
4. Click a tower card to see detailed analytics

#### 2. Refresh Environmental Data

1. Select time period from dropdown (7, 14, or 30 days)
2. Click **"Refresh data (last X days)"** button
3. Wait for data enrichment (typically 30-60 seconds for all towers)
4. View updated health scores and metrics

#### 3. Find Tree Nurseries

1. Navigate to a specific water tower detail page
2. Click **"View Nurseries"** or navigate to nurseries section
3. Browse nurseries in the tower's region
4. Click **email** or **phone** buttons to contact nurseries directly

#### 4. Explore Biodiversity

1. Open a water tower detail page
2. Scroll to biodiversity section
3. View species records with scientific names and observation dates
4. Filter by site or tower

---

## 📁 Project Structure

```
TowerGuard/
├── backend/
│   └── backend/
│       ├── app/
│   │   ├── api/              # FastAPI route handlers
│   │   │   ├── routes/
│   │   │   │   ├── biodiversity.py
│   │   │   │   ├── features.py
│   │   │   │   ├── nurseries.py
│   │   │   │   ├── predictions.py
│   │   │   │   ├── sites.py
│   │   │   │   └── water_towers.py
│   │   │   └── deps.py       # Dependency injection
│   │   ├── core/             # Core utilities
│   │   │   └── loaders.py    # Data loading logic
│   │   ├── db/               # Database configuration
│   │   │   └── session.py    # MongoDB session management
│   │   ├── ml/               # Machine learning pipeline
│   │   │   ├── feature_pipeline.py
│   │   │   ├── gee_ndvi.py   # Google Earth Engine integration
│   │   │   ├── model.py      # Health score computation
│   │   │   └── environmental_api_client.py  # External API clients
│   │   ├── schemas/          # Pydantic models
│   │   │   ├── biodiversity.py
│   │   │   ├── feature.py
│   │   │   ├── nursery.py
│   │   │   ├── prediction.py
│   │   │   ├── site.py
│   │   │   └── water_tower.py
│   │   ├── services/         # Business logic
│   │   │   └── tower_enrichment_service.py
│   │   └── main.py           # FastAPI application entry point
│   ├── cache/                # API response cache
│   ├── credentials/          # Service account keys (gitignored)
│   ├── data/                 # Static datasets
│   │   ├── water_towers/     # GeoJSON boundaries
│   │   ├── nurseries/        # CSV nursery data
│   │   ├── biodiversity/     # CSV species records
│   │   └── fixtures/         # Fallback data
│   ├── tests/                # Unit and integration tests
│       ├── requirements.txt      # Python dependencies
│       ├── .env.example          # Environment template
│       └── README.md             # Backend documentation
├── frontend/
│   └── towerguard-frontend/
│       ├── public/               # Static assets
│   │   └── photo-album/      # Conservation images
│   ├── src/
│   │   ├── api/              # API client
│   │   │   ├── client.ts
│   │   │   └── types.ts
│   │   ├── components/       # React components
│   │   │   ├── layout/
│   │   │   │   └── AppLayout.tsx
│   │   │   └── shared/
│   │   │       └── DataState.tsx
│       ├── hooks/            # Custom React hooks
│       │   ├── useBiodiversityByTower.tsx
│       │   ├── useNurseries.tsx
│       │   ├── useSites.tsx
│       │   └── useWaterTowers.tsx
│       ├── lib/              # Utilities
│       │   └── soilLabel.ts  # USDA soil classification
│       ├── pages/            # Route components
│       │   ├── LandingPage.tsx
│       │   ├── StoryPage.tsx
│       │   ├── WaterTowersDirectory.tsx
│       │   ├── WaterTowerDetailPage.tsx
│       │   └── TowerNurseriesPage.tsx
│       ├── App.tsx
│       ├── main.tsx
│       └── index.css
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── tailwind.config.js
├── docs/                     # Additional documentation
├── LICENSE
└── README.md                 # This file
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:8080/api
```

### Core Endpoints

#### Water Towers

```http
GET /water-towers
```
List all 18 gazetted water towers with metadata and health metrics.

**Response**: Array of water tower objects with GeoJSON geometry, name, area, health score, NDVI stats, climate data, and soil properties.

```http
GET /water-towers/{tower_id}
```
Get detailed information for a specific water tower by ID.

```http
POST /water-towers/enrich?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
```
Trigger bulk enrichment of all water towers with fresh environmental data.

#### Nurseries

```http
GET /nurseries
```
List all tree nurseries with contact information.

**Optional Query Parameters**:
- `water_tower_id`: Filter nurseries by water tower association

```http
GET /nurseries/{nursery_id}
```
Get detailed nursery information including species capacity and contact details.

#### Biodiversity

```http
GET /biodiversity?water_tower_id={tower_id}
```
Get biodiversity records for a specific water tower.

```http
GET /biodiversity?site_id={site_id}
```
Get biodiversity records for a specific monitoring site.

#### Sites

```http
GET /sites
```
List all monitoring sites.

```http
POST /sites
```
Create a new monitoring site (admin function).

```http
GET /sites/{site_id}
```
Get site details with coordinates and metadata.

For complete API documentation with request/response schemas, visit the Swagger UI at `http://localhost:8080/docs` after starting the backend server.

---

## 🌐 Data Sources

TowerGuard integrates data from multiple authoritative environmental databases:

### Satellite Imagery
- **Google Earth Engine**: Access to Sentinel-2 Level-2A imagery for NDVI computation
- **Resolution**: 10-20m spatial resolution
- **Temporal Coverage**: 2017-present
- **Update Frequency**: 2-5 days (depending on cloud cover)

### Soil Data
- **SoilGrids v2.0**: Global soil information system
- **Provider**: ISRIC World Soil Information
- **Properties**: Sand, clay, silt percentages, organic carbon, pH, bulk density
- **Resolution**: 250m spatial resolution
- **Depth Layers**: 0-5cm, 5-15cm, 15-30cm, 30-60cm, 60-100cm, 100-200cm

### Climate Data
- **NASA POWER**: Prediction Of Worldwide Energy Resources
- **Parameters**: Temperature (min/max/mean), solar radiation, precipitation
- **Temporal Coverage**: 1981-2010 climatology + near real-time
- **Resolution**: 0.5° x 0.5° (~50km)

### Rainfall
- **CHIRPS**: Climate Hazards Group InfraRed Precipitation with Station data
- **Provider**: UC Santa Barbara Climate Hazards Center
- **Temporal Coverage**: 1981-present
- **Resolution**: 0.05° (~5km)

### Weather Forecasts
- **Open-Meteo**: Open weather data API
- **Coverage**: Current conditions and 7-day forecasts
- **Update Frequency**: Hourly

---

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### How to Contribute

1. **Fork the Repository**
   ```bash
   git clone https://github.com/your-username/TowerGuard.git
   cd TowerGuard
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Write clean, documented code
   - Follow existing code style and conventions
   - Add tests for new features
   - Update documentation as needed

4. **Test Your Changes**
   ```bash
   # Backend tests
   cd backend/backend
   pytest tests/ -v
   
   # Frontend tests (if applicable)
   cd frontend/towerguard-frontend
   npm test
   ```

5. **Commit and Push**
   ```bash
   git add .
   git commit -m "Add: Brief description of your changes"
   git push origin feature/your-feature-name
   ```

6. **Submit a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your feature branch
   - Provide a clear description of changes
   - Reference any related issues

### Development Guidelines

- **Code Style**: Follow PEP 8 for Python, ESLint rules for TypeScript
- **Commits**: Use conventional commit messages (feat:, fix:, docs:, etc.)
- **Testing**: Maintain or improve test coverage
- **Documentation**: Update README and inline comments for significant changes

### Reporting Issues

Found a bug or have a feature request? Please open an issue with:
- Clear title and description
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Environment details (OS, Python/Node versions)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 TowerGuard Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

### Inspiration
This project honors **Professor Wangaari Maathai** (1940-2011), Nobel Peace Prize laureate and founder of the Green Belt Movement. Her vision of community-led environmental restoration continues to inspire conservation efforts across Kenya and beyond.

### Data Providers
- **Google Earth Engine**: Satellite imagery access
- **ISRIC World Soil Information**: SoilGrids global soil database
- **NASA**: POWER meteorological data
- **UC Santa Barbara Climate Hazards Center**: CHIRPS rainfall data
- **Kenya Forest Service (KFS)**: Water tower boundary data and nursery contacts
- **Green Belt Movement (GBM)**: Community nursery information

### Technology Partners
- **FastAPI**: Modern Python web framework
- **React**: UI component library
- **MongoDB**: Flexible document database
- **Leaflet**: Interactive mapping library

### Open Source Community
Thank you to all contributors and maintainers of the open-source libraries that make TowerGuard possible.

---

## 📞 Contact & Support

- **Repository**: [https://github.com/Patricknmaina/TowerGuard](https://github.com/Patricknmaina/TowerGuard)
- **Issues**: [https://github.com/Patricknmaina/TowerGuard/issues](https://github.com/Patricknmaina/TowerGuard/issues)
- **Documentation**: See `/docs` folder for additional technical documentation

---

## 🔄 Roadmap

### Current Version (v0.1.0)
- ✅ Core environmental monitoring
- ✅ Health score computation
- ✅ Nursery directory with contact integration
- ✅ Real-time NDVI via Google Earth Engine
- ✅ Interactive water tower mapping

### Planned Features
- 🔄 Historical trend analysis and forecasting
- 🔄 Mobile application (iOS/Android)
- 🔄 Community reporting portal
- 🔄 Automated alerts for ecosystem threats
- 🔄 Multi-language support (Swahili, English)
- 🔄 Integration with national forest monitoring systems
- 🔄 Export functionality for GIS tools (Shapefile, KML)

---

<div align="center">

**Built with 💚 for Kenya's water towers and the communities that depend on them**

*In the spirit of Prof. Wangaari Maathai: "It's the little things citizens do. That's what will make the difference."*

</div>
