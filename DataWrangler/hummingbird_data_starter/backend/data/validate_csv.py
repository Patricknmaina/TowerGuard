"""
Simple CSV schema validator for Hummingbird Impact data.

Usage:
    python validate_csv.py backend/data/nurseries/nurseries_kenya.csv nurseries
    python validate_csv.py backend/data/biodiversity/biodiversity_points.csv biodiversity
    python validate_csv.py backend/data/biodiversity/species_local_names.csv species_local_names
"""

import csv
import sys
from pathlib import Path

SCHEMAS = {
    "nurseries": [
        "id","name","lat","lon","water_tower_id",
        "species_scientific","species_local","capacity_seedlings","source",
    ],
    "biodiversity": [
        "id","lat","lon","scientific_name","local_name",
        "english_common_name","source","water_tower_id",
    ],
    "species_local_names": [
        "scientific_name","local_name","english_common_name","notes","source",
    ],
}

def validate_csv(path: Path, schema_name: str) -> int:
    errors = 0
    if schema_name not in SCHEMAS:
        print(f"[ERROR] Unknown schema '{schema_name}'. Valid: {list(SCHEMAS)}")
        return 1

    expected = SCHEMAS[schema_name]

    if not path.exists():
        print(f"[ERROR] File not found: {path}")
        return 1

    with path.open("r", encoding="utf-8") as f:
        reader = csv.reader(f)
        try:
            header = next(reader)
        except StopIteration:
            print(f"[ERROR] {path} is empty.")
            return 1

    if header != expected:
        print(f"[ERROR] {path}: header mismatch.")
        print(f"  Expected: {expected}")
        print(f"  Found   : {header}")
        errors += 1
    else:
        print(f"[OK] {path}: header matches schema '{schema_name}'.")

    return errors

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python validate_csv.py path/to/file.csv [nurseries|biodiversity|species_local_names]")
        sys.exit(1)

    path = Path(sys.argv[1])
    schema_name = sys.argv[2]
    sys.exit(validate_csv(path, schema_name))
