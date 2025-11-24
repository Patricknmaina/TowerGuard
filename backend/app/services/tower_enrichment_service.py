from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional, Tuple

from pymongo.database import Database
from shapely.geometry import shape

from app.ml.environmental_api_client import CHIRPSClient, NASAPOWERClient, SoilGridsClient
from app.ml.gee_ndvi import compute_ndvi_stats

log = logging.getLogger(__name__)


def _get_centroid_latlon(tower_doc: dict[str, Any]) -> Optional[Tuple[float, float]]:
    """
    Extract a representative lat/lon from the tower geometry or metadata.

    Returns:
        (lat, lon) tuple or None if unavailable.
    """
    geom = tower_doc.get("geometry")
    if geom:
        try:
            centroid = shape(geom).centroid
            return centroid.y, centroid.x
        except Exception as exc:  # pragma: no cover - defensive
            log.warning("Failed to compute centroid for tower %s: %s", tower_doc.get("id"), exc)

    meta = tower_doc.get("metadata") or {}
    lat = meta.get("latitude") or tower_doc.get("latitude")
    lon = meta.get("longitude") or tower_doc.get("longitude")
    if lat is not None and lon is not None:
        try:
            return float(lat), float(lon)
        except Exception:
            return None
    return None


def _calc_health_score_from_ndvi(ndvi_mean: Optional[float]) -> Optional[float]:
    """Normalize NDVI (-1..1 or 0..1) to 0..1 health score."""
    if ndvi_mean is None:
        return None
    if -1.0 <= ndvi_mean <= 1.0:
        # Raw NDVI, normalize to 0..1
        return max(0.0, min(1.0, (ndvi_mean + 1.0) / 2.0))
    if 0.0 <= ndvi_mean <= 1.0:
        return ndvi_mean
    return None


async def enrich_water_tower(
    db: Database,
    water_tower_id: str,
    ndvi_start: str = "2024-01-01",
    ndvi_end: str = "2024-12-31",
    baseline_start: Optional[str] = None,
    baseline_end: Optional[str] = None,
) -> dict[str, Any]:
    """
    Fetch and persist NDVI, climate, and soil summaries for a single water tower.

    This uses existing environmental clients (CHIRPS, NASA POWER, SoilGrids) and
    Sentinel-2 NDVI (via gee_ndvi) to populate tower.metadata.
    """
    tower_doc = db["water_towers"].find_one({"id": water_tower_id})
    if not tower_doc:
        raise ValueError(f"Water tower {water_tower_id} not found")

    latlon = _get_centroid_latlon(tower_doc)
    if not latlon:
        raise ValueError(f"Water tower {water_tower_id} is missing geometry/centroid")
    lat, lon = latlon

    # Clients
    chirps = CHIRPSClient()
    nasa = NASAPOWERClient()
    soil = SoilGridsClient()

    # Climate
    rainfall_mm = chirps.get_rainfall_for_location(lat, lon)
    temp_tuple = nasa.get_temperature_climatology(lat, lon) or (None, None, None)
    temp_mean, tmin_c, tmax_c = temp_tuple

    # Soil
    log.info(f"Fetching soil properties for {water_tower_id} at ({lat}, {lon})")
    soil_props = soil.get_soil_properties(lat, lon) or {}
    if soil_props:
        log.info(f"Soil data received: sand={soil_props.get('sand')}, clay={soil_props.get('clay')}, silt={soil_props.get('silt')}")
    else:
        log.warning(f"No soil data retrieved for {water_tower_id}")

    # NDVI (current window)
    ndvi_mean = None
    ndvi_std = None
    ndvi_meta: dict[str, Any] = {}
    try:
        ndvi_stats = compute_ndvi_stats(
            geometry=tower_doc.get("geometry"),
            start_date=ndvi_start,
            end_date=ndvi_end,
        )
        ndvi_mean = ndvi_stats.get("ndvi_mean")
        ndvi_std = ndvi_stats.get("ndvi_std")
        ndvi_meta = {
            "collection": ndvi_stats.get("collection_used"),
            "start_date": ndvi_stats.get("start_date"),
            "end_date": ndvi_stats.get("end_date"),
        }
    except Exception as exc:  # pragma: no cover - NDVI optional
        log.warning("NDVI computation failed for %s: %s", water_tower_id, exc)

    # NDVI baseline (seasonal median/delta)
    ndvi_baseline_mean = None
    ndvi_baseline_std = None
    ndvi_delta = None
    # Default baseline: same window, previous year
    if baseline_start is None or baseline_end is None:
        try:
            year = datetime.utcnow().year
            baseline_start = ndvi_start.replace(str(year), str(year - 1))
            baseline_end = ndvi_end.replace(str(year), str(year - 1))
        except Exception:
            baseline_start = baseline_start or ndvi_start
            baseline_end = baseline_end or ndvi_end

    try:
        baseline_stats = compute_ndvi_stats(
            geometry=tower_doc.get("geometry"),
            start_date=baseline_start,
            end_date=baseline_end,
        )
        ndvi_baseline_mean = baseline_stats.get("ndvi_mean")
        ndvi_baseline_std = baseline_stats.get("ndvi_std")
        if ndvi_mean is not None and ndvi_baseline_mean is not None:
            ndvi_delta = ndvi_mean - ndvi_baseline_mean
    except Exception as exc:  # pragma: no cover - baseline optional
        log.warning("NDVI baseline computation failed for %s: %s", water_tower_id, exc)

    health_score = _calc_health_score_from_ndvi(ndvi_mean)
    health_baseline = _calc_health_score_from_ndvi(ndvi_baseline_mean)

    metadata_updates = {
        "ndvi_mean": ndvi_mean,
        "ndvi_std": ndvi_std,
        "ndvi_baseline_mean": ndvi_baseline_mean,
        "ndvi_baseline_std": ndvi_baseline_std,
        "ndvi_delta": ndvi_delta,
        "health_score": health_score,
        "health_baseline": health_baseline,
        "rainfall_mm": rainfall_mm,
        "temp_mean_c": temp_mean,
        "tmin_c": tmin_c,
        "tmax_c": tmax_c,
        "ph": soil_props.get("ph"),
        "soc": soil_props.get("soc"),
        "sand": soil_props.get("sand"),
        "silt": soil_props.get("silt"),
        "clay": soil_props.get("clay"),
        "bulk_density": soil_props.get("bulk_density"),
        "ndvi_meta": ndvi_meta or None,
        "ndvi_baseline_window": {"start": baseline_start, "end": baseline_end},
    }

    db["water_towers"].update_one(
        {"id": water_tower_id},
        {
            "$set": {
                "metadata": {**(tower_doc.get("metadata") or {}), **metadata_updates},
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    return db["water_towers"].find_one({"id": water_tower_id})


async def enrich_all_water_towers(
    db: Database,
    ndvi_start: str = "2024-01-01",
    ndvi_end: str = "2024-12-31",
) -> list[dict[str, Any]]:
    """
    Iterate over all towers and enrich them one by one.

    This is intentionally sequential to avoid hammering external APIs.
    """
    updated_docs: list[dict[str, Any]] = []
    cursor = db["water_towers"].find()
    for tower in cursor:
        try:
            updated = await enrich_water_tower(
                db=db,
                water_tower_id=tower["id"],
                ndvi_start=ndvi_start,
                ndvi_end=ndvi_end,
            )
            if updated:
                updated_docs.append(updated)
        except Exception as exc:  # pragma: no cover - batch resilience
            log.warning("Enrichment failed for %s: %s", tower.get("id"), exc)
    return updated_docs
