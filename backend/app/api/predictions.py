from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from app.db.session import get_db
from app.ml.model import create_prediction_for_site_features
from app.schemas.predictions import PredictionRequestBody, SitePredictionRead

router = APIRouter()


def _serialize_prediction(doc: dict) -> dict:
    """Convert Mongo document to Pydantic-friendly data."""
    return {
        "id": UUID(doc["id"]),
        "site_id": UUID(doc["site_id"]),
        "features_id": UUID(doc["features_id"]) if doc.get("features_id") else None,
        "score": doc["score"],
        "model_version": doc["model_version"],
        "partial": doc.get("partial", False),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }


@router.post("/sites/{site_id}/predict", status_code=201)
async def create_prediction(
    site_id: UUID,
    request: PredictionRequestBody | None = None,
    db: Database = Depends(get_db)
):
    """Create a prediction."""
    features_collection = db["site_features"]

    if request and request.features_id:
        features_doc = features_collection.find_one({"id": str(request.features_id)})
        if not features_doc:
            raise HTTPException(status_code=404, detail="Features not found")
        if features_doc["site_id"] != str(site_id):
            raise HTTPException(status_code=400, detail="Features do not belong to this site")
    else:
        features_doc = features_collection.find_one(
            {"site_id": str(site_id)},
            sort=[("created_at", -1)]
        )
        if not features_doc:
            raise HTTPException(
                status_code=404,
                detail="No features found for this site. Please extract features first."
            )

    prediction_doc = create_prediction_for_site_features(db, features_doc)
    return SitePredictionRead.model_validate(_serialize_prediction(prediction_doc))


@router.get("/sites/{site_id}/predictions")
async def list_predictions(
    site_id: UUID,
    skip: int = 0,
    limit: int = 10,
    db: Database = Depends(get_db)
):
    """List predictions for a site."""
    cursor = (
        db["site_predictions"]
        .find({"site_id": str(site_id)})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    return [SitePredictionRead.model_validate(_serialize_prediction(doc)) for doc in cursor]
