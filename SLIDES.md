# TowerGuard - Slide Narrative

Use this Markdown with Marp, Slidesdown, or Deckset to generate the hackathon presentation. Each `---` indicates a new slide.

---

## 1. Opening
- TowerGuard: data-driven restoration intelligence for Kenya
- Wangari Maathai Hackathon - Track 2: Data-Driven Impact Measurement
- Mission: prove and amplify conservation impact through trustworthy metrics

---

## 2. Challenge
- Over 50,000 hectares of Kenyan forest lost annually while monitoring budgets shrink
- Field audits are slow, subjective, and often siloed from donor dashboards
- Communities need verifiable evidence to unlock climate finance and ESG deals

---

## 3. Opportunity and Vision
- Make every seedling measurable from nursery to canopy
- Combine satellites, field apps, and AI into one automated M&E workflow
- Deliver transparency that de-risks investments in landscape restoration

---

## 4. Track 2 Alignment
- Tree survival tracking with continuous NDVI, rainfall, and soil signals
- Interactive dashboards for stakeholders with shareable KPIs
- Nursery mapping covering species, capacity, and logistics readiness
- Biodiversity visualization layers plus annotation pipeline
- AI-powered impact prediction for proactive interventions

---

## 5. User Personas
- Community forest associations: need alerts and training guidance
- County governments and KFS: require verified reports for compliance
- Impact investors and CSR teams: demand ROI plus co-benefit insights
- Nurseries and logistics partners: seek reliable demand pipelines

---

## 6. Product Overview
- Survival Intelligence: anomaly detection and mortality cohort analysis
- M&E Control Room: multi-tenant dashboards, reporting packs, exports
- Nursery Atlas: species mix, capacity forecasts, procurement workflows
- Biodiversity Lens: species richness, camera-trap integrations
- AI Impact Studio: scenario planning and cost-per-impact modeling

---

## 7. Technology Stack
- FastAPI microservices with Celery workers for ingestion jobs
- TorchGeo plus PyTorch models for survival scoring and forecasting
- PostgreSQL plus PostGIS feature store; Redis queues for events
- React plus MapLibre front-end with deck.gl visualizations
- Infrastructure as code for rapid deployment on Azure or AWS

---

## 8. Data Pipeline
1. Remote sensing (Sentinel, Landsat), rainfall, and soil APIs ingested hourly
2. USSD, Kobo, and LoRa field inputs synced via edge gateways
3. Feature engineering and explainability stored in PostGIS
4. Model serving API streams scores to dashboards and alert engine
5. Evidence locker exports PDF or CSV packs for donors and regulators

---

## 9. Impact Metrics
- Tree survival percentage with confidence bands
- Hectares restored and carbon sequestered estimates
- Nursery utilization and fulfillment lead time
- Biodiversity index plus species sightings
- Jobs created and community engagements logged

---

## 10. Business Model
- SaaS subscriptions for counties, NGOs, and carbon project developers
- Usage-based credits for API calls, satellite scenes, and alerts
- Premium services: AI scenario modeling, verification audits, integrations
- Long-term: marketplace fees for nursery supply and restoration services

---

## 11. Go-To-Market
1. Pilot with two counties (Nyeri, Elgeyo-Marakwet) through hackathon network
2. Partner with KEFRI, KFS, and local NGOs for data validation
3. Layer carbon project developers and CSR teams for paid tiers
4. Expand to East African Community via regional forestry initiatives

---

## 12. Competitive Edge
- Built for emerging markets: offline-first workflows and low-data alerts
- Transparent metrics plus explainability for compliance-heavy donors
- Unified view across survival, nurseries, biodiversity, and finance
- Hackathon momentum provides access to stakeholders and datasets

---

## 13. Traction and Roadmap
- Prototype data model and dashboards scoped during hackathon sprint
- Q1: ingest Sentinel scenes, deploy MVP dashboards, onboard pilot nurseries
- Q2: launch impact prediction studio and donor evidence packs
- Q3: monetize via subscription tiers, integrate payments, expand to Rwanda

---

## 14. Team and Needs
- Team mix: remote sensing, AI or ML, product, and conservation experts
- Ask: data-sharing MoUs, pilot plots, satellite credits, and 75K USD to productionize
- Invitation: collaborate to make restoration auditable and investable

---

## 15. Call to Action
- Pilot TowerGuard in your restoration program
- Share datasets or expertise to accelerate impact measurement
- Let's ensure every tree planted is a tree that thrives
