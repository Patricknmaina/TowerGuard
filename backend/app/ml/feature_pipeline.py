"""
Unified Feature Pipeline adapted for MongoDB persistence.

Uses TowerGuard environmental clients to populate Mongo collections.
"""

import logging
from datetime import datetime, timezone
from uuid import UUID, uuid4

from pymongo.database import Database
from shapely.geometry import shape

from app.ml.drive_uploader import maybe_upload_ndvi
from app.ml.environmental_api_client import (
    CHIRPSClient,
    NASAPOWERClient,
    SoilGridsClient
)
from app.ml.gee_ndvi import compute_ndvi_stats

log = logging.getLogger(__name__)


async def extract_features_for_site(
    db: Database,
    site_id: UUID,
    start_date: str,
    end_date: str
) -> dict:
    """
    Fetch and store site-level environmental features using MongoDB.

    Args:
        db: MongoDB Database instance
        site_id: UUID of the site to score
        start_date: Start date in YYYY-MM-DD
        end_date: End date in YYYY-MM-DD

    Returns:
        Document stored in the site_features collection
    """
    site_doc = db["sites"].find_one({"id": str(site_id)})

    if not site_doc:
        raise ValueError(f"Site {site_id} not found")

    geom = shape(site_doc["geometry"])
    centroid = geom.centroid
    lat, lon = centroid.y, centroid.x

    is_partial = False

    chirps_client = CHIRPSClient()
    nasa_client = NASAPOWERClient()
    soil_client = SoilGridsClient()

    rainfall_mm = chirps_client.get_rainfall_for_location(lat, lon)
    if rainfall_mm is None:
        is_partial = True
        rainfall_mm = 0.0

    temp_tuple = nasa_client.get_temperature_climatology(lat, lon)
    if temp_tuple and len(temp_tuple) == 3:
        _, tmin_c, tmax_c = temp_tuple
    elif temp_tuple and len(temp_tuple) == 2:
        tmin_c, tmax_c = temp_tuple
    else:
        is_partial = True
        tmin_c, tmax_c = 0.0, 0.0

    soil_props = soil_client.get_soil_properties(lat, lon)
    if soil_props:
        soc = soil_props.get("soc", 0.0)
        sand = soil_props.get("sand", 0.0)
        clay = soil_props.get("clay", 0.0)
        silt = soil_props.get("silt", 0.0)
        ph = soil_props.get("ph", 0.0)
    else:
        is_partial = True
        soc = sand = clay = silt = ph = 0.0

    ndvi_stats = {}
    try:
        ndvi_stats = compute_ndvi_stats(
            geometry=site_doc["geometry"],
            start_date=start_date,
            end_date=end_date,
        )
        ndvi_mean = ndvi_stats.get("ndvi_mean")
        ndvi_std = ndvi_stats.get("ndvi_std")
        if ndvi_mean is None or ndvi_std is None:
            is_partial = True
        else:
            is_partial = is_partial or False
    except Exception as exc:
        log.warning("NDVI stats unavailable: %s", exc)
        ndvi_mean = None
        ndvi_std = None
        ndvi_stats = {
            "collection_used": "unknown",
            "start_date": start_date,
            "end_date": end_date,
        }
        is_partial = True

    source_breakdown = {
        "rainfall": {"source": "CHIRPS", "value": rainfall_mm, "available": rainfall_mm > 0},
        "temperature": {"source": "NASA POWER", "tmin": tmin_c, "tmax": tmax_c, "available": temp_tuple is not None},
        "soil": {"source": "SoilGrids", "properties": soil_props, "available": soil_props is not None},
        "ndvi": {"source": "Sentinel-2", "available": False, "note": "Requires imagery paths"}
    }

    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()

    days_in_period = (end_date_obj - start_date_obj).days + 1
    rainfall_mean_mm_per_day = rainfall_mm / 365.0 if rainfall_mm else 0.0
    rainfall_total_mm = rainfall_mean_mm_per_day * days_in_period

    solar_radiation = None

    now = datetime.utcnow()
    features_doc = {
        "id": str(uuid4()),
        "site_id": str(site_id),
        "start_date": datetime.combine(start_date_obj, datetime.min.time(), tzinfo=timezone.utc),
        "end_date": datetime.combine(end_date_obj, datetime.min.time(), tzinfo=timezone.utc),
        "ndvi_mean": ndvi_mean,
        "ndvi_std": ndvi_std,
        "rainfall_total_mm": rainfall_total_mm,
        "rainfall_mean_mm_per_day": rainfall_mean_mm_per_day,
        "tmin_c": tmin_c,
        "tmax_c": tmax_c,
        "solar_radiation": solar_radiation,
        "soc": soc,
        "sand": sand,
        "clay": clay,
        "silt": silt,
        "ph": ph,
        "source_breakdown": source_breakdown,
        "partial": is_partial,
        "created_at": now,
        "updated_at": now,
    }

    source_breakdown["ndvi"]["available"] = ndvi_mean is not None

    ndvi_meta = {
        "collection": ndvi_stats.get("collection_used"),
        "start_date": ndvi_stats.get("start_date"),
        "end_date": ndvi_stats.get("end_date"),
    }
    drive_file_id = None
    try:
        drive_file_id = maybe_upload_ndvi(str(site_id), ndvi_stats)
    except Exception as exc:
        log.warning("NDVI Drive upload failed: %s", exc)
    if drive_file_id:
        ndvi_meta["drive_file_id"] = drive_file_id
    features_doc["ndvi_meta"] = ndvi_meta

    db["site_features"].insert_one(features_doc)
    return features_doc
