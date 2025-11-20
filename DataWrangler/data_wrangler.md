# **Role: Data Wrangler / Integrations**

The Data Wrangler ensures the platform uses **real, credible environmental datasets** for all Kenya water-tower–related geospatial and biodiversity features.
No synthetic or randomly generated data is permitted. All values must come from real public datasets, even if manually subsetted.

Your work directly powers the backend services, ML pipeline, and frontend visualizations described in `ARCHITECTURE.md`.

---

# **1. Responsibilities**

### **1. Water Tower Geospatial Data**

* Collect and validate the official **18 gazetted water towers of Kenya**.
* Ensure **EPSG:4326** projection.
* Standardize into GeoJSON stored at:

```
backend/data/water_towers/kenya_water_towers_18.geojson
```

**Required fields:**

| field      | description               |
| ---------- | ------------------------- |
| `id`       | UUID or short code        |
| `name`     | Official tower name       |
| `category` | `"gazetted"` or `"major"` |
| `counties` | County list               |
| `geometry` | Polygon / MultiPolygon    |

---

### **2. Demo Sites (Within Water Towers)**

Create a minimum of **3 demo sites**, each inside a water tower polygon.

Store in:

```
backend/data/sites/demo_sites_water_towers.geojson
```

**Required fields:**

| field            | description       |
| ---------------- | ----------------- |
| `id`             | UUID              |
| `name`           | Site name         |
| `water_tower_id` | FK to water tower |
| `geometry`       | Polygon           |

These sites act as the reference geometries for:

* NDVI extraction
* SoilGrids sampling
* CHIRPS rainfall extraction
* Climate summaries
* Species lookup

---

### **3. Nursery Dataset**

Source real nursery points from:

* KEFRI
* Kenya Forest Service
* County nursery registries
* NGO datasets (e.g., GBM)

Store in:

```
backend/data/nurseries/nurseries_kenya.csv
```

**Columns:**

| column               | description          |
| -------------------- | -------------------- |
| `id`                 | UUID                 |
| `name`               | Nursery name         |
| `lat`                | Latitude             |
| `lon`                | Longitude            |
| `water_tower_id`     | Nearest tower        |
| `species_scientific` | Main tree species    |
| `species_local`      | Known local name     |
| `capacity_seedlings` | Verified capacity    |
| `source`             | Credible source link |

---

### **4. Biodiversity Points (Real Species Observations)**

Minimum: **20 real species occurrences** sourced from:

* **GBIF**
* KEFRI species inventories
* County biodiversity reports
* Published ecological datasets

Stored at:

```
backend/data/biodiversity/biodiversity_points.csv
```

**Columns:**

| column                | description             |
| --------------------- | ----------------------- |
| `id`                  | UUID                    |
| `lat`                 | Latitude                |
| `lon`                 | Longitude               |
| `scientific_name`     | Required                |
| `local_name`          | Required                |
| `english_common_name` | Optional                |
| `source`              | Dataset URL or citation |
| `water_tower_id`      | Optional FK             |

This dataset feeds:

* `/api/biodiversity`
* Site species visualization
* Water tower species summaries

---

### **5. Species Local Names Mapping**

You must ensure that **every species displayed in biodiversity results** includes an accurate local (vernacular) name.

Store in:

```
backend/data/biodiversity/species_local_names.csv
```

**Columns:**

| column                | description                              |
| --------------------- | ---------------------------------------- |
| `scientific_name`     | Required                                 |
| `local_name`          | Verified Kikuyu/Maasai/Luo/Kalenjin/etc. |
| `english_common_name` | Optional                                 |
| `notes`               | Additional info                          |
| `source`              | KEFRI / botanical reference              |

This dataset is merged into API responses to ensure:

* cultural relevance
* compliance with MVP requirements
* consistent naming

---

### **6. Fixtures for Environmental Data**

Provide small **real** sample files for offline development.

Store in:

```
backend/data/fixtures/
    soilgrids_sample.json
    chirps_sample.nc
    nasa_power_sample.json
    open_meteo_sample.json
```

Each fixture must:

* come from real downloaded API responses
* not be synthetically edited
* only be cropped minimally for size

---

# **2. Data Integrity Requirements**

### **A. No synthetic data**

* No random values.
* No fabricated lat/lon.
* No invented species names.

### **B. All datasets must be referenced**

Create:

```
docs/DATA_SOURCES.md
```

Include:

* Source URLs
* Licensing terms
* Download dates
* Attribution requirements

### **C. Coordinate System**

Always use **EPSG:4326 (WGS84)** for:

* GeoJSON
* CSV points
* Site polygons
* Water tower polygons

### **D. Validation Before Commit**

You must validate:

| Check                            | Tools                         |
| -------------------------------- | ----------------------------- |
| Geometry validity                | `geopandas`, `shapely`        |
| CRS correctness                  | `gdalinfo`, `ogrinfo`         |
| CSV schema compliance            | `pandas`                      |
| Bounding box constraints (Kenya) | lat ∈ [-5, 5], lon ∈ [33, 42] |

---

# **3. Data Wrangler Workflow (Track 2 Alignment)**

*(matches hackathon worksheet requirements)* 

### **Sprint 1: Problem → Solution Clarity**

* Confirm available open datasets.
* Identify gaps (e.g., missing local names) and propose credible sources.
* Validate that data supports MVP features:

  * Water towers
  * Demo sites
  * Species map
  * Nursery layer
  * NDVI/soil/rainfall/climate integrations

---

### **Sprint 2: Prototype Blueprint**

* Deliver the file structure with empty placeholders.
* Provide real mini datasets (downsampled, but not synthetic).
* Confirm feasibility of:

  * CHIRPS rainfall extraction
  * SoilGrids sampling
  * NASA POWER climate
  * Open-Meteo weather

Dependencies:

* Backend needs your datasets in correct paths.
* Frontend relies on correct JSON schema.

---

### **Sprint 3: Build Sprint**

Deliver:

1. Clean, real datasets in required folders
2. Data validation scripts
3. Contributions to `DATA_SOURCES.md`
4. Support backend devs with:

   * sample site IDs
   * bounding boxes
   * water tower metadata

You will also support frontend visualizations by confirming:

* species names
* local names
* water tower county labels
* nursery capacities

---

# **4. Tools & Recommended Libraries**

| Task               | Libraries / Tools              |
| ------------------ | ------------------------------ |
| GeoJSON processing | `geopandas`, `shapely`         |
| Raster sampling    | `rasterio`, `torchgeo`         |
| CSV validation     | `pandas`, `great_expectations` |
| CHIRPS extraction  | `xarray`, `netCDF4`            |
| Projection checks  | `pyproj`, `gdalinfo`           |
| Species lookup     | GBIF API, KEFRI publications   |

---

# **5. Deliverables Checklist**

### **Data Files**

✔ `kenya_water_towers_18.geojson`
✔ `demo_sites_water_towers.geojson`
✔ `nurseries_kenya.csv`
✔ `biodiversity_points.csv`
✔ `species_local_names.csv`
✔ Fixtures for SoilGrids, CHIRPS, NASA POWER, Open-Meteo

---

### **Documentation**

✔ `docs/DATA_SOURCES.md`
✔ Metadata for each dataset
✔ Coordinate reference explanation

---

### **Validation**

✔ All geometries valid
✔ All coordinates within Kenya
✔ All species names verified
✔ All local names properly linked
✔ No synthetic/random values
