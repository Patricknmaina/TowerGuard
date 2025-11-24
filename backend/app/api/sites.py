from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database
from shapely.geometry import MultiPolygon, mapping, shape

from app.db.session import get_db
from app.schemas.site import SiteCreate, SiteRead
from app.services.site_ensure_service import ensure_site_for_water_tower

router = APIRouter()


def _serialize_site(doc: dict) -> dict:
    """Prepare Mongo document for Pydantic validation."""
    return {
        "id": UUID(doc["id"]),
        "name": doc["name"],
        "description": doc.get("description"),
        "geometry": doc.get("geometry"),
        "country": doc.get("country"),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
        "water_tower_id": doc.get("water_tower_id"),
    }


@router.get("/sites")
async def list_sites(
    skip: int = 0,
    limit: int = 100,
    db: Database = Depends(get_db)
):
    """List all sites from MongoDB."""
    collection = db["sites"]
    cursor = collection.find().sort("created_at", -1).skip(skip).limit(limit)
    return [SiteRead.model_validate(_serialize_site(doc)) for doc in cursor]


@router.post("/sites", status_code=201)
async def create_site(
    site_data: SiteCreate,
    db: Database = Depends(get_db)
):
    """Create a new site document in MongoDB."""
    shapely_geom = shape(site_data.geometry)

    if shapely_geom.geom_type == "Polygon":
        shapely_geom = MultiPolygon([shapely_geom])

    now = datetime.utcnow()
    site_id = str(uuid4())
    doc = {
        "id": site_id,
        "name": site_data.name,
        "description": site_data.description,
        "geometry": mapping(shapely_geom),
        "country": site_data.country,
        "created_at": now,
        "updated_at": now,
    }

    db["sites"].insert_one(doc)
    return SiteRead.model_validate(_serialize_site(doc))


@router.get("/sites/{site_id}")
async def get_site(
    site_id: UUID,
    db: Database = Depends(get_db)
):
    """Retrieve a specific site."""
    doc = db["sites"].find_one({"id": str(site_id)})

    if not doc:
        raise HTTPException(status_code=404, detail="Site not found")

    return SiteRead.model_validate(_serialize_site(doc))


@router.delete("/sites/{site_id}")
async def delete_site(
    site_id: UUID,
    db: Database = Depends(get_db)
):
    """Delete a site (dev only)."""
    result = db["sites"].delete_one({"id": str(site_id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Site not found")

    return {"status": "deleted", "id": site_id}


@router.post("/water-towers/{water_tower_id}/ensure-site", status_code=201)
async def ensure_site_for_tower(
    water_tower_id: str,
    db: Database = Depends(get_db),
):
    try:
        site_doc = ensure_site_for_water_tower(db, water_tower_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return SiteRead.model_validate(_serialize_site(site_doc))
