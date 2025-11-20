"""
TowerGuard NDVI Pipeline

Handles Sentinel-2 data loading, polygon clipping, NDVI computation, and aggregation.
Core module for extracting vegetation indices from satellite imagery.
"""

from pathlib import Path
from typing import Dict, Optional, Tuple, Any
import warnings

import numpy as np
import rasterio
from rasterio.mask import mask as rasterio_mask
from shapely.geometry import shape
from shapely.wkt import loads as wkt_loads

from .utils import logger, create_feature_metadata


# ==============================================================================
# Sentinel-2 Band Configuration
# ==============================================================================

SENTINEL2_BANDS = {
    'B04': {'name': 'Red', 'resolution': 10},      # Red band for NDVI
    'B08': {'name': 'NIR', 'resolution': 10},      # Near-Infrared for NDVI
    'B02': {'name': 'Blue', 'resolution': 10},
    'B03': {'name': 'Green', 'resolution': 10},
    'B05': {'name': 'Vegetation Red Edge', 'resolution': 20},
    'B11': {'name': 'SWIR', 'resolution': 20},
}

# NDVI computation typically uses 10m resolution bands (B04, B08)
NDVI_BANDS = ('B04', 'B08')  # (Red, NIR)

# Cloud/shadow/nodata values in Sentinel-2
NODATA_VALUE = 0
CLOUD_THRESHOLD = 3000  # Sentinel-2 DN values; high values indicate clouds


# ==============================================================================
# Core NDVI Functions
# ==============================================================================

