"""
Simple GeoJSON validation script for Hummingbird Impact data.

Usage:
    python validate_geojson.py backend/data/water_towers/kenya_water_towers_18.geojson
"""

import json
import sys
from pathlib import Path

try:
    import shapely.geometry as geom
except ImportError:
    geom = None
    print("Warning: shapely is not installed. Geometry validity checks will be skipped.")

def validate_geojson(path: Path) -> int:
    errors = 0
    if not path.exists():
        print(f"[ERROR] File not found: {path}")
        return 1

    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if data.get("type") != "FeatureCollection":
        print(f"[ERROR] {path}: root type is not FeatureCollection")
        errors += 1

    features = data.get("features", [])
    if not isinstance(features, list):
        print(f"[ERROR] {path}: 'features' is not a list")
        errors += 1

    for i, feat in enumerate(features):
        if feat.get("type") != "Feature":
            print(f"[ERROR] {path} feature {i}: type is not 'Feature'")
            errors += 1
            continue

        geom_obj = feat.get("geometry")
        props = feat.get("properties", {})

        if not isinstance(props, dict):
            print(f"[ERROR] {path} feature {i}: properties is not an object")
            errors += 1

        if geom_obj is None:
            print(f"[ERROR] {path} feature {i}: missing geometry")
            errors += 1
        elif geom and geom_obj.get("type") in {"Point","Polygon","MultiPolygon","MultiPoint","LineString","MultiLineString"}:
            try:
                # Let shapely validate the geometry if available
                g = geom.shape(geom_obj)
                if not g.is_valid:
                    print(f"[ERROR] {path} feature {i}: invalid geometry (self-intersection or other issue)")
                    errors += 1
            except Exception as e:
                print(f"[ERROR] {path} feature {i}: could not parse geometry: {e}")
                errors += 1

    if errors == 0:
        print(f"[OK] {path} passed basic GeoJSON validation.")
    else:
        print(f"[DONE] {path} finished with {errors} error(s).")
    return errors

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate_geojson.py path/to/file.geojson")
        sys.exit(1)

    path = Path(sys.argv[1])
    sys.exit(validate_geojson(path))
