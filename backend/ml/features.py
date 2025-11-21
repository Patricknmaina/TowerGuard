"""
TowerGuard Feature Extraction Pipeline

Gathers environmental features from multiple data sources:
- NDVI statistics from Sentinel-2
- Rainfall from climate data
- Temperature from climate data
- Elevation from DEM
- Metadata for provenance tracking

Returns structured feature dictionaries with robust error handling.
"""

from typing import Dict, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
import numpy as np

from .ndvi import compute_ndvi_for_site
from .utils import logger, create_feature_metadata, build_feature_vector_from_site_features
from .environmental_api_client import (
    get_api_client,
    CHIRPSClient,
    NASAPOWERClient,
    SoilGridsClient
)
from .data_loader import load_water_towers


# ==============================================================================
# Feature Data Classes
# ==============================================================================

@dataclass
class SiteFeatures:
    """
    Structured container for extracted site features.
    
    All fields can be None if data is unavailable; no synthetic defaults are used.
    """
    site_id: str
    ndvi_mean: Optional[float] = None
    ndvi_std: Optional[float] = None
    ndvi_valid_pixel_ratio: Optional[float] = None
    rainfall_mm: Optional[float] = None
    temp_mean_c: Optional[float] = None
    elevation_m: Optional[float] = None
    
    def to_dict(self) -> Dict[str, Optional[float]]:
        """Convert to dictionary, excluding site_id."""
        d = asdict(self)
        d.pop('site_id', None)
        return d


# ==============================================================================
# Feature Data Sources (Stub Implementations)
# ==============================================================================
# In production, these would connect to actual data APIs or local databases.
# For now, they return None to indicate data unavailability.

def get_rainfall_for_site(
    site_id: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    data_source: str = 'chirps'
) -> Optional[float]:
    """
    Retrieve annual/seasonal rainfall for a site.
    
    Data sources:
    - 'chirps': Climate Hazards Group InfraRed Precipitation with Station data
    - 'nasa_power': NASA POWER climate data API
    - 'open_meteo': Open-Meteo weather API (backup)
    
    Args:
        site_id: Site identifier
        latitude: Site latitude (required for API calls)
        longitude: Site longitude (required for API calls)
        data_source: Data source name (default: 'chirps')
    
    Returns:
        Rainfall in mm or None if unavailable
    """
    try:
        logger.debug(f"[{site_id}] Retrieving rainfall from source: {data_source}")
        
        if latitude is None or longitude is None:
            logger.warning(f"[{site_id}] Missing latitude/longitude for rainfall lookup")
            return None
        
        if data_source == 'chirps':
            chirps = CHIRPSClient()
            rainfall = chirps.get_rainfall_for_location(latitude, longitude)
            if rainfall is not None:
                logger.info(f"[{site_id}] Rainfall (CHIRPS): {rainfall:.1f} mm")
            return rainfall
        
        elif data_source == 'nasa_power':
            nasa = NASAPOWERClient()
            rainfall = nasa.get_rainfall_climatology(latitude, longitude)
            if rainfall is not None:
                logger.info(f"[{site_id}] Rainfall (NASA POWER): {rainfall:.1f} mm")
            return rainfall
        
        else:
            logger.warning(f"[{site_id}] Unknown rainfall data source: {data_source}")
            return None
    
    except Exception as e:
        logger.error(f"[{site_id}] Failed to retrieve rainfall: {e}")
        return None


