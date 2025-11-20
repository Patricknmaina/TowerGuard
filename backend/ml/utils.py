"""
TowerGuard ML Pipeline Utilities

Provides logging setup, feature vector construction, and common helper functions.
"""

import logging
import logging.handlers
from pathlib import Path
from typing import Dict, List, Optional, Any
import json
from datetime import datetime
import numpy as np


# ==============================================================================
# Logging Configuration
# ==============================================================================

def setup_logger(name: str = "ml_pipeline", log_dir: str = "backend/logs") -> logging.Logger:
    """
    Configure and return a logger for the ML pipeline.
    
    Logs are written to both file and console with timestamps and severity levels.
    
    Args:
        name: Logger name (default: "ml_pipeline")
        log_dir: Directory for log files (default: "backend/logs")
    
    Returns:
        Configured logger instance
    """
    log_path = Path(log_dir)
    log_path.mkdir(parents=True, exist_ok=True)
    
    logger = logging.getLogger(name)
    
    # Avoid duplicate handlers if logger already configured
    if logger.handlers:
        return logger
    
    logger.setLevel(logging.DEBUG)
    
    # Formatter: [TIMESTAMP] [LEVEL] [LOGGER_NAME] Message
    formatter = logging.Formatter(
        '[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # File handler with rotation
    file_handler = logging.handlers.RotatingFileHandler(
        log_path / "ml_pipeline.log",
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    # Console handler for INFO and above
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    return logger


# Global logger instance
logger = setup_logger()


# ==============================================================================
# Feature Vector Construction
# ==============================================================================

def build_feature_vector_from_site_features(
    site_features: Dict[str, Optional[float]]
) -> Dict[str, Any]:
    """
    Construct a structured feature vector from extracted site features.
    
    Enforces fixed ordering and schema compliance per docs/examples/feature_schema.json:
    [ndvi_mean, ndvi_std, rainfall_mm, temp_mean_c, elevation_m]
    
    Args:
        site_features: Dictionary with keys: ndvi_mean, ndvi_std, rainfall_mm, 
                      temp_mean_c, elevation_m (values can be float or None)
    
    Returns:
        Dictionary with:
        - 'feature_vector': numpy array of ordered features (NaN for missing)
        - 'features': original features dict
        - 'is_complete': boolean (True if all features present)
        - 'missing_fields': list of fields that were None
    """
    required_fields = [
        'ndvi_mean',
        'ndvi_std',
        'rainfall_mm',
        'temp_mean_c',
        'elevation_m'
    ]
    
    # Extract in fixed order
    vector = []
    missing_fields = []
    
    for field in required_fields:
        value = site_features.get(field)
        if value is None:
            vector.append(np.nan)
            missing_fields.append(field)
        else:
            vector.append(float(value))
    
    return {
        'feature_vector': np.array(vector, dtype=np.float32),
        'features': site_features,
        'is_complete': len(missing_fields) == 0,
        'missing_fields': missing_fields
    }


def validate_feature_vector(feature_vector: np.ndarray) -> Dict[str, Any]:
    """
    Validate a feature vector against schema constraints.
    
    Args:
        feature_vector: numpy array of 5 features
    
    Returns:
        Dictionary with:
        - 'valid': boolean
        - 'warnings': list of validation warnings
        - 'errors': list of validation errors
    """
    warnings = []
    errors = []
    
    if len(feature_vector) != 5:
        errors.append(f"Feature vector must have 5 elements, got {len(feature_vector)}")
        return {'valid': False, 'warnings': warnings, 'errors': errors}
    
    ndvi_mean, ndvi_std, rainfall_mm, temp_mean_c, elevation_m = feature_vector
    
    # NDVI mean constraints: -1 to 1
    if not np.isnan(ndvi_mean):
        if ndvi_mean < -1.0 or ndvi_mean > 1.0:
            errors.append(f"ndvi_mean {ndvi_mean} outside valid range [-1, 1]")
        if ndvi_mean < 0.0:
            warnings.append(f"ndvi_mean {ndvi_mean} is negative (typically indicates water/cloud)")
    
    # NDVI std constraints: 0 to 1
    if not np.isnan(ndvi_std):
        if ndvi_std < 0.0 or ndvi_std > 1.0:
            errors.append(f"ndvi_std {ndvi_std} outside valid range [0, 1]")
    
    # Rainfall constraints: >= 0
    if not np.isnan(rainfall_mm):
        if rainfall_mm < 0.0:
            errors.append(f"rainfall_mm {rainfall_mm} cannot be negative")
        if rainfall_mm < 50.0:
            warnings.append(f"rainfall_mm {rainfall_mm} is very low (potential arid region)")
        if rainfall_mm > 5000.0:
            warnings.append(f"rainfall_mm {rainfall_mm} is very high (potential data error)")
    
    # Temperature constraints: -50 to 50°C
    if not np.isnan(temp_mean_c):
        if temp_mean_c < -50.0 or temp_mean_c > 50.0:
            errors.append(f"temp_mean_c {temp_mean_c} outside valid range [-50, 50]")
        if temp_mean_c < 5.0 or temp_mean_c > 35.0:
            warnings.append(f"temp_mean_c {temp_mean_c} outside typical terrestrial range [5, 35]°C")
    
    # Elevation constraints: 0 to 5895m (Mt. Everest)
    if not np.isnan(elevation_m):
        if elevation_m < 0.0 or elevation_m > 5895.0:
            errors.append(f"elevation_m {elevation_m} outside valid range [0, 5895]")
    
    return {
        'valid': len(errors) == 0,
        'warnings': warnings,
        'errors': errors
    }


# ==============================================================================
# Data Format Helpers
# ==============================================================================

def dict_to_json(data: Dict[str, Any], filepath: str, pretty: bool = True) -> None:
    """
    Save a dictionary to JSON file.
    
    Args:
        data: Dictionary to save
        filepath: Output file path
        pretty: Whether to prettify output (default: True)
    """
    Path(filepath).parent.mkdir(parents=True, exist_ok=True)
    
    with open(filepath, 'w') as f:
        json.dump(
            data,
            f,
            indent=2 if pretty else None,
            default=str  # Convert non-serializable objects (e.g., datetime, numpy types) to strings
        )
    
    logger.info(f"Saved to {filepath}")


def load_json(filepath: str) -> Dict[str, Any]:
    """
    Load a JSON file.
    
    Args:
        filepath: Input file path
    
    Returns:
        Parsed dictionary
    """
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    logger.info(f"Loaded from {filepath}")
    return data


# ==============================================================================
# Metadata & Provenance
# ==============================================================================

def create_feature_metadata(
    site_id: str,
    data_sources: Optional[Dict[str, str]] = None,
    sentinel2_date: Optional[str] = None,
    sentinel2_cloud_percentage: Optional[float] = None,
    processing_notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create metadata dictionary for feature provenance tracking.
    
    Args:
        site_id: Site identifier
        data_sources: Dict mapping feature type to source (e.g., {'ndvi': 'Sentinel-2'})
        sentinel2_date: Date of Sentinel-2 acquisition (YYYY-MM-DD)
        sentinel2_cloud_percentage: Cloud cover percentage
        processing_notes: Any processing notes or warnings
    
    Returns:
        Metadata dictionary
    """
    default_sources = {
        'ndvi': 'Sentinel-2',
        'rainfall': 'Unknown',
        'temperature': 'Unknown',
        'elevation': 'Unknown'
    }
    
    if data_sources:
        default_sources.update(data_sources)
    
    return {
        'site_id': site_id,
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'sentinel2_date': sentinel2_date,
        'sentinel2_cloud_percentage': sentinel2_cloud_percentage,
        'data_sources': default_sources,
        'processing_notes': processing_notes
    }


# ==============================================================================
# Constants
# ==============================================================================

# Feature field names in order
FEATURE_FIELDS = [
    'ndvi_mean',
    'ndvi_std',
    'rainfall_mm',
    'temp_mean_c',
    'elevation_m'
]

# Feature units for display/documentation
FEATURE_UNITS = {
    'ndvi_mean': 'unitless (-1 to 1)',
    'ndvi_std': 'unitless (0 to 1)',
    'rainfall_mm': 'millimeters (mm)',
    'temp_mean_c': 'degrees Celsius (°C)',
    'elevation_m': 'meters (m)'
}

# Valid ranges for validation
FEATURE_RANGES = {
    'ndvi_mean': (-1.0, 1.0),
    'ndvi_std': (0.0, 1.0),
    'rainfall_mm': (0.0, 5000.0),
    'temp_mean_c': (-50.0, 50.0),
    'elevation_m': (0.0, 5895.0)
}
