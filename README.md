# TowerGuard

Data-driven forest restoration intelligence tailored for the Wangari Maathai Hackathon Track 2: Data-Driven Impact Measurement. TowerGuard fuses satellite imagery, in-field measurements, and AI modeling to track tree survival, map nurseries, visualize biodiversity, and forecast conservation impact so that communities, investors, and policymakers can act with confidence.

## Why It Matters
- Kenya loses roughly 50,000 hectares of forest cover every year while climate volatility makes monitoring expensive and slow.
- Community organizations and county governments need a shared system of record that proves impact for carbon markets, ESG financing, and restoration pledges.
- TowerGuard automates Monitoring and Evaluation (M&E) with transparent metrics so that every seedling planted is traceable to survival outcomes and climate benefits.

## Platform Pillars
1. **Tree Survival Intelligence** - blends NDVI or NDWI, rainfall, soil, and local field reports to produce plot-level survival scores and anomaly alerts.
2. **Interactive M&E Dashboards** - configurable views for community groups, donors, and regulators with KPIs, data exports, and audit trails.
3. **Nursery Atlas** - geospatial registry of nurseries capturing species mix, annual capacity, and logistics status to match demand with supply.
4. **Biodiversity Lens** - species richness layers and camera-trap feeds to highlight co-benefits beyond carbon.
5. **AI Impact Studio** - TorchGeo-powered models that predict restoration outcomes under different budget, climate, and management scenarios.

## System Architecture (Target)
```
      Remote Sensing         Field Data and IoT        Open Data APIs
     (Sentinel, Landsat)     (USSD, Kobo, LoRa)     (rainfall, soils, markets)
               \                    |                        /
                \                   |                       /
                 \                  |                      /
                 Ingestion Workers (FastAPI + Celery)
                             |
                        Feature Store
                   (PostgreSQL + PostGIS)
                             |
           -----------------------------------------
           |              |                        |
    Analytics API   Model Serving API        Stream Processor
           |              |                        |
   React + MapLibre   TorchGeo models       Notification engine
     dashboards          (PyTorch)             (alerts, SMS)
```

## Data and Modeling Strategy
- **Feature engineering**: temporal NDVI trends, rainfall anomalies, soil moisture proxies, species-specific survival baselines, and socio-economic context layers.
- **Model stack**: hybrid of rule-based scoring for transparency plus gradient boosted and CNN models for early warning detection. All models include explainability outputs for stakeholders.
- **Impact metrics**: survival percentage, biodiversity index, jobs created, carbon sequestered, and cost per hectare restored.

## Product Modules
| Module | User Problems Solved | Key Outputs |
| --- | --- | --- |
| Survival Tracking | "Which plots are failing and why?" | Cohort analysis, alert feed, exportable reports |
| M&E Dashboards | "How do we report to donors and regulators?" | Multi-tenant dashboards, KPI snapshots, evidence locker |
| Nursery Mapping | "Where can we source the right seedlings?" | Availability heatmaps, logistics notes, capacity forecasts |
| Biodiversity Visualization | "What are the co-benefits?" | Species richness layers, temporal biodiversity charts |
| AI Impact Prediction | "Where should we invest next?" | Scenario planning, marginal impact curves, ROI estimates |

## Getting Started (planned stack)
> The repository currently holds documentation. Use the scaffold below once code assets are added during the hackathon.

### Prerequisites
- Python 3.11 or newer, Poetry or pip, and GDAL for raster processing.
- Node.js 18 or newer plus pnpm or npm for the React dashboard.
- PostgreSQL 15 with the PostGIS extension.
- Optional: Redis for task queues.

### Local Setup
1. **Clone and bootstrap**
   ```bash
   git clone https://github.com/<org>/TowerGuard.git
   cd TowerGuard
   ```
2. **Backend (FastAPI)**
   ```bash
   cd backend
   cp .env.example .env
   poetry install
   poetry run uvicorn app.main:app --reload
   ```
3. **Frontend (React)**
   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```
4. **Run tests**
   ```bash
   poetry run pytest
   pnpm test
   ```

### Reference Project Layout (to be finalized)
```
TowerGuard/
|- backend/      # FastAPI services, model pipelines, ingestion workers
|- frontend/     # React dashboard with MapLibre visualizations
|- infra/        # Infrastructure automation for Azure or AWS
|- data/         # Sample raster or vector data for demos
\- notebooks/    # Research, explainability, and analytics prototypes
```

## Track 2 Alignment and KPIs
- **Data-driven impact measurement** is achieved via automated ingestion, statistical quality checks, and continuous scoring of survival and biodiversity metrics.
- **KPIs surfaced**: survival percentage, hectares restored, nursery utilization, species richness, carbon gains, and socio-economic benefits.
- **Storytelling artifacts**: dashboard embeds, printable impact briefs, and donor-ready evidence packs.

## Roadmap
1. Finish MVP ingestion pipeline with Sentinel imagery and Kobo Toolbox sync.
2. Deliver end-to-end dashboard for two pilot counties such as Nyeri and Elgeyo-Marakwet.
3. Integrate nursery logistics marketplace and booking workflow.
4. Expand biodiversity module with citizen-science data (eBird, iNaturalist).
5. Productionize AI impact prediction and publish public API endpoints.

## Contributing
1. Fork the repository and create a feature branch.
2. Follow the coding standards (Black plus Ruff for Python, ESLint plus Prettier for TypeScript).
3. Add tests and documentation for every feature.
4. Open a pull request with context, screenshots, and evaluation metrics.

## License
TowerGuard is released under the [MIT License](LICENSE).
