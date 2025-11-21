import csv
from pathlib import Path

# ───────────────────────────────────────────────
# FILE PATHS (relative to project root)
# ───────────────────────────────────────────────

POINTS_PATH = Path("backend/data/biodiversity/biodiversity_points.csv")
LOCAL_NAMES_PATH = Path("backend/data/biodiversity/species_local_names.csv")

OUTPUT_PATH = Path("backend/data/biodiversity/biodiversity_points_enriched.csv")

# ───────────────────────────────────────────────
# MAIN
# ───────────────────────────────────────────────

def load_species_map():
    """Load species_local_names.csv into a dictionary keyed by scientific name."""
    species_map = {}
    with LOCAL_NAMES_PATH.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            sci = row["scientific_name"].strip()
            species_map[sci] = {
                "local_name": row.get("local_name", "").strip(),
                "english_common_name": row.get("english_common_name", "").strip(),
                "notes": row.get("notes", "").strip(),
                "source": row.get("source", "").strip(),
            }
    return species_map


def enrich_biodiversity_points():
    species_map = load_species_map()
    enriched_rows = []

    with POINTS_PATH.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames + ["notes_source"]
        
        for row in reader:
            sci = row["scientific_name"].strip()
            
            if sci in species_map:
                row["local_name"] = species_map[sci]["local_name"]
                row["english_common_name"] = species_map[sci]["english_common_name"]
                row["notes_source"] = species_map[sci]["source"]
            else:
                # fallback for unmapped species
                row["notes_source"] = ""

            enriched_rows.append(row)

    # Write the enriched output
    with OUTPUT_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(enriched_rows)

    print(f"✓ Enriched biodiversity data written to {OUTPUT_PATH}")


if __name__ == "__main__":
    enrich_biodiversity_points()
