# TowerGuard - Slide Narrative

Use this Markdown with Marp, Slidesdown, or Deckset to generate the hackathon presentation. Each `---` indicates a new slide.

---

## 1. Opening
- TowerGuard: data-driven restoration intelligence for Kenya
- Wangari Maathai Hackathon - Track 2: Data-Driven Impact Measurement
- Mission: prove and amplify conservation impact through trustworthy metrics

---

## 2. Problem & Market Need
- Over 50,000 hectares of Kenyan forest lost annually while monitoring budgets shrink
- Monitoring spend averages under $3 per hectare, leaving roughly 70% of plots unverified each year
- Counties, community groups, and financiers lack a shared system of record to unlock climate finance and ESG deals
- Global restoration pledges (15B trees in Kenya alone) require verifiable metrics before billions in funding can flow

---

## 3. Vision & Track Fit
- Make every seedling measurable from nursery to canopy through automation
- Combine satellites, field apps, and AI into one M&E workflow; deliver alerts within 24 hours
- Align directly with Track 2 deliverables: survival tracking, dashboards, nursery mapping, biodiversity visualization, AI impact prediction
- Provide trusted data for the first 250,000 hectares of the 15B tree pledge and beyond

---

## 4. Users & Product Pillars
- **Personas**: community forest associations, County/KFS regulators, CSR and carbon investors, nurseries & logistics partners
- **Survival Intelligence**: anomaly detection refreshed every five days using 10 m Sentinel scenes
- **M&E Control Room**: dashboards, reporting packs, exports with audit trails back to raw imagery
- **Nursery Atlas**: species mix, capacity forecasts, procurement workflows covering 40+ nurseries
- **Biodiversity Lens**: species richness and camera-trap integrations with 5,000+ annual observations
- **AI Impact Studio**: scenario planning modeling five-year ecological and financial outcomes

---

## 5. Technology & Data Flow
- FastAPI microservices with Celery workers for 15-minute ingestion jobs
- TorchGeo + PyTorch models process ~1 TB of raster data per year with explainability per hectare
- PostgreSQL + PostGIS feature store; Redis queues 10,000+ daily events; React + MapLibre dashboards with 50+ KPI widgets
- Pipeline: Sentinel/Landsat + rainfall/soil APIs ingested hourly → USSD/Kobo/LoRa field data (2,000+ observations/month) → feature store snapshots → scoring + alert engine (<10 s latency) → tamper-proof evidence locker for PDF/CSV exports

---

## 6. Impact KPIs & Field Story
- Survival percentage with confidence bands (goal: lift pilot sites from 55% to 75%)
- 25,000 hectares monitored by 2026, reducing seedling shortages by 30%
- Biodiversity index with 5% YoY increase in indicator species; 2,000 seasonal jobs per county documented
- Pilot vignette: Nyeri Block 7 used TowerGuard alerts to replant within a week, improving expected survival from 48% to 71%

---

## 7. Business & Revenue Model
- SaaS tiers: pilot $18K/year, enterprise $75K/year with gross margin >70%
- Usage credits at $0.04 per data event; premium services (AI scenarios, audits, integrations) billed at $150/hour
- Future marketplace: 5% facilitation fee on nursery supply/restoration services targeting $2M GMV by 2027
- Path to $5M ARR by year three with diversified mix of subscription (65%), usage (20%), services/marketplace (15%)

---

## 8. Go-To-Market & Edge
- Phase 1 pilots: Nyeri & Elgeyo-Marakwet covering 12,000 hectares via hackathon partners; 200 enumerators via KEFRI/KFS
- Layer carbon developers/CSR teams for 10 paying tenants in year one; expand regionally once ARR > $1M
- Competitive edge: offline-first workflows, transparent metrics + explainability, unified view across survival, nurseries, biodiversity, finance, and privileged data partnerships

---

## 9. Traction & Roadmap
- Hackathon sprint delivered prototype data model, dashboard wireframes, and 18 stakeholder interviews
- Q1: ingest Sentinel scenes, deploy MVP dashboards, onboard 20 pilot nurseries
- Q2: launch impact prediction studio and donor evidence packs covering 50,000 hectares
- Q3: monetize via subscription tiers, integrate payments, expand to Rwanda with 3 paying counties

---

## 10. Team, Ask & Call to Action
- Team of six specialists spanning remote sensing, AI/ML, product, and conservation operations with prior deployments across East Africa
- Ask: data-sharing MoUs, pilot plots, satellite credits, and $75K USD to productionize the MVP
- Call to action: pilot TowerGuard, share datasets/expertise, and help make every tree verifiably thriving
