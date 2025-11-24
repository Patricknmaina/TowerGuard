from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from app.db.session import get_db
from app.schemas.nurseries import NurseryRead

router = APIRouter()


def _serialize_nursery(doc: dict) -> dict:
    """Format Mongo document for Pydantic model."""
    return {
        "id": doc["id"],
        "name": doc["name"],
        "lat": doc.get("lat"),
        "lon": doc.get("lon"),
        "water_tower_id": doc.get("water_tower_id"),
        "metadata": doc.get("metadata"),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }


@router.get("/nurseries")
async def list_nurseries(
    skip: int = 0,
    limit: int = 100,
    db: Database = Depends(get_db)
):
    """List all nurseries."""
    cursor = (
        db["nurseries"]
        .find()
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    return [NurseryRead.model_validate(_serialize_nursery(doc)) for doc in cursor]


@router.get("/nurseries/{nursery_id}")
async def get_nursery(
    nursery_id: str,
    db: Database = Depends(get_db)
):
    """Get a specific nursery."""
    doc = db["nurseries"].find_one({"id": nursery_id})

    if not doc:
        raise HTTPException(status_code=404, detail="Nursery not found")

    return NurseryRead.model_validate(_serialize_nursery(doc))