def get_temperature_for_site(
    site_id: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    data_source: str = 'nasa_power'
) -> Optional[float]:
    """
    Retrieve mean annual temperature for a site.
    
    Data sources:
    - 'nasa_power': NASA POWER climate data API
    - 'open_meteo': Open-Meteo free weather API
    
    Args:
        site_id: Site identifier
        latitude: Site latitude (required for API calls)
        longitude: Site longitude (required for API calls)
        data_source: Data source name (default: 'nasa_power')
    
    Returns:
        Mean temperature in °C or None if unavailable
    """
    try:
        logger.debug(f"[{site_id}] Retrieving temperature from source: {data_source}")
        
        if latitude is None or longitude is None:
            logger.warning(f"[{site_id}] Missing latitude/longitude for temperature lookup")
            return None
        
        if data_source == 'nasa_power':
            nasa = NASAPOWERClient()
            temp_tuple = nasa.get_temperature_climatology(latitude, longitude)
            if temp_tuple:
                mean_c = temp_tuple[0]
                logger.info(f"[{site_id}] Temperature (NASA POWER): {mean_c:.1f}°C")
                return mean_c
            return None
        
        elif data_source == 'open_meteo':
            open_meteo_client = get_api_client('open_meteo')
            if open_meteo_client:
                temp = open_meteo_client.get_temperature_current(latitude, longitude)
                if temp is not None:
                    logger.info(f"[{site_id}] Temperature (Open-Meteo): {temp:.1f}°C")
                return temp
            return None
        
        else:
            logger.warning(f"[{site_id}] Unknown temperature data source: {data_source}")
            return None
    
    except Exception as e:
        logger.error(f"[{site_id}] Failed to retrieve temperature: {e}")
        return None


def get_elevation_for_site(
    site_id: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    dem_path: Optional[str] = None,
    data_source: str = 'water_towers_geojson'
) -> Optional[float]:
    """
    Retrieve elevation for a site.
    
    Data sources:
    - 'water_towers_geojson': Elevation from water_towers.geojson properties
    - 'soilgrids': ISRIC SoilGrids DEM (optional, TIER 2)
    
    Args:
        site_id: Site identifier or water tower name
        latitude: Site latitude (for SoilGrids fallback)
        longitude: Site longitude (for SoilGrids fallback)
        dem_path: Path to local DEM GeoTIFF (optional)
        data_source: Data source name (default: 'water_towers_geojson')
    
    Returns:
        Elevation in meters or None if unavailable
    """
    try:
        logger.debug(f"[{site_id}] Retrieving elevation from source: {data_source}")
        
        if data_source == 'water_towers_geojson':
            # Load water towers GeoDataFrame
            water_towers = load_water_towers()
            if water_towers is None:
                logger.warning(f"[{site_id}] Could not load water towers GeoJSON")
                return None
            
            # Try to find site by name or id
            match = None
            if 'name' in water_towers.columns:
                match = water_towers[water_towers['name'] == site_id]
            if match is None or match.empty:
                if 'id' in water_towers.columns:
                    match = water_towers[water_towers['id'] == site_id]
            
            if match is not None and not match.empty:
                # Try to get elevation from properties
                if 'elevation' in match.columns or 'elevation_m' in match.columns:
                    elev_col = 'elevation' if 'elevation' in match.columns else 'elevation_m'
                    elevation = match.iloc[0][elev_col]
                    if elevation is not None:
                        logger.info(f"[{site_id}] Elevation (water_towers): {elevation:.0f} m")
                        return float(elevation)
                
                # Try to extract elevation from geometry (z-coordinate if 3D)
                geom = match.iloc[0].geometry
                if geom and hasattr(geom, 'z'):
                    elevation = geom.z
                    logger.info(f"[{site_id}] Elevation (geometry z): {elevation:.0f} m")
                    return float(elevation)
            
            logger.warning(f"[{site_id}] Site not found in water towers GeoJSON")
            return None
        
        elif data_source == 'soilgrids':
            if latitude is None or longitude is None:
                logger.warning(f"[{site_id}] Missing latitude/longitude for SoilGrids")
                return None
            
            soilgrids = SoilGridsClient()
            props = soilgrids.get_soil_properties(latitude, longitude)
            if props:
                logger.info(f"[{site_id}] Elevation query via SoilGrids")
                return props.get('elevation', None)
            return None
        
        else:
            logger.warning(f"[{site_id}] Unknown elevation data source: {data_source}")
            return None
    
    except Exception as e:
        logger.error(f"[{site_id}] Failed to retrieve elevation: {e}")
        return None


# ==============================================================================
# Feature Extraction Orchestration
# ==============================================================================

