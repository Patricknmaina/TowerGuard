import csv
import json
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from pymongo.database import Database
from shapely.geometry import mapping, shape


def _current_timestamp():
    return datetime.utcnow()

def _geometry_has_numbers(geom: dict[str, Any] | None) -> bool:
    """Return True if the geometry contains numeric coordinates."""
    if not geom:
        return False

    coords = geom.get("coordinates")
    if not coords:
        return False

    def contains_number(value: Any) -> bool:
        if isinstance(value, (int, float)):
            return True
        if isinstance(value, list):
            return any(contains_number(item) for item in value)
        return False

    return contains_number(coords)


def _normalize_tower_key(value: str | None) -> str | None:
    """Normalize tower identifiers/names for loose matching."""
    if not value:
        return None
    normalized = "".join(ch.lower() for ch in value if ch.isalnum())
    return normalized or None


BUFFER_ID_ALIASES: dict[str, str] = {
    "mount_kenya": "mt_kenya",
    "mount_elgon": "mt_elgon",
    "mathews_range": "matthews_range",
    "kirisia_hills": "lerroghi_kirisia_hills",
    "mount_kipipiri": "mt_kipipiri",
    "mount_kulal": "mt_kulal",
    "mount_marsabit": "mt_marsabit",
    "mount_nyiru": "mt_nyiru",
}


def load_water_towers(db: Database) -> int:
    """Load canonical water towers into MongoDB."""
    collection = db["water_towers"]
    collection.drop()

    data_path = Path(__file__).parent.parent.parent / "data" / "water_towers" / "kenya_water_towers_18.geojson"
    buffer_path = Path(__file__).parent.parent.parent / "data" / "water_towers" / "kenya_water_towers_18_buffers_2km.geojson"
    if not data_path.exists():
        print(f"Water towers GeoJSON not found at {data_path}")
        return 0

    with open(data_path, "r", encoding="utf-8") as f:
        geojson = json.load(f)

    buffer_geometries: dict[str, dict[str, Any]] = {}
    buffer_by_name: dict[str, dict[str, Any]] = {}
    if buffer_path.exists():
        with open(buffer_path, "r", encoding="utf-8") as bf:
            buffer_geojson = json.load(bf)
        for feature in buffer_geojson.get("features", []):
            props = feature.get("properties", {})
            tower_id = props.get("id")
            geom = feature.get("geometry")
            if tower_id and _geometry_has_numbers(geom):
                buffer_geometries[str(tower_id)] = geom
                name_key = _normalize_tower_key(props.get("name"))
                if name_key:
                    buffer_by_name[name_key] = geom

    docs = []
    for feature in geojson.get("features", []):
        props = feature.get("properties", {})
        geom = feature.get("geometry")
        tower_id = props.get("id")
        name_key = _normalize_tower_key(props.get("name"))
        valid_geom = None

        if _geometry_has_numbers(geom):
            valid_geom = geom
        elif tower_id:
            valid_geom = buffer_geometries.get(str(tower_id))
            if not valid_geom:
                alias = BUFFER_ID_ALIASES.get(str(tower_id))
                if alias:
                    valid_geom = buffer_geometries.get(alias)
        if not valid_geom and name_key:
            valid_geom = buffer_by_name.get(name_key)

        if not valid_geom:
            continue

        doc = {
            "id": props.get("id") or str(uuid4()),
            "name": props.get("name"),
            "counties": props.get("counties"),
            "geometry": mapping(shape(valid_geom)),
            "area_ha": props.get("area_ha"),
            "description": props.get("description"),
            "metadata": props,
            "created_at": _current_timestamp(),
            "updated_at": _current_timestamp(),
        }
        docs.append(doc)

    if docs:
        collection.insert_many(docs)
    print(f"Loaded {len(docs)} water towers")
    return len(docs)


def load_nurseries(db: Database) -> int:
    """Load nursery locations from CSV fixtures."""
    collection = db["nurseries"]
    collection.drop()

    data_path = Path(__file__).parent.parent.parent / "data" / "nurseries" / "nurseries_kenya.csv"
    if not data_path.exists():
        print(f"Nurseries CSV not found at {data_path}")
        return 0

    # Map tower names to IDs for assignment
    water_towers = {doc["name"]: doc["id"] for doc in db["water_towers"].find()}

    docs = []
    with open(data_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            water_tower_id = None
            water_tower_name = row.get("water_tower")
            if water_tower_name:
                water_tower_id = water_towers.get(water_tower_name)

            doc = {
                "id": row.get("id") or str(uuid4()),
                "name": row.get("name"),
                "lat": float(row.get("lat")) if row.get("lat") else None,
                "lon": float(row.get("lon")) if row.get("lon") else None,
                "water_tower_id": water_tower_id,
                "metadata": {"raw": row},
                "created_at": _current_timestamp(),
                "updated_at": _current_timestamp(),
            }
            docs.append(doc)

    if docs:
        collection.insert_many(docs)
    print(f"Loaded {len(docs)} nurseries")
    return len(docs)


def load_biodiversity_records(db: Database) -> int:
    """Load biodiversity points and species names into MongoDB."""
    collection = db["biodiversity_records"]
    collection.drop()

    points_path = Path(__file__).parent.parent.parent / "data" / "biodiversity" / "biodiversity_points_enriched.csv"
    if not points_path.exists():
        print(f"Biodiversity points CSV not found at {points_path}")
        return 0

    docs = []
    with open(points_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            scientific_name = row.get("scientific_name")
            observed_at = None
            if row.get("observed_at"):
                try:
                    observed_at = datetime.strptime(row.get("observed_at"), "%Y-%m-%d").date()
                except ValueError:
                    observed_at = None

            slug = row.get("water_tower_id")
            if slug:
                slug = slug.strip().lower().replace(" ", "_")

            doc = {
                "id": row.get("id") or str(uuid4()),
                "scientific_name": scientific_name,
                "local_name": row.get("local_name"),
                "english_common_name": row.get("english_common_name"),
                "lat": float(row.get("lat")) if row.get("lat") else None,
                "lon": float(row.get("lon")) if row.get("lon") else None,
                "site_id": row.get("site_id"),
                "water_tower_id": slug,
                "source": row.get("source"),
                "notes_source": row.get("notes_source"),
                "observed_at": observed_at,
                "created_at": _current_timestamp(),
                "updated_at": _current_timestamp(),
            }
            docs.append(doc)

    if docs:
        collection.insert_many(docs)
    print(f"Loaded {len(docs)} biodiversity records")
    return len(docs)


def load_all_data(db: Database):
    """Load all canonical datasets."""
    print("Loading canonical datasets...")
    load_water_towers(db)
    load_nurseries(db)
    load_biodiversity_records(db)
    print("Finished loading datasets")