def load_sentinel2_band(
    filepath: str,
    band_index: int = 1
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Load a single Sentinel-2 band from GeoTIFF file.
    
    Args:
        filepath: Path to Sentinel-2 band GeoTIFF
        band_index: Band index to read (default: 1, first band)
    
    Returns:
        Tuple of (data array, metadata dict)
    
    Raises:
        FileNotFoundError: If file does not exist
        rasterio.errors.RasterioIOError: If file cannot be read
    """
    filepath = Path(filepath)
    
    if not filepath.exists():
        logger.error(f"Sentinel-2 file not found: {filepath}")
        raise FileNotFoundError(f"File not found: {filepath}")
    
    try:
        with rasterio.open(filepath) as src:
            data = src.read(band_index)
            metadata = {
                'crs': src.crs,
                'transform': src.transform,
                'bounds': src.bounds,
                'width': src.width,
                'height': src.height,
                'dtype': src.dtypes[band_index - 1],
                'nodata': src.nodata
            }
            logger.debug(f"Loaded band from {filepath}: shape {data.shape}, dtype {data.dtype}")
            return data, metadata
    
    except Exception as e:
        logger.error(f"Failed to load Sentinel-2 band {filepath}: {e}")
        raise


def clip_to_polygon(
    data: np.ndarray,
    metadata: Dict[str, Any],
    polygon_wkt: str
) -> Tuple[Optional[np.ndarray], Optional[Dict[str, Any]]]:
    """
    Clip raster data to a polygon defined by WKT.
    
    Args:
        data: Raster data array (e.g., from load_sentinel2_band)
        metadata: Raster metadata (crs, transform, etc.)
        polygon_wkt: Polygon in WKT format (e.g., "POLYGON ((...))")
    
    Returns:
        Tuple of (clipped_data, clipped_metadata) or (None, None) on failure
    """
    try:
        # Parse WKT to Shapely geometry
        polygon = wkt_loads(polygon_wkt)
        
        if not polygon.is_valid:
            logger.warning(f"Invalid polygon WKT: {polygon_wkt}")
            return None, None
        
        # Create temporary in-memory raster for clipping
        # We need to write to a temporary file or use rasterio.mask directly
        # For simplicity, we'll use rasterio.mask on the data
        
        # Convert metadata back to a rasterio-compatible format
        transform = metadata['transform']
        crs = metadata['crs']
        
        # rasterio.mask expects geometries in the same CRS
        geometries = [polygon]
        
        # Create temporary dataset for masking
        import rasterio
        from rasterio.io import MemoryFile
        
        # Write to memory file
        with MemoryFile() as memfile:
            with memfile.open(
                driver='GTiff',
                height=data.shape[0],
                width=data.shape[1],
                count=1,
                dtype=data.dtype,
                crs=crs,
                transform=transform,
                nodata=metadata.get('nodata', 0)
            ) as mem:
                mem.write(data, 1)
            
            # Now mask using the memory file
            with memfile.open() as mem:
                clipped_data, clipped_transform = rasterio_mask(mem, geometries, crop=True)
                clipped_data = clipped_data[0]  # Extract first band
                
                clipped_metadata = metadata.copy()
                clipped_metadata['transform'] = clipped_transform
                clipped_metadata['height'] = clipped_data.shape[0]
                clipped_metadata['width'] = clipped_data.shape[1]
                
                logger.debug(f"Clipped data from {data.shape} to {clipped_data.shape}")
                return clipped_data, clipped_metadata
    
    except Exception as e:
        logger.error(f"Failed to clip to polygon: {e}")
        return None, None


def compute_ndvi(
    red: np.ndarray,
    nir: np.ndarray,
    handle_division_by_zero: bool = True
) -> np.ndarray:
    """
    Compute NDVI from Red (B04) and NIR (B08) bands.
    
    NDVI = (NIR - Red) / (NIR + Red)
    
    Args:
        red: Red band data (B04)
        nir: Near-Infrared band data (B08)
        handle_division_by_zero: Whether to handle (NIR + Red) == 0 gracefully
    
    Returns:
        NDVI array, same shape as input bands
    """
    # Convert to float to avoid integer division issues
    red = red.astype(np.float32)
    nir = nir.astype(np.float32)
    
    denominator = nir + red
    
    if handle_division_by_zero:
        # Avoid division by zero warnings; set NDVI to 0 where (NIR + Red) == 0
        ndvi = np.zeros_like(denominator, dtype=np.float32)
        valid_mask = denominator != 0
        ndvi[valid_mask] = (nir[valid_mask] - red[valid_mask]) / denominator[valid_mask]
    else:
        with warnings.catch_warnings():
            warnings.filterwarnings('ignore', message='invalid value encountered in divide')
            ndvi = (nir - red) / denominator
    
    logger.debug(f"Computed NDVI: min={np.nanmin(ndvi):.3f}, max={np.nanmax(ndvi):.3f}, mean={np.nanmean(ndvi):.3f}")
    
    return ndvi


def aggregate_ndvi(
    ndvi: np.ndarray,
    valid_pixel_threshold: float = 0.1
) -> Dict[str, Optional[float]]:
    """
    Aggregate NDVI statistics over a clipped polygon region.
    
    Handles clouds and nodata by computing statistics on valid pixels only.
    
    Args:
        ndvi: NDVI array (from compute_ndvi)
        valid_pixel_threshold: Minimum fraction of valid pixels required (default: 0.1 = 10%)
    
    Returns:
        Dictionary with:
        - 'mean': Mean NDVI (None if insufficient valid pixels)
        - 'std': Std dev of NDVI (None if insufficient valid pixels)
        - 'valid_pixel_ratio': Fraction of valid pixels
        - 'min': Minimum NDVI
        - 'max': Maximum NDVI
        - 'count': Number of pixels
        - 'valid_count': Number of valid pixels
    """
    total_pixels = ndvi.size
    
    # Identify valid pixels: not NaN, not -9999 (common nodata), and within [-1, 1]
    valid_mask = (
        ~np.isnan(ndvi) & 
        (ndvi != -9999) & 
        (ndvi >= -1.0) & 
        (ndvi <= 1.0)
    )
    
    valid_pixels = ndvi[valid_mask]
    valid_pixel_ratio = len(valid_pixels) / total_pixels if total_pixels > 0 else 0.0
    
    result = {
        'mean': None,
        'std': None,
        'valid_pixel_ratio': valid_pixel_ratio,
        'min': None,
        'max': None,
        'count': total_pixels,
        'valid_count': len(valid_pixels)
    }
    
    if valid_pixel_ratio >= valid_pixel_threshold and len(valid_pixels) > 0:
        result['mean'] = float(np.mean(valid_pixels))
        result['std'] = float(np.std(valid_pixels))
        result['min'] = float(np.min(valid_pixels))
        result['max'] = float(np.max(valid_pixels))
        
        logger.debug(
            f"NDVI aggregation: mean={result['mean']:.3f}, std={result['std']:.3f}, "
            f"valid_ratio={valid_pixel_ratio:.2%}"
        )
    else:
        logger.warning(
            f"Insufficient valid NDVI pixels: {valid_pixel_ratio:.2%} "
            f"(threshold: {valid_pixel_threshold:.2%})"
        )
    
    return result


# ==============================================================================
# High-Level Pipeline Function
# ==============================================================================

def compute_ndvi_for_site(
    site_id: str,
    red_band_path: str,
    nir_band_path: str,
    polygon_wkt: str,
    valid_pixel_threshold: float = 0.1
) -> Dict[str, Optional[float]]:
    """
    End-to-end NDVI computation for a water tower site.
    
    Pipeline:
    1. Load Red (B04) and NIR (B08) bands from Sentinel-2 GeoTIFFs
    2. Clip both to polygon boundary (WKT)
    3. Compute NDVI = (NIR - Red) / (NIR + Red)
    4. Aggregate statistics (mean, std, valid pixel ratio)
    
    Per specification: Always return None instead of throwing errors.
    Failures are logged; NDVI stats default to None if any step fails.
    
    Args:
        site_id: Site identifier for logging
        red_band_path: Path to Red band (B04) GeoTIFF
        nir_band_path: Path to NIR band (B08) GeoTIFF
        polygon_wkt: Site boundary as WKT polygon string
        valid_pixel_threshold: Minimum valid pixel ratio required
    
    Returns:
        Dictionary with:
        - 'ndvi_mean': Mean NDVI (None on failure)
        - 'ndvi_std': Std dev of NDVI (None on failure)
        - 'ndvi_valid_pixel_ratio': Ratio of valid pixels (None on failure)
        - 'ndvi_min': Minimum NDVI (None on failure)
        - 'ndvi_max': Maximum NDVI (None on failure)
        - 'site_id': Site identifier
        - 'success': Boolean flag
    """
    
    logger.info(f"Starting NDVI computation for site: {site_id}")
    
    result = {
        'site_id': site_id,
        'ndvi_mean': None,
        'ndvi_std': None,
        'ndvi_valid_pixel_ratio': None,
        'ndvi_min': None,
        'ndvi_max': None,
        'success': False
    }
    
    try:
        # Step 1: Load Red and NIR bands
        logger.debug(f"[{site_id}] Loading Red band from {red_band_path}")
        red_data, red_metadata = load_sentinel2_band(red_band_path, band_index=1)
        
        logger.debug(f"[{site_id}] Loading NIR band from {nir_band_path}")
        nir_data, nir_metadata = load_sentinel2_band(nir_band_path, band_index=1)
        
        # Verify bands have same shape
        if red_data.shape != nir_data.shape:
            logger.error(
                f"[{site_id}] Band shape mismatch: Red {red_data.shape} vs NIR {nir_data.shape}"
            )
            return result
        
        # Step 2: Clip to polygon
        logger.debug(f"[{site_id}] Clipping to polygon")
        red_clipped, red_meta_clipped = clip_to_polygon(red_data, red_metadata, polygon_wkt)
        nir_clipped, nir_meta_clipped = clip_to_polygon(nir_data, nir_metadata, polygon_wkt)
        
        if red_clipped is None or nir_clipped is None:
            logger.error(f"[{site_id}] Failed to clip bands to polygon")
            return result
        
        # Step 3: Compute NDVI
        logger.debug(f"[{site_id}] Computing NDVI")
        ndvi = compute_ndvi(red_clipped, nir_clipped, handle_division_by_zero=True)
        
        # Step 4: Aggregate statistics
        logger.debug(f"[{site_id}] Aggregating NDVI statistics")
        aggregated = aggregate_ndvi(ndvi, valid_pixel_threshold=valid_pixel_threshold)
        
        result['ndvi_mean'] = aggregated['mean']
        result['ndvi_std'] = aggregated['std']
        result['ndvi_valid_pixel_ratio'] = aggregated['valid_pixel_ratio']
        result['ndvi_min'] = aggregated['min']
        result['ndvi_max'] = aggregated['max']
        result['success'] = aggregated['mean'] is not None
        
        logger.info(
            f"[{site_id}] NDVI computation successful: "
            f"mean={result['ndvi_mean']}, std={result['ndvi_std']}, "
            f"valid_ratio={result['ndvi_valid_pixel_ratio']:.2%}"
        )
    
    except Exception as e:
        logger.error(f"[{site_id}] NDVI computation failed: {e}", exc_info=True)
    
    return result


# ==============================================================================
# Utility: Save NDVI for Visualization
# ==============================================================================

def save_ndvi_array(
    ndvi: np.ndarray,
    output_path: str,
    metadata: Optional[Dict[str, Any]] = None
) -> bool:
    """
    Save NDVI array as a GeoTIFF for visualization and validation.
    
    Args:
        ndvi: NDVI array
        output_path: Path to save GeoTIFF
        metadata: Optional rasterio metadata (crs, transform, etc.)
    
    Returns:
        True if successful, False otherwise
    """
    try:
        import rasterio
        from rasterio.transform import Affine
        
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Default metadata if not provided
        if metadata is None:
            metadata = {
                'driver': 'GTiff',
                'dtype': np.float32,
                'width': ndvi.shape[1],
                'height': ndvi.shape[0],
                'count': 1,
                'transform': Affine.identity(),
                'crs': None
            }
        
        with rasterio.open(output_path, 'w', **metadata) as dst:
            dst.write(ndvi.astype(np.float32), 1)
        
        logger.info(f"Saved NDVI to {output_path}")
        return True
    
    except Exception as e:
        logger.error(f"Failed to save NDVI array: {e}")
        return False
