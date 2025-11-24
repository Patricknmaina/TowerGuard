import json
from pathlib import Path

from app.db.session import get_db
from app.services.site_ensure_service import ensure_site_for_water_tower

DATA_ROOT = Path(__file__).parent / "data"
TOWERS_SOURCE = DATA_ROOT / "water_towers" / "kenya_water_towers_18.geojson"


def _load_geojson(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"Missing GeoJSON: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    tower_geojson = _load_geojson(TOWERS_SOURCE)
    db = next(get_db())
    sites_coll = db["sites"]
    sites_coll.drop()

    ensured = []
    for feature in tower_geojson.get("features", []):
        props = feature.get("properties", {})
        tower_id = props.get("id")
        if not tower_id:
            continue
        site_doc = ensure_site_for_water_tower(db, tower_id)
        ensured.append(site_doc)

    total_towers = len(tower_geojson.get("features", []))
    print("Site seeding complete.")
    print(f"Total towers in catalog: {total_towers}")
    print(f"Total sites ensured: {sites_coll.count_documents({})}")


if __name__ == "__main__":
    main()
