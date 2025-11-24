from collections import defaultdict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo.database import Database

from app.db.session import get_db
from app.schemas.biodiversity import BiodiversityRecordRead, BiodiversitySpeciesRead

router = APIRouter()


def _serialize_record(doc: dict) -> dict:
    """Prepare Mongo document for Pydantic schema without coercing IDs."""
    return {
        "id": str(doc.get("id")),
        "scientific_name": doc.get("scientific_name"),
        "local_name": doc.get("local_name"),
        "english_common_name": doc.get("english_common_name"),
        "lat": doc.get("lat"),
        "lon": doc.get("lon"),
        "site_id": doc.get("site_id"),
        "water_tower_id": doc.get("water_tower_id"),
        "observed_at": doc.get("observed_at"),
        "source": doc.get("source"),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }


@router.get("/biodiversity")
async def get_biodiversity(
    site_id: UUID | None = Query(None),
    water_tower_id: str | None = Query(None),
    db: Database = Depends(get_db)
):
    """Get biodiversity data aggregated by species."""
    if not site_id and not water_tower_id:
        raise HTTPException(
            status_code=400,
            detail="Must provide either site_id or water_tower_id"
        )

    query: dict[str, str] = {}
    if site_id:
        query["site_id"] = str(site_id)
    if water_tower_id:
        slug = water_tower_id.strip().lower().replace(" ", "_")
        query["water_tower_id"] = slug

    cursor = db["biodiversity_records"].find(query)
    species_map: dict[tuple[str, str | None, str | None], list[BiodiversityRecordRead]] = defaultdict(list)

    for doc in cursor:
        record = BiodiversityRecordRead.model_validate(_serialize_record(doc))
        key = (record.scientific_name, record.local_name, record.english_common_name)
        species_map[key].append(record)

    response = []
    for (scientific_name, local_name, english_common_name), records in species_map.items():
        water_slug = records[0].water_tower_id if records else None
        response.append(
            BiodiversitySpeciesRead(
                scientific_name=scientific_name,
                local_name=local_name,
                english_common_name=english_common_name,
                water_tower_id=water_slug,
                species_id=records[0].id if records else "",
                records=records,
            )
        )

    return response
