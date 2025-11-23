"""
Data Loader Module for TowerGuard ML Pipeline

Handles loading and validation of geospatial data from multiple sources:
- Water tower geometries (GeoJSON)
- Biodiversity points (CSV)
- Nursery infrastructure (CSV)
- Demo validation sites (GeoJSON)

All data is validated against CRS (EPSG:4326) and Kenya geographic bounds.
"""

import json
from pathlib import Path
from typing import Optional, Dict, List, Tuple
import logging

try:
    import geopandas as gpd
    GEOPANDAS_AVAILABLE = True
except ImportError:
    GEOPANDAS_AVAILABLE = False
    gpd = None

import pandas as pd
from shapely.geometry import Point, shape

from .config import DATA_SOURCES, VALIDATION, get_config
from .utils import setup_logger

logger = setup_logger(__name__)

# ============================================================================
# VALIDATION UTILITIES
# ============================================================================

def validate_crs(gdf: gpd.GeoDataFrame, expected_crs: str = "EPSG:4326") -> bool:
    """
    Validate that GeoDataFrame uses expected coordinate reference system.
    
    Args:
        gdf: GeoDataFrame to validate
        expected_crs: Expected CRS (default: EPSG:4326)
    
    Returns:
        True if CRS matches, False otherwise
    
    Raises:
        ValueError: If CRS is undefined
    """
    if gdf.crs is None:
        raise ValueError(f"GeoDataFrame has undefined CRS")
    
    if gdf.crs.to_string() != expected_crs:
        logger.warning(f"CRS mismatch: expected {expected_crs}, got {gdf.crs.to_string()}")
        gdf = gdf.to_crs(expected_crs)
        logger.info(f"Reprojected GeoDataFrame to {expected_crs}")
    
    return True


def validate_kenya_bounds(
    gdf: gpd.GeoDataFrame,
    bounds: Dict[str, float] = None
) -> bool:
    """
    Validate that all geometries fall within Kenya geographic bounds.
    
    Args:
        gdf: GeoDataFrame to validate
        bounds: Bounding box dict with min_lat, max_lat, min_lon, max_lon
               (default: from config)
    
    Returns:
        True if all geometries within bounds, False if any violations
    """
    if bounds is None:
        bounds = VALIDATION["kenya_bounds"]
    
    min_lat = bounds["min_lat"]
    max_lat = bounds["max_lat"]
    min_lon = bounds["min_lon"]
    max_lon = bounds["max_lon"]
    
    violations = []
    
    for idx, row in gdf.iterrows():
        geom = row.geometry
        if geom is None or geom.is_empty:
            violations.append(f"Row {idx}: Empty geometry")
            continue
        
        bounds_geom = geom.bounds  # (minx, miny, maxx, maxy)
        min_lon_geom, min_lat_geom, max_lon_geom, max_lat_geom = bounds_geom
        
        if not (min_lat <= min_lat_geom and max_lat_geom <= max_lat and
                min_lon <= min_lon_geom and max_lon_geom <= max_lon):
            violations.append(
                f"Row {idx}: Geometry out of bounds "
                f"[lat: {min_lat_geom:.2f}-{max_lat_geom:.2f}, "
                f"lon: {min_lon_geom:.2f}-{max_lon_geom:.2f}]"
            )
    
    if violations:
        logger.warning(f"Kenya bounds violations: {'; '.join(violations)}")
        return False
    
    return True


def validate_csv_schema(
    df: pd.DataFrame,
    required_fields: List[str],
    name: str
) -> bool:
    """
    Validate that CSV has required columns.
    
    Args:
        df: DataFrame to validate
        required_fields: List of required column names
        name: Name of data source (for logging)
    
    Returns:
        True if all required fields present, False otherwise
    
    Raises:
        ValueError: If required fields missing
    """
    missing = set(required_fields) - set(df.columns)
    if missing:
        raise ValueError(
            f"{name} is missing required fields: {missing}. "
            f"Available fields: {set(df.columns)}"
        )
    return True