def extract_features_for_site(
    site_id: str,
    red_band_path: Optional[str] = None,
    nir_band_path: Optional[str] = None,
    polygon_wkt: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    dem_path: Optional[str] = None,
    rainfall_source: str = 'chirps',
    temperature_source: str = 'nasa_power',
    elevation_source: str = 'water_towers_geojson',
    sentinel2_date: Optional[str] = None,
    sentinel2_cloud_percentage: Optional[float] = None
) -> Tuple[SiteFeatures, Dict[str, Any]]:
    """
    End-to-end feature extraction for a water tower site.
    
    Gathers features from multiple sources with robust error handling:
    - NDVI: Computed from Sentinel-2 if Red/NIR bands and polygon provided
    - Rainfall: Retrieved from CHIRPS (primary), NASA POWER (backup)
    - Temperature: Retrieved from NASA POWER (primary), Open-Meteo (backup)
    - Elevation: Retrieved from water_towers.geojson properties
    
    Per specification: No synthetic defaults; on failure, log + set None.
    
    Args:
        site_id: Unique site identifier (water tower name or ID)
        red_band_path: Path to Sentinel-2 Red band (B04) GeoTIFF (optional)
        nir_band_path: Path to Sentinel-2 NIR band (B08) GeoTIFF (optional)
        polygon_wkt: Site boundary as WKT polygon (optional, required for NDVI)
        latitude: Site latitude (optional, for climate data lookup)
        longitude: Site longitude (optional, for climate data lookup)
        dem_path: Path to DEM GeoTIFF for elevation (optional)
        rainfall_source: Data source for rainfall ('chirps' or 'nasa_power', default: 'chirps')
        temperature_source: Data source for temperature ('nasa_power' or 'open_meteo', default: 'nasa_power')
        elevation_source: Data source for elevation ('water_towers_geojson' or 'soilgrids', default: 'water_towers_geojson')
        sentinel2_date: Date of Sentinel-2 acquisition for metadata (optional)
        sentinel2_cloud_percentage: Cloud cover percentage for metadata (optional)
    
    Returns:
        Tuple of (SiteFeatures, metadata_dict):
        - SiteFeatures: Extracted features (values None if unavailable)
        - metadata_dict: Provenance, data sources, processing notes
    """
    
    logger.info(f"Starting feature extraction for site: {site_id}")
    
    features = SiteFeatures(site_id=site_id)
    metadata = create_feature_metadata(
        site_id=site_id,
        sentinel2_date=sentinel2_date,
        sentinel2_cloud_percentage=sentinel2_cloud_percentage,
        processing_notes=None
    )
    
    # Track data sources
    data_sources = {
        'ndvi': 'Sentinel-2',
        'rainfall': rainfall_source,
        'temperature': temperature_source,
        'elevation': elevation_source
    }
    
    # ===========================================================================
    # 1. Extract NDVI
    # ===========================================================================
    
    if red_band_path and nir_band_path and polygon_wkt:
        logger.debug(f"[{site_id}] Extracting NDVI from Sentinel-2")
        try:
            ndvi_result = compute_ndvi_for_site(
                site_id=site_id,
                red_band_path=red_band_path,
                nir_band_path=nir_band_path,
                polygon_wkt=polygon_wkt,
                valid_pixel_threshold=0.1
            )
            
            if ndvi_result['success']:
                features.ndvi_mean = ndvi_result['ndvi_mean']
                features.ndvi_std = ndvi_result['ndvi_std']
                features.ndvi_valid_pixel_ratio = ndvi_result['ndvi_valid_pixel_ratio']
                logger.info(f"[{site_id}] NDVI extraction successful")
            else:
                logger.warning(f"[{site_id}] NDVI extraction failed; setting to None")
        
        except Exception as e:
            logger.error(f"[{site_id}] Exception during NDVI extraction: {e}", exc_info=True)
    
    else:
        logger.warning(
            f"[{site_id}] Skipping NDVI extraction: missing required inputs "
            f"(red_band_path={red_band_path is not None}, "
            f"nir_band_path={nir_band_path is not None}, "
            f"polygon_wkt={polygon_wkt is not None})"
        )
    
    # ===========================================================================
    # 2. Extract Rainfall
    # ===========================================================================
    
    logger.debug(f"[{site_id}] Extracting rainfall from source: {rainfall_source}")
    try:
        features.rainfall_mm = get_rainfall_for_site(
            site_id=site_id,
            latitude=latitude,
            longitude=longitude,
            data_source=rainfall_source
        )
        if features.rainfall_mm is not None:
            logger.info(f"[{site_id}] Rainfall extraction successful: {features.rainfall_mm} mm")
        else:
            logger.warning(f"[{site_id}] Rainfall not available; setting to None")
    
    except Exception as e:
        logger.error(f"[{site_id}] Exception during rainfall extraction: {e}", exc_info=True)
    
    # ===========================================================================
    # 3. Extract Temperature
    # ===========================================================================
    
    logger.debug(f"[{site_id}] Extracting temperature from source: {temperature_source}")
    try:
        features.temp_mean_c = get_temperature_for_site(
            site_id=site_id,
            latitude=latitude,
            longitude=longitude,
            data_source=temperature_source
        )
        if features.temp_mean_c is not None:
            logger.info(f"[{site_id}] Temperature extraction successful: {features.temp_mean_c}°C")
        else:
            logger.warning(f"[{site_id}] Temperature not available; setting to None")
    
    except Exception as e:
        logger.error(f"[{site_id}] Exception during temperature extraction: {e}", exc_info=True)
    
    # ===========================================================================
    # 4. Extract Elevation
    # ===========================================================================
    
    logger.debug(f"[{site_id}] Extracting elevation from source: {elevation_source}")
    try:
        features.elevation_m = get_elevation_for_site(
            site_id=site_id,
            latitude=latitude,
            longitude=longitude,
            dem_path=dem_path,
            data_source=elevation_source
        )
        if features.elevation_m is not None:
            logger.info(f"[{site_id}] Elevation extraction successful: {features.elevation_m} m")
        else:
            logger.warning(f"[{site_id}] Elevation not available; setting to None")
    
    except Exception as e:
        logger.error(f"[{site_id}] Exception during elevation extraction: {e}", exc_info=True)
    
    # ===========================================================================
    # Update metadata
    # ===========================================================================
    
    metadata['data_sources'] = data_sources
    
    # Count successful extractions
    successful_features = sum([
        features.ndvi_mean is not None,
        features.rainfall_mm is not None,
        features.temp_mean_c is not None,
        features.elevation_m is not None
    ])
    
    processing_note = f"Extracted {successful_features}/4 features successfully"
    if successful_features < 4:
        processing_note += " (some features unavailable)"
    
    metadata['processing_notes'] = processing_note
    
    logger.info(f"[{site_id}] Feature extraction complete: {processing_note}")
    
    return features, metadata


