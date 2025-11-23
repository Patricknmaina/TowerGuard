"""
TowerGuard ML Pipeline Configuration

Centralized configuration for all data sources, APIs, cache settings, and paths.
Supports environment variable overrides for sensitive credentials.
"""

import os
from pathlib import Path
from typing import Dict, Any

# Project root - updated for FastAPI backend structure
PROJECT_ROOT = Path(__file__).parent.parent.parent

# ============================================================================
# DATA DIRECTORIES
# ============================================================================

DATA_DIRS = {
    "data_root": PROJECT_ROOT / "data",
    "cache_dir": PROJECT_ROOT / "cache",
    "log_dir": PROJECT_ROOT / "logs",
    "geospatial": PROJECT_ROOT / "data" / "geospatial",
    "sentinel": PROJECT_ROOT / "data" / "sentinel",
    "fixtures": PROJECT_ROOT / "data" / "fixtures",
}

# Create directories if they don't exist
for dir_path in DATA_DIRS.values():
    if isinstance(dir_path, Path):
        dir_path.mkdir(parents=True, exist_ok=True)

# ============================================================================
# DATA SOURCES
# ============================================================================

DATA_SOURCES = {
    # Geospatial reference layers
    "water_towers": {
        "path": DATA_DIRS["data_root"] / "water_towers" / "kenya_water_towers_18.geojson",
        "format": "geojson",
        "description": "18 gazetted water towers of Kenya",
        "source": "KWTA + Mount Elgon Foundation",
        "license": "Public",
        "required_fields": ["id", "name", "category", "counties", "geometry"]
    },
    "water_tower_buffers": {
        "path": DATA_DIRS["data_root"] / "water_towers" / "kenya_water_towers_18_buffers_2km.geojson",
        "format": "geojson",
        "description": "2km buffer zones around water towers",
        "source": "Derived from water_towers",
        "license": "Public-derived",
        "required_fields": ["geometry"]
    },
    "demo_sites": {
        "path": DATA_DIRS["data_root"] / "sites" / "demo_sites_water_towers.geojson",
        "format": "geojson",
        "description": "3+ demo sites within water tower polygons",
        "source": "Manual selection from water towers",
        "license": "Public-derived",
        "required_fields": ["id", "name", "water_tower_id", "geometry"]
    },
    
    # Biodiversity data
    "biodiversity_points": {
        "path": DATA_DIRS["data_root"] / "biodiversity" / "biodiversity_points_enriched.csv",
        "format": "csv",
        "description": "Species occurrence points (enriched)",
        "source": "GBIF + local enrichment",
        "license": "CC-BY 4.0",
        "required_fields": [
            "id",
            "lat",
            "lon",
            "scientific_name",
            "local_name",
            "english_common_name",
            "water_tower_id",
        ],
    },
    
    # Infrastructure data
    "nurseries": {
        "path": DATA_DIRS["data_root"] / "nurseries" / "nurseries_kenya.csv",
        "format": "csv",
        "description": "Kenya tree nurseries (public + NGO)",
        "source": "KEFRI + KFS + Green Belt Movement",
        "license": "Public",
        "required_fields": ["id", "name", "lat", "lon"]
    },
}

# ============================================================================
# API ENDPOINTS
# ============================================================================

API_ENDPOINTS = {
    "chirps": {
        "base_url": "https://data.chc.ucsb.edu/products/CHIRPS-2.0/",
        "wcs_url": "https://chc-geonode.azurewebsites.net/geoserver/wcs",
        "description": "Climate Hazards Center CHIRPS v2 rainfall",
        "format": "NetCDF / GeoTIFF",
        "authentication": "None",
        "rate_limit": "Unlimited",
        "cache_ttl_hours": 24
    },
    "nasa_power": {
        "base_url": "https://power.larc.nasa.gov/api/",
        "endpoints": {
            "climatology": "temporal/climatology/point",
            "hourly": "temporal/hourly/point",
            "daily": "temporal/daily/point",
        },
        "climatology_defaults": {
            "community": "AG",
            "start": 1981,
            "end": 2010,
            "format": "json",
        },
        "description": "NASA POWER API for climate data",
        "format": "JSON",
        "authentication": "API key (free)",
        "rate_limit": "40 requests/minute",
        "cache_ttl_hours": 24,
        "api_key_env": "NASA_POWER_API_KEY"
    },
    "open_meteo": {
        "base_url": "https://api.open-meteo.com/v1/",
        "endpoints": {
            "forecast": "forecast",
            "historical": "archive",
        },
        "description": "Open-Meteo free weather API",
        "format": "JSON",
        "authentication": "None (free, open data)",
        "rate_limit": "10,000 requests/day",
        "cache_ttl_hours": 6
    },
    "soilgrids": {
        "base_url": "https://rest.isric.org/soilgrids/v2.0/",
        "endpoints": {
            "properties": "properties/query",
        },
        "description": "ISRIC SoilGrids soil properties",
        "format": "JSON",
        "authentication": "None (open access)",
        "rate_limit": "Unlimited",
        "cache_ttl_hours": 720  # 30 days; soil doesn't change frequently
    },
    "gbif": {
        "base_url": "https://api.gbif.org/v1/",
        "endpoints": {
            "occurrence_search": "occurrence/search",
            "species": "species",
        },
        "description": "Global Biodiversity Information Facility API",
        "format": "JSON",
        "authentication": "None (free API)",
        "rate_limit": "100 requests/second",
        "cache_ttl_hours": 24
    },
}

