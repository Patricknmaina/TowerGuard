import json
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any
from uuid import uuid4

from shapely.geometry import mapping, shape
from pymongo.database import Database

SITES_GEOJSON_PATH = Path(__file__).parent.parent.parent / "data" / "sites" / "demo_sites_water_towers.geojson"
TOWERS_GEOJSON_PATH = Path(__file__).parent.parent.parent / "data" / "water_towers" / "kenya_water_towers_18.geojson"
TOWERS_BUFFER_PATH = Path(__file__).parent.parent.parent / "data" / "water_towers" / "kenya_water_towers_18_buffers_2km.geojson"
BUFFER_ID_ALIASES = {
    "mount_kenya": "mt_kenya",
    "mount_elgon": "mt_elgon",
    "mau_forest_complex": "mau_forest_complex",
    "mathews_range": "matthews_range",
    "kirisia_hills": "lerroghi_kirisia_hills",
    "mount_kipipiri": "mt_kipipiri",
    "mount_kulal": "mt_kulal",
    "mount_marsabit": "mt_marsabit",
    "mount_nyiru": "mt_nyiru",
}


@lru_cache(maxsize=1)
def _load_geojson(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"GeoJSON missing at {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def _geometry_has_coords(geom: dict[str, Any]) -> bool:
    def contains_number(value: Any) -> bool:
        if isinstance(value, (int, float)):
            return True
        if isinstance(value, list):
            return any(contains_number(item) for item in value)
        return False

    coords = geom.get("coordinates")
    return bool(coords and contains_number(coords))


def _build_site_document(
    name: str,
    geometry: dict[str, Any],
    water_tower_id: str,
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    shapely_geom = shape(geometry)
    return {
        "id": str(uuid4()),
        "name": name,
        "description": "Auto-created from canonical GeoJSON for analytics",
        "geometry": mapping(shapely_geom),
        "country": "Kenya",
        "water_tower_id": water_tower_id,
        "created_at": now,
        "updated_at": now,
    }


def ensure_site_for_water_tower(db: Database, water_tower_id: str) -> dict[str, Any]:
    existing = db["sites"].find_one({"water_tower_id": water_tower_id})
    if existing:
        return existing

    demo_geojson = _load_geojson(SITES_GEOJSON_PATH)
    matching_demo = None
    for feature in demo_geojson.get("features", []):
        props = feature.get("properties", {})
        if str(props.get("water_tower_id")) == str(water_tower_id):
            matching_demo = feature
            break

    if matching_demo:
        geometry = matching_demo.get("geometry")
        name = matching_demo.get("properties", {}).get("name", "Demo site")
    else:
        towers_geojson = _load_geojson(TOWERS_GEOJSON_PATH)
        matching_tower = None
        for feature in towers_geojson.get("features", []):
            props = feature.get("properties", {})
            if str(props.get("id")) == str(water_tower_id) or str(props.get("water_tower_id")) == str(water_tower_id):
                matching_tower = feature
                break
        if not matching_tower:
            raise ValueError(f"Water tower {water_tower_id} not found in canonical data")
        geometry = matching_tower.get("geometry")
        name = (matching_tower.get("properties", {}) or {}).get("name", "Auto site")

    if not geometry or not _geometry_has_coords(geometry):
        buffer_geojson = _load_geojson(TOWERS_BUFFER_PATH)
        buffer_match = None
        expected_id = BUFFER_ID_ALIASES.get(water_tower_id, water_tower_id)
        for feature in buffer_geojson.get("features", []):
            props = feature.get("properties", {})
            if str(props.get("id")) == str(water_tower_id) or str(props.get("id")) == expected_id:
                buffer_match = feature
                break
        if buffer_match:
            geometry = buffer_match.get("geometry")
        else:
            raise ValueError(f"Geometry missing for water tower {water_tower_id}")

    if not _geometry_has_coords(geometry):
        raise ValueError(f"Geometry for water tower {water_tower_id} is empty")

    doc = _build_site_document(name=name, geometry=geometry, water_tower_id=water_tower_id)
    db["sites"].insert_one(doc)
    return doc