# ==============================================================================
# Batch Feature Extraction
# ==============================================================================

def extract_features_for_sites(
    sites: list,
    **kwargs
) -> list:
    """
    Extract features for multiple sites.
    
    Args:
        sites: List of site configuration dictionaries, each with keys:
               - 'site_id': unique identifier
               - 'red_band_path', 'nir_band_path', 'polygon_wkt': for NDVI
               - 'latitude', 'longitude': for climate data
               - 'dem_path': for elevation
        **kwargs: Additional arguments passed to extract_features_for_site
    
    Returns:
        List of (SiteFeatures, metadata) tuples, one per site
    """
    results = []
    
    for site_config in sites:
        logger.info(f"Processing site: {site_config.get('site_id', 'unknown')}")
        
        try:
            features, metadata = extract_features_for_site(**site_config, **kwargs)
            results.append({
                'features': features,
                'metadata': metadata
            })
        
        except Exception as e:
            site_id = site_config.get('site_id', 'unknown')
            logger.error(f"Failed to extract features for {site_id}: {e}", exc_info=True)
            
            # Add empty result for this site
            empty_features = SiteFeatures(site_id=site_id)
            empty_metadata = create_feature_metadata(site_id=site_id, processing_notes=f"Failed: {e}")
            results.append({
                'features': empty_features,
                'metadata': empty_metadata
            })
    
    logger.info(f"Feature extraction complete for {len(results)} sites")
    return results