# ============================================================================
# VALIDATION CONSTRAINTS
# ============================================================================

VALIDATION = {
    "crs": "EPSG:4326",
    "kenya_bounds": {
        "min_lat": -5.0,
        "max_lat": 5.0,
        "min_lon": 33.0,
        "max_lon": 42.0,
        "description": "Geographic bounding box for Kenya"
    },
    "feature_ranges": {
        "ndvi_mean": (-1.0, 1.0),
        "ndvi_std": (0.0, 1.0),
        "rainfall_mm": (0.0, 5000.0),
        "temp_mean_c": (-50.0, 50.0),
        "elevation_m": (0.0, 5895.0),
    }
}

# ============================================================================
# CACHE & REQUEST SETTINGS
# ============================================================================

CACHE_CONFIG = {
    "enabled": True,
    "directory": DATA_DIRS["cache_dir"],
    "max_age_hours": 24,
    "strategy": "file-based",  # Could be: file-based, redis, memcached
}

REQUEST_CONFIG = {
    "timeout_seconds": 30,
    "retry_attempts": 3,
    "retry_delay_seconds": 1,
    "backoff_multiplier": 2.0,
    "ssl_verify": True,
}

# ============================================================================
# LOGGING
# ============================================================================

LOGGING_CONFIG = {
    "log_file": DATA_DIRS["log_dir"] / "ml_pipeline.log",
    "log_level": os.getenv("LOG_LEVEL", "INFO"),
    "max_bytes": 10 * 1024 * 1024,  # 10 MB
    "backup_count": 5,
    "format": "[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s",
    "date_format": "%Y-%m-%d %H:%M:%S"
}

# ============================================================================
# FEATURE EXTRACTION PARAMETERS
# ============================================================================

FEATURE_CONFIG = {
    "ndvi": {
        "sentinel2_bands": {
            "red": "B04",
            "nir": "B08",
            "resolution": 10,  # meters
        },
        "valid_pixel_threshold": 0.1,  # Minimum 10% valid pixels required
    },
    "rainfall": {
        "primary_source": "chirps",  # CHIRPS as primary, NASA POWER as backup
        "backup_source": "nasa_power",
        "aggregation_method": "mean",  # Can be: mean, sum, median
        "time_window_years": 10,  # Use 10-year climatology
    },
    "temperature": {
        "primary_source": "nasa_power",
        "backup_source": "open_meteo",
        "aggregation_method": "mean",
        "time_window_years": 10,
    },
    "elevation": {
        "source": "water_towers_geojson",  # From GeoJSON properties
        "fallback_source": "soilgrids",  # Optional: sample DEM if not in GeoJSON
    },
    "spatial_aggregation": {
        "method": "buffer",
        "buffer_radius_km": 2.0,
        "aggregation_func": "mean",
    }
}

# ============================================================================
# ENVIRONMENT-SPECIFIC OVERRIDES
# ============================================================================

def get_config() -> Dict[str, Any]:
    """
    Get merged configuration with environment variable overrides.
    
    Returns:
        Dictionary with all configuration settings
    """
    config = {
        "project_root": str(PROJECT_ROOT),
        "data_dirs": {k: str(v) for k, v in DATA_DIRS.items()},
        "data_sources": DATA_SOURCES,
        "api_endpoints": API_ENDPOINTS,
        "validation": VALIDATION,
        "cache": CACHE_CONFIG,
        "request": REQUEST_CONFIG,
        "logging": LOGGING_CONFIG,
        "features": FEATURE_CONFIG,
    }
    
    # Environment variable overrides
    if api_key := os.getenv("NASA_POWER_API_KEY"):
        config["api_endpoints"]["nasa_power"]["api_key"] = api_key
    
    if env := os.getenv("ENVIRONMENT"):
        config["environment"] = env
    
    return config

# ============================================================================
# USAGE
# ============================================================================

if __name__ == "__main__":
    import json
    
    config = get_config()
    print(json.dumps({k: str(v) if isinstance(v, Path) else v for k, v in config.items()}, indent=2))
