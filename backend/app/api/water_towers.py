from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from app.db.session import get_db
from app.schemas.water_towers import WaterTowerRead
from app.services.tower_enrichment_service import enrich_water_tower, enrich_all_water_towers

router = APIRouter()


def _serialize_water_tower(doc: dict) -> dict:
    """Serialize Mongo document to Pydantic schema."""
    return {
        "id": doc["id"],
        "name": doc["name"],
        "counties": doc.get("counties"),
        "geometry": doc.get("geometry"),
        "area_ha": doc.get("area_ha"),
        "description": doc.get("description"),
        "metadata": doc.get("metadata"),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }


@router.get("/water-towers")
async def list_water_towers(
    skip: int = 0,
    limit: int = 100,
    db: Database = Depends(get_db)
):
    """List all water towers from MongoDB."""
    cursor = (
        db["water_towers"]
        .find()
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    return [WaterTowerRead.model_validate(_serialize_water_tower(doc)) for doc in cursor]


@router.get("/water-towers/{water_tower_id}")
async def get_water_tower(
    water_tower_id: str,
    db: Database = Depends(get_db)
):
    """Get a specific water tower."""
    doc = db["water_towers"].find_one({"id": water_tower_id})

    if not doc:
        raise HTTPException(status_code=404, detail="Water tower not found")

    return WaterTowerRead.model_validate(_serialize_water_tower(doc))


@router.post("/water-towers/{water_tower_id}/enrich")
async def enrich_single_water_tower(
    water_tower_id: str,
    ndvi_start: str = "2024-01-01",
    ndvi_end: str = "2024-12-31",
    db: Database = Depends(get_db),
):
    """
    Enrich a single water tower with NDVI, climate, and soil summaries.
    """
    try:
        updated = await enrich_water_tower(db, water_tower_id, ndvi_start=ndvi_start, ndvi_end=ndvi_end)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Enrichment failed: {exc}")
    return WaterTowerRead.model_validate(_serialize_water_tower(updated))


@router.post("/water-towers/enrich-all")
async def enrich_all_towers(
    ndvi_start: str = "2024-01-01",
    ndvi_end: str = "2024-12-31",
    db: Database = Depends(get_db),
):
    """
    Enrich all towers sequentially (avoid hammering external APIs).
    """
    try:
        updated = await enrich_all_water_towers(db, ndvi_start=ndvi_start, ndvi_end=ndvi_end)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Bulk enrichment failed: {exc}")
    return [WaterTowerRead.model_validate(_serialize_water_tower(doc)) for doc in updated]
