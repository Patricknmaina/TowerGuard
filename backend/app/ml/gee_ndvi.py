from __future__ import annotations

import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, Optional
from pathlib import Path

import ee  # earthengine-api

log = logging.getLogger(__name__)

DEFAULT_COLLECTION = "COPERNICUS/S2_SR_HARMONIZED"
DEFAULT_SCALE = 10
_BASE_DIR = Path(__file__).resolve().parents[2]
_DEFAULT_SA_PATH = _BASE_DIR / "credentials" / "ee_service_account.json"
SERVICE_ACCOUNT_EMAIL = os.getenv(
    "EE_SERVICE_ACCOUNT_EMAIL",
    "gee-ndvi-sa@tower-guard-479011.iam.gserviceaccount.com",
)
SERVICE_ACCOUNT_JSON = os.getenv(
    "EE_SERVICE_ACCOUNT_JSON",
    str(_DEFAULT_SA_PATH),
)
_EE_INITIALIZED = False
_EE_DISABLED = False


def _init_ee() -> None:
    global _EE_INITIALIZED, _EE_DISABLED
    if _EE_INITIALIZED or _EE_DISABLED:
        return

    if os.getenv("EE_DISABLE", "").lower() in {"1", "true", "yes"}:
        _EE_DISABLED = True
        log.warning("Earth Engine disabled via EE_DISABLE; NDVI will be skipped.")
        return

    if not SERVICE_ACCOUNT_EMAIL:
        _EE_DISABLED = True
        raise RuntimeError("EE_SERVICE_ACCOUNT_EMAIL is not set")

    if not os.path.exists(SERVICE_ACCOUNT_JSON):
        _EE_DISABLED = True
        raise RuntimeError(f"EE service account JSON missing at {SERVICE_ACCOUNT_JSON}")

    credentials = ee.ServiceAccountCredentials(SERVICE_ACCOUNT_EMAIL, SERVICE_ACCOUNT_JSON)
    ee.Initialize(credentials)
    _EE_INITIALIZED = True
    log.info("Initialized Earth Engine for service account %s", SERVICE_ACCOUNT_EMAIL)


def _parse_geometry(
    geometry: Optional[Dict[str, Any]],
    lat: Optional[float],
    lon: Optional[float],
    buffer_m: int,
) -> ee.Geometry:
    if geometry:
        gtype = geometry.get("type")
        if gtype == "FeatureCollection":
            features = geometry.get("features", [])
            if not features:
                raise ValueError("Empty FeatureCollection provided to NDVI helper")
            geometry = features[0].get("geometry")
        elif gtype == "Feature":
            geometry = geometry.get("geometry")
        return ee.Geometry(geometry)

    if lat is None or lon is None:
        raise ValueError("Provide either GeoJSON geometry or lat/lon coordinates")

    return ee.Geometry.Point([lon, lat]).buffer(buffer_m)


def compute_ndvi_stats(
    geometry: Optional[Dict[str, Any]] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    buffer_m: int = 500,
    collection: str = DEFAULT_COLLECTION,
    scale: int = DEFAULT_SCALE,
) -> Dict[str, Optional[float]]:
    if not start_date or not end_date:
        raise ValueError("start_date and end_date are required")

    try:
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
    except ValueError as exc:
        raise ValueError("Dates must be in ISO format YYYY-MM-DD") from exc

    try:
        _init_ee()
        if _EE_DISABLED:
            raise RuntimeError("Earth Engine disabled; skipping NDVI computation")
        region = _parse_geometry(geometry, lat, lon, buffer_m)
        ic = (
            ee.ImageCollection(collection)
            .filterBounds(region)
            .filterDate(start.date().isoformat(), end.date().isoformat())
        )

        def mask_s2_clouds(img):
            qa = img.select("QA60")
            cloud_bit = 1 << 10
            cirrus_bit = 1 << 11
            mask = qa.bitwiseAnd(cloud_bit).eq(0).And(
                qa.bitwiseAnd(cirrus_bit).eq(0)
            )
            return img.updateMask(mask)

        if "S2" in collection.upper():
            ic = ic.map(mask_s2_clouds)

        size = ic.size().getInfo()
        if size == 0:
            log.warning("No Sentinel-2 imagery found for %s - %s", start_date, end_date)
            return {
                "ndvi_mean": None,
                "ndvi_std": None,
                "collection_used": collection,
                "start_date": start_date,
                "end_date": end_date,
            }

        def add_ndvi(img):
            ndvi = img.normalizedDifference(["B8", "B4"]).rename("NDVI")
            return img.addBands(ndvi)

        ndvi_ic = ic.map(add_ndvi)
        ndvi_img = ndvi_ic.select("NDVI").mean()

        stats = ndvi_img.reduceRegion(
            reducer=ee.Reducer.mean().combine(
                reducer2=ee.Reducer.stdDev(),
                sharedInputs=True,
            ),
            geometry=region,
            scale=scale,
            maxPixels=1e9,
            bestEffort=True,
        ).getInfo()

        return {
            "ndvi_mean": float(stats.get("NDVI_mean")) if stats.get("NDVI_mean") is not None else None,
            "ndvi_std": float(stats.get("NDVI_stdDev")) if stats.get("NDVI_stdDev") is not None else None,
            "collection_used": collection,
            "start_date": start_date,
            "end_date": end_date,
        }
    except Exception as exc:
        log.exception("NDVI calculation failed: %s", exc)
        return {
            "ndvi_mean": None,
            "ndvi_std": None,
            "collection_used": collection,
            "start_date": start_date,
            "end_date": end_date,
        }
