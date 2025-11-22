import csv
import math
import time
import requests
from pathlib import Path

# ───────────────────────────────────────────────
# CONFIG
# ───────────────────────────────────────────────

OUT_PATH = Path("DataWrangler/hummingbird_data_starter/backend/data/biodiversity/biodiversity_points.csv")

SPECIES = [
    "Juniperus procera",
    "Podocarpus latifolius",
    "Olea europaea subsp. africana",
    "Prunus africana",
    "Afrocarpus gracilior",
    "Hagenia abyssinica",
    "Dombeya torrida",
    "Croton megalocarpus",
    "Markhamia lutea",
    "Syzygium guineense",
    "Yushania alpina",
]

# Target output
TARGET_TOTAL_POINTS = 100

# Pull more per species, with pagination
MAX_PER_SPECIES = 20       # attempt up to 20 points per species
PAGE_SIZE = 50             # GBIF page size (limit)

GBIF_API = "https://api.gbif.org/v1/occurrence/search"
TIMEOUT_SECONDS = 90
MAX_RETRIES = 5
BACKOFF_SECONDS = 5

# 18 gazetted tower centroids (for nearest-assignment)
WATER_TOWERS = [
    {"id": "aberdare_range", "lat": -0.4167, "lon": 36.7000},
    {"id": "cherangani_hills", "lat": 1.2130, "lon": 35.4370},
    {"id": "chyulu_hills", "lat": -2.5000, "lon": 37.8833},
    {"id": "huri_hills", "lat": 3.3160, "lon": 38.4500},
    {"id": "lerroghi_kirisia_hills", "lat": 0.7000, "lon": 36.9500},
    {"id": "loita_hills", "lat": -1.5800, "lon": 35.6830},
    {"id": "marmanet_forest", "lat": -0.2500, "lon": 36.4500},
    {"id": "matthews_range", "lat": 1.1000, "lon": 37.3500},
    {"id": "mau_forest_complex", "lat": -0.5230, "lon": 35.7290},
    {"id": "mt_elgon", "lat": 1.1200, "lon": 34.5600},
    {"id": "mt_kenya", "lat": 0.1521, "lon": 37.3084},
    {"id": "mt_kipipiri", "lat": -0.4200, "lon": 36.5000},
    {"id": "mt_kulal", "lat": 2.5500, "lon": 36.9000},
    {"id": "mt_marsabit", "lat": 2.3330, "lon": 37.9830},
    {"id": "mt_nyiru", "lat": 2.0500, "lon": 36.9000},
    {"id": "ndotos", "lat": 1.6100, "lon": 37.3000},
    {"id": "nyambene_hills", "lat": 0.3500, "lon": 37.9500},
    {"id": "shimba_hills", "lat": -4.2700, "lon": 39.4300},
]

COMMON_NAME_MAP = {
    "Juniperus procera": "African pencil cedar",
    "Podocarpus latifolius": "East African yellowwood",
    "Olea europaea subsp. africana": "Wild olive",
    "Prunus africana": "African cherry",
    "Afrocarpus gracilior": "East African yellowwood (lowland)",
    "Hagenia abyssinica": "African redwood",
    "Dombeya torrida": "Dombeya",
    "Croton megalocarpus": "Croton",
    "Markhamia lutea": "Nile tulip",
    "Syzygium guineense": "Waterberry",
    "Yushania alpina": "African alpine bamboo",
}

def local_name_placeholder(_: str) -> str:
    return ""


# ───────────────────────────────────────────────
# HELPERS
# ───────────────────────────────────────────────

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1-a))


def nearest_water_tower(lat, lon):
    best_id, best_dist = None, float("inf")
    for wt in WATER_TOWERS:
        d = haversine_km(lat, lon, wt["lat"], wt["lon"])
        if d < best_dist:
            best_dist, best_id = d, wt["id"]
    return best_id


def gbif_request(params):
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            r = requests.get(GBIF_API, params=params, timeout=TIMEOUT_SECONDS)
            r.raise_for_status()
            return r.json()
        except requests.exceptions.RequestException as e:
            wait = BACKOFF_SECONDS * attempt
            print(f"  ⚠️ GBIF error (attempt {attempt}/{MAX_RETRIES}): {e}")
            print(f"  ...waiting {wait}s then retrying")
            time.sleep(wait)
    return {"results": [], "endOfRecords": True}


def fetch_gbif_points(scientific_name: str, max_records: int):
    """
    Paginated GBIF fetch so we don't time out or under-fetch.
    """
    collected = []
    offset = 0

    while len(collected) < max_records:
        params = {
            "country": "KE",
            "scientificName": scientific_name,
            "hasCoordinate": "true",
            "limit": PAGE_SIZE,
            "offset": offset,
        }

        data = gbif_request(params)
        results = data.get("results", [])

        if not results:
            break

        for rec in results:
            lat = rec.get("decimalLatitude")
            lon = rec.get("decimalLongitude")
            if lat is None or lon is None:
                continue
            collected.append(rec)
            if len(collected) >= max_records:
                break

        if data.get("endOfRecords"):
            break

        offset += PAGE_SIZE

    return collected


# ───────────────────────────────────────────────
# MAIN
# ───────────────────────────────────────────────

def main():
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "id",
        "lat",
        "lon",
        "scientific_name",
        "local_name",
        "english_common_name",
        "source",
        "water_tower_id",
    ]

    rows = []
    idx = 1

    for sci in SPECIES:
        print(f"Fetching GBIF: {sci}")
        results = fetch_gbif_points(sci, MAX_PER_SPECIES)

        for rec in results:
            lat = rec.get("decimalLatitude")
            lon = rec.get("decimalLongitude")
            if lat is None or lon is None:
                continue

            occ_id = rec.get("key")
            dataset_key = rec.get("datasetKey")

            wt_id = nearest_water_tower(lat, lon)
            common_name = COMMON_NAME_MAP.get(sci, "")
            local_name = local_name_placeholder(sci)

            rows.append({
                "id": f"bio_{idx:04d}",
                "lat": f"{lat:.6f}",
                "lon": f"{lon:.6f}",
                "scientific_name": sci,
                "local_name": local_name,
                "english_common_name": common_name,
                "source": f"GBIF occurrence {occ_id}, dataset {dataset_key}",
                "water_tower_id": wt_id or "",
            })
            idx += 1

        if len(rows) >= TARGET_TOTAL_POINTS:
            break

    rows = rows[:TARGET_TOTAL_POINTS]

    # quick coverage report
    coverage = {}
    for r in rows:
        coverage[r["water_tower_id"]] = coverage.get(r["water_tower_id"], 0) + 1

    print("\nCoverage by water tower:")
    for wt in sorted(coverage.keys()):
        print(f"  {wt}: {coverage[wt]} points")

    with OUT_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\n✓ Wrote {len(rows)} real GBIF biodiversity records to {OUT_PATH}")


if __name__ == "__main__":
    main()
