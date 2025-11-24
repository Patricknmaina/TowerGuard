"""
Unified ML Model Module - MongoDB edition.

Wraps the TowerGuard scoring system for use with Mongo features/predictions.
"""

from datetime import datetime
from uuid import uuid4

from pymongo.database import Database

from app.ml.features import SiteFeatures as SiteFeaturesDataclass
from app.ml.models import SiteRiskModel

SITE_RISK_MODEL = SiteRiskModel()


def compute_health_score(features: dict) -> float:
    """
    Compute deterministic health score using TowerGuard's rule-based system.
    """
    site_features = SiteFeaturesDataclass(
        site_id=features.get("site_id", "unknown"),
        ndvi_mean=features.get("ndvi_mean"),
        ndvi_std=features.get("ndvi_std"),
        rainfall_mm=features.get("rainfall_mm"),
        temp_mean_c=features.get("temp_mean_c"),
        elevation_m=features.get("elevation_m")
    )
    result = compute_health_score_with_explanation(site_features)
    return result["total_score"]


def create_prediction_for_site_features(
    db: Database,
    site_features_doc: dict,
    model_version: str = "rule-based-v2-towerguard"
) -> dict:
    """
    Store a prediction document derived from features.
    """
    rainfall_mm = (
        site_features_doc.get("rainfall_mean_mm_per_day") * 365
        if site_features_doc.get("rainfall_mean_mm_per_day") is not None
        else None
    )
    temp_mean_c = None
    tmin = site_features_doc.get("tmin_c")
    tmax = site_features_doc.get("tmax_c")
    if tmin is not None and tmax is not None:
        temp_mean_c = (tmin + tmax) / 2

    features_dataclass = SiteFeaturesDataclass(
        site_id=site_features_doc["site_id"],
        ndvi_mean=site_features_doc.get("ndvi_mean"),
        ndvi_std=site_features_doc.get("ndvi_std"),
        rainfall_mm=rainfall_mm,
        temp_mean_c=temp_mean_c,
        elevation_m=None
    )

    rainfall_mm = (
        site_features_doc.get("rainfall_mean_mm_per_day") * 365
        if site_features_doc.get("rainfall_mean_mm_per_day") is not None
        else None
    )
    temp_mean_c = None
    tmin = site_features_doc.get("tmin_c")
    tmax = site_features_doc.get("tmax_c")
    if tmin is not None and tmax is not None:
        temp_mean_c = (tmin + tmax) / 2

    feature_payload = {
        "site_id": site_features_doc["site_id"],
        "ndvi_mean": site_features_doc.get("ndvi_mean"),
        "ndvi_std": site_features_doc.get("ndvi_std"),
        "rainfall_mean": rainfall_mm,
        "temp_mean": temp_mean_c,
        "soil_index": site_features_doc.get("soc"),
    }

    model_result = SITE_RISK_MODEL.predict(feature_payload)
    score = model_result["score"]
    reasoning = model_result["reasoning"]
    model_version = model_result["model_version"]

    now = site_features_doc.get("created_at")
    prediction_doc = {
        "id": str(uuid4()),
        "site_id": site_features_doc["site_id"],
        "features_id": site_features_doc["id"],
        "score": score,
        "model_version": model_version,
        "partial": site_features_doc.get("partial", False),
        "prediction_metadata": {
            "explanation": reasoning,
            "inputs": feature_payload,
        },
        "created_at": now or datetime.utcnow(),
        "updated_at": now or datetime.utcnow(),
    }

    db["site_predictions"].insert_one(prediction_doc)
    return prediction_doc
