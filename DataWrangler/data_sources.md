# **Data Sources & Licensing**

This document lists all **real, verifiable datasets** used in the Hummingbird Impact prototype.
No synthetic or randomly generated data is included.
All datasets comply with the Track 2 requirement for **data-driven environmental impact systems**. 

---

# **1. Kenya Water Towers (18 Gazetted Towers)**

### **Dataset:** *18 Gazetted Water Towers of Kenya*

**Source:**

* Kenya Water Tower Agency (KWTA) – official publications
  [https://www.kwta.go.ke](https://www.kwta.go.ke)
* Supplementary polygons cross-checked via the Mount Elgon Foundation:
  [https://www.mountelgonfoundation.org.uk](https://www.mountelgonfoundation.org.uk)

**Licensing:** Public institutional data (non-restrictive).
**Format:** GeoJSON
**Path:** `backend/data/water_towers/kenya_water_towers_18.geojson`

**Notes:**

* Cleaned and standardized into EPSG:4326
* Includes names, categories, counties, and validated geometries

---

# **2. Demo Project Sites in Water Towers**

### **Dataset:** *Demo Sites (3 minimum)*

**Source:**

* Derived from the water tower polygons above
* Manual selection inside Aberdare, Mau Complex, and Cherangani Hills

**Licensing:** Derived work from public data
**Format:** GeoJSON
**Path:** `backend/data/sites/demo_sites_water_towers.geojson`

---

# **3. Nurseries of Kenya**

### **Dataset:** *Kenya Tree Nurseries (Public + NGO)*

**Sources:**

* KEFRI Tree Nursery Directory (regional reports)
  [https://www.kefri.org](https://www.kefri.org)
* Kenya Forest Service (KFS) nursery lists and county programs
  [https://www.kenyaforestservice.org](https://www.kenyaforestservice.org)
* Green Belt Movement community nurseries
  [https://www.greenbeltmovement.org](https://www.greenbeltmovement.org)

**Licensing:** Public institutional & NGO program data
**Format:** CSV
**Path:** `backend/data/nurseries/nurseries_kenya.csv`

**Notes:**

* Only real nurseries included
* Capacities, species, and geolocation verified from source PDFs/reports

---

# **4. Biodiversity Species Observation Points**

### **Dataset:** *Species Occurrence Points (Kenya)*

**Source:** **GBIF – Global Biodiversity Information Facility**
[https://www.gbif.org](https://www.gbif.org)

**Example GBIF Queries:**

* Taxa for *Juniperus procera*, *Olea europaea subsp. africana*, *Podocarpus latifolius*, etc.
* Filtered to Kenya + bounding boxes around water towers

**Licensing:** CC-BY 4.0 (standard GBIF data license)
**Format:** CSV
**Path:** `backend/data/biodiversity/biodiversity_points.csv`

**Notes:**

* Contains >20 real rows
* Includes scientific name, local name (merged from separate mapping), and source ID
* No invented coordinates or species

---

# **5. Species Local Names Mapping**

### **Dataset:** *Scientific ↔ Local Name Mapping*

**Sources:**

* KEFRI Indigenous Tree Species Compendium
* “Useful Trees of Kenya” (KEFRI & ICRAF)
* University of Nairobi Herbarium publications
* Field guides (e.g., Agnew & Shirley: *Kenyan Trees, Shrubs & Lianas*)

**Licensing:** Academic fair-use, citation required
**Format:** CSV
**Path:** `backend/data/biodiversity/species_local_names.csv`

**Notes:**

* Ensures cultural accuracy by including names from Kikuyu, Luhya, Kalenjin, Maasai, Meru, etc.
* Merged into `/api/biodiversity` responses

---

# **6. Environmental / Climate / Remote Sensing Datasets**

These datasets feed into backend services:

* NDVI extraction
* Soil properties
* Rainfall summaries
* Climate indicators
* Real-time weather

All fixtures stored under:
`backend/data/fixtures/`

---

## **6.1 Sentinel-2 NDVI (via TorchGeo / rasterio)**

**Source:** ESA Sentinel Hub / Copernicus Open Access
[https://scihub.copernicus.eu](https://scihub.copernicus.eu)

**Licensing:** Copernicus Open Data License
**Format:** GeoTIFF (not stored fully—downloaded on demand; fixtures cropped)

**Used in:**

* `compute_ndvi_for_site()`
* ML feature extraction pipeline

---

## **6.2 CHIRPS Rainfall**

**Source:** Climate Hazards Center – CHIRPS v2
[https://www.chc.ucsb.edu/data/chirps](https://www.chc.ucsb.edu/data/chirps)

**Licensing:** Free & open for research
**Format:** NetCDF
**Path (fixture):** `backend/data/fixtures/chirps_sample.nc`

Used for:

* `fetch_rainfall_summary()`

- chirps_sample.nc  
  Source: CHIRPS v3.0 daily NetCDF (2024 March), downloaded from  
  https://data.chc.ucsb.edu/products/CHIRPS-3.0/global_daily/netcdf/  
  Used as a small dev fixture for rainfall summary testing.

---

## **6.3 SoilGrids Soil Properties**

**Source:** ISRIC SoilGrids
[https://www.soilgrids.org](https://www.soilgrids.org)

**Licensing:** CC BY 4.0
**Format:** JSON (API response)
**Path (fixture):** `backend/data/fixtures/soilgrids_sample.json`

Used for:

* `fetch_soil_properties()`

---

## **6.4 NASA POWER Climate Summary**

**Source:** NASA POWER API
[https://power.larc.nasa.gov](https://power.larc.nasa.gov)

**Licensing:** Public Data (no restrictions)
**Format:** JSON
**Path (fixture):** `backend/data/fixtures/nasa_power_sample.json`

Used for:

* `fetch_climate_summary()`

---

## **6.5 Open-Meteo Weather API**

**Source:** Open-Meteo (free, no key required)
[https://open-meteo.com](https://open-meteo.com)

**Licensing:** Open data
**Format:** JSON
**Path (fixture):** `backend/data/fixtures/open_meteo_sample.json`

Used for:

* `fetch_current_weather()`

---

# **7. Data Handling Best Practices**

### **Required:**

* All geospatial datasets must be in **EPSG:4326**
* No synthetic values
* All sources must be attributed
* Downsampling allowed, but raw values may not be altered
* Sensitive data removed (none included in this project)

---

# **8. Source Summary Table**

| Dataset             | Source                   | License        | File                              |
| ------------------- | ------------------------ | -------------- | --------------------------------- |
| 18 Water Towers     | KWTA                     | Public         | `kenya_water_towers_18.geojson`   |
| Demo Sites          | Derived                  | Public-derived | `demo_sites_water_towers.geojson` |
| Nurseries           | KEFRI + KFS + GBM        | Public         | `nurseries_kenya.csv`             |
| Biodiversity Points | GBIF                     | CC-BY 4.0      | `biodiversity_points.csv`         |
| Species Local Names | KEFRI + academic sources | Fair use       | `species_local_names.csv`         |
| CHIRPS              | Climate Hazards Center   | Open           | `chirps_sample.nc`                |
| SoilGrids           | ISRIC SoilGrids          | CC-BY 4.0      | `soilgrids_sample.json`           |
| NASA POWER          | NASA                     | Open           | `nasa_power_sample.json`          |
| Open-Meteo          | Open-Meteo               | Open           | `open_meteo_sample.json`          |

---

# **9. Acknowledgements**

We acknowledge the institutions providing critical open environmental datasets that enable Kenya’s digital forest restoration and monitoring tools.
This documentation ensures transparency, traceability, and reproducibility of all data-driven results.
