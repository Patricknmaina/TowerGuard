from fastapi import APIRouter, Depends
from pymongo.database import Database

from app.core.loaders import load_cfas
from app.db.session import get_db
from app.schemas.cfas import CFARead

router = APIRouter()


def _serialize_cfa(doc: dict) -> dict:
    return {
        "id": doc.get("id"),
        "name": doc.get("name"),
        "water_tower_id": doc.get("water_tower_id"),
        "county": doc.get("county"),
        "contact_email": doc.get("contact_email"),
        "website": doc.get("website"),
        "notes": doc.get("notes"),
        "source": doc.get("source"),
        "metadata": doc.get("metadata"),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }


def _ensure_cfas_loaded(db: Database) -> None:
    """Load CFAs from CSV if the collection is empty."""
    if db["cfas"].estimated_document_count() == 0:
        load_cfas(db)


@router.get("/cfas")
async def list_cfas(
    water_tower_id: str | None = None,
    skip: int = 0,
    limit: int = 200,
    db: Database = Depends(get_db),
):
    """List Community Forest Associations, optionally filtered by water tower."""
    _ensure_cfas_loaded(db)
    query = {"water_tower_id": water_tower_id} if water_tower_id else {}
    cursor = (
        db["cfas"]
        .find(query)
        .sort("name", 1)
        .skip(max(skip, 0))
        .limit(max(limit, 1))
    )
    return [CFARead.model_validate(_serialize_cfa(doc)) for doc in cursor]
