"""
TowerGuard ML Pipeline Package

End-to-end ML workflow for computing environmental health metrics for Kenya's water towers.

Modules:
- utils: Logging, feature vector construction, validation
- ndvi: Sentinel-2 NDVI computation pipeline
- features: Multi-source environmental feature extraction
- scoring: Rule-based health score computation
"""

__version__ = "0.1.0"
__author__ = "ML Engineer"

from .utils import setup_logger, build_feature_vector_from_site_features, validate_feature_vector
from .ndvi import compute_ndvi_for_site
from .features import extract_features_for_site, SiteFeatures
from .scoring import compute_health_score, create_prediction_for_site_features

__all__ = [
    'setup_logger',
    'build_feature_vector_from_site_features',
    'validate_feature_vector',
    'compute_ndvi_for_site',
    'extract_features_for_site',
    'SiteFeatures',
    'compute_health_score',
    'create_prediction_for_site_features',
]