# ============================================================================
# LOADERS
# ============================================================================

def load_water_towers(
    validate: bool = True
) -> Optional[gpd.GeoDataFrame]:
    """
    Load water tower geometries from GeoJSON.
    
    Args:
        validate: If True, validate CRS and Kenya bounds
    
    Returns:
        GeoDataFrame of water towers, or None if load fails
    """
    try:
        config = get_config()
        path = Path(config["data_sources"]["water_towers"]["path"])
        
        if not path.exists():
            logger.error(f"Water towers GeoJSON not found: {path}")
            return None
        
        logger.info(f"Loading water towers from {path}")
        gdf = gpd.read_file(path)
        
        if validate:
            validate_crs(gdf)
            validate_kenya_bounds(gdf)
        
        logger.info(f"Loaded {len(gdf)} water towers")
        return gdf
    
    except Exception as e:
        logger.error(f"Failed to load water towers: {e}")
        return None


def load_water_tower_buffers(
    validate: bool = True
) -> Optional[gpd.GeoDataFrame]:
    """
    Load 2km buffer zones around water towers.
    
    Args:
        validate: If True, validate CRS and Kenya bounds
    
    Returns:
        GeoDataFrame of buffer zones, or None if load fails
    """
    try:
        config = get_config()
        path = Path(config["data_sources"]["water_tower_buffers"]["path"])
        
        if not path.exists():
            logger.error(f"Water tower buffers GeoJSON not found: {path}")
            return None
        
        logger.info(f"Loading water tower buffers from {path}")
        gdf = gpd.read_file(path)
        
        if validate:
            validate_crs(gdf)
            validate_kenya_bounds(gdf)
        
        logger.info(f"Loaded {len(gdf)} buffer zones")
        return gdf
    
    except Exception as e:
        logger.error(f"Failed to load water tower buffers: {e}")
        return None


def load_demo_sites(
    validate: bool = True
) -> Optional[gpd.GeoDataFrame]:
    """
    Load demo validation sites.
    
    Args:
        validate: If True, validate CRS and Kenya bounds
    
    Returns:
        GeoDataFrame of demo sites, or None if load fails
    """
    try:
        config = get_config()
        path = Path(config["data_sources"]["demo_sites"]["path"])
        
        if not path.exists():
            logger.warning(f"Demo sites GeoJSON not found: {path}")
            return None
        
        logger.info(f"Loading demo sites from {path}")
        gdf = gpd.read_file(path)
        
        if validate:
            validate_crs(gdf)
            validate_kenya_bounds(gdf)
        
        logger.info(f"Loaded {len(gdf)} demo sites")
        return gdf
    
    except Exception as e:
        logger.error(f"Failed to load demo sites: {e}")
        return None


def load_biodiversity_points(
    validate: bool = True
) -> Optional[pd.DataFrame]:
    """
    Load biodiversity occurrence points from GBIF.
    
    Creates a GeoDataFrame with Point geometries from lat/lon columns.
    
    Args:
        validate: If True, validate required fields and coordinate ranges
    
    Returns:
        GeoDataFrame of biodiversity points, or None if load fails
    """
    try:
        config = get_config()
        path = Path(config["data_sources"]["biodiversity_points"]["path"])
        
        if not path.exists():
            logger.error(f"Biodiversity points CSV not found: {path}")
            return None
        
        logger.info(f"Loading biodiversity points from {path}")
        df = pd.read_csv(path)
        
        if validate:
            required = config["data_sources"]["biodiversity_points"]["required_fields"]
            validate_csv_schema(df, required, "biodiversity_points")
        
        # Filter out rows with missing coordinates
        df = df[df[["lat", "lon"]].notna().all(axis=1)].copy()
        
        # Create GeoDataFrame with Point geometries
        geometry = [Point(lon, lat) for lon, lat in zip(df["lon"], df["lat"])]
        gdf = gpd.GeoDataFrame(df, geometry=geometry, crs="EPSG:4326")
        
        if validate:
            validate_kenya_bounds(gdf)
        
        logger.info(f"Loaded {len(gdf)} biodiversity points")
        return gdf
    
    except Exception as e:
        logger.error(f"Failed to load biodiversity points: {e}")
        return None


