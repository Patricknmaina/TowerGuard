from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from app.db.session import get_db
from app.ml.feature_pipeline import extract_features_for_site
from app.schemas.features import FeatureRequestBody, SiteFeatureRead
from app.services.site_ensure_service import ensure_site_for_water_tower

router = APIRouter()


def _serialize_feature(doc: dict) -> dict:
    """Turn a Mongo document into Pydantic-friendly payload."""
    return {
        "id": UUID(doc["id"]),
        "site_id": UUID(doc["site_id"]),
        "start_date": doc["start_date"],
        "end_date": doc["end_date"],
        "ndvi_mean": doc.get("ndvi_mean"),
        "ndvi_std": doc.get("ndvi_std"),
        "rainfall_total_mm": doc.get("rainfall_total_mm"),
        "rainfall_mean_mm_per_day": doc.get("rainfall_mean_mm_per_day"),
        "tmin_c": doc.get("tmin_c"),
        "tmax_c": doc.get("tmax_c"),
        "solar_radiation": doc.get("solar_radiation"),
        "soc": doc.get("soc"),
        "sand": doc.get("sand"),
        "clay": doc.get("clay"),
        "silt": doc.get("silt"),
        "ph": doc.get("ph"),
        "source_breakdown": doc.get("source_breakdown"),
        "partial": doc.get("partial", False),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }


@router.post("/sites/{site_id}/features", status_code=201)
async def create_features(
    site_id: UUID,
    request: FeatureRequestBody,
    db: Database = Depends(get_db)
):
    """Extract features for a site."""
    site_doc = db["sites"].find_one({"id": str(site_id)})
    if not site_doc:
        raise HTTPException(
            status_code=404,
            detail="Site not found. Ensure a site exists (call /api/water-towers/{tower_id}/ensure-site) before extracting features.",
        )

    try:
        feature_doc = await extract_features_for_site(
            db=db,
            site_id=site_id,
            start_date=request.start_date,
            end_date=request.end_date,
        )
        return SiteFeatureRead.model_validate(_serialize_feature(feature_doc))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to extract features: {exc}")


@router.post("/water-towers/{water_tower_id}/features", status_code=201)
async def create_features_for_tower(
    water_tower_id: str,
    request: FeatureRequestBody,
    db: Database = Depends(get_db),
):
    try:
        site_doc = ensure_site_for_water_tower(db, water_tower_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    site_id = UUID(site_doc["id"])
    try:
        feature_doc = await extract_features_for_site(
            db=db,
            site_id=site_id,
            start_date=request.start_date,
            end_date=request.end_date,
        )
        return SiteFeatureRead.model_validate(_serialize_feature(feature_doc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to extract features: {exc}")


@router.get("/sites/{site_id}/features")
async def list_features(
    site_id: UUID,
    skip: int = 0,
    limit: int = 10,
    db: Database = Depends(get_db)
):
    """List features for a site."""
    cursor = (
        db["site_features"]
        .find({"site_id": str(site_id)})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    return [SiteFeatureRead.model_validate(_serialize_feature(doc)) for doc in cursor]