def load_species_local_names() -> Optional[pd.DataFrame]:
    """
    Load scientific to local name mapping.
    
    Args:
        None
    
    Returns:
        DataFrame of species names, or None if load fails
    """
    try:
        config = get_config()
        path = Path(config["data_sources"]["species_local_names"]["path"])
        
        if not path.exists():
            logger.warning(f"Species local names CSV not found: {path}")
            return None
        
        logger.info(f"Loading species local names from {path}")
        df = pd.read_csv(path)
        
        required = config["data_sources"]["species_local_names"]["required_fields"]
        validate_csv_schema(df, required, "species_local_names")
        
        # Create mapping dictionary
        logger.info(f"Loaded {len(df)} species name mappings")
        return df
    
    except Exception as e:
        logger.error(f"Failed to load species local names: {e}")
        return None


def load_nurseries(
    validate: bool = True
) -> Optional[gpd.GeoDataFrame]:
    """
    Load tree nurseries from CSV.
    
    Creates a GeoDataFrame with Point geometries from lat/lon columns.
    
    Args:
        validate: If True, validate required fields and coordinate ranges
    
    Returns:
        GeoDataFrame of nurseries, or None if load fails
    """
    try:
        config = get_config()
        path = Path(config["data_sources"]["nurseries"]["path"])
        
        if not path.exists():
            logger.error(f"Nurseries CSV not found: {path}")
            return None
        
        logger.info(f"Loading nurseries from {path}")
        df = pd.read_csv(path)
        
        if validate:
            required = config["data_sources"]["nurseries"]["required_fields"]
            validate_csv_schema(df, required, "nurseries")
        
        # Filter out rows with missing coordinates
        df = df[df[["lat", "lon"]].notna().all(axis=1)].copy()
        
        # Create GeoDataFrame with Point geometries
        geometry = [Point(lon, lat) for lon, lat in zip(df["lon"], df["lat"])]
        gdf = gpd.GeoDataFrame(df, geometry=geometry, crs="EPSG:4326")
        
        if validate:
            validate_kenya_bounds(gdf)
        
        logger.info(f"Loaded {len(gdf)} nurseries")
        return gdf
    
    except Exception as e:
        logger.error(f"Failed to load nurseries: {e}")
        return None


# ============================================================================
# DATA CATALOG
# ============================================================================

def get_all_data() -> Dict[str, Optional[gpd.GeoDataFrame]]:
    """
    Load all available data sources.
    
    Returns:
        Dictionary mapping data source names to loaded GeoDataFrames/DataFrames
    """
    return {
        "water_towers": load_water_towers(),
        "water_tower_buffers": load_water_tower_buffers(),
        "demo_sites": load_demo_sites(),
        "biodiversity_points": load_biodiversity_points(),
        "species_local_names": load_species_local_names(),
        "nurseries": load_nurseries(),
    }


def print_data_summary() -> None:
    """Print summary statistics for all loaded data sources."""
    logger.info("=" * 80)
    logger.info("DATA CATALOG SUMMARY")
    logger.info("=" * 80)
    
    all_data = get_all_data()
    
    for name, data in all_data.items():
        if data is None:
            logger.info(f"{name}: FAILED TO LOAD")
        elif isinstance(data, gpd.GeoDataFrame):
            logger.info(
                f"{name}: {len(data)} features | "
                f"CRS: {data.crs} | "
                f"Bounds: {data.total_bounds}"
            )
        elif isinstance(data, pd.DataFrame):
            logger.info(f"{name}: {len(data)} rows × {len(data.columns)} columns")
    
    logger.info("=" * 80)


# ============================================================================
# USAGE
# ============================================================================

if __name__ == "__main__":
    # Configure logging
    setup_logger("__main__")
    
    # Load all data
    print_data_summary()
