"""
Backfill script to enrich all water towers with NDVI, climate, and soil summaries.

Usage (from repo root):
    cd backend
    python -m scripts.backfill_water_tower_metrics

This will call the same enrichment pipeline as the API endpoints and
write results into the Mongo "water_towers" collection.
"""

import asyncio
from pymongo import MongoClient

from app.core.config import settings
from app.services.tower_enrichment_service import enrich_all_water_towers


async def main():
    client = MongoClient(settings.mongodb_uri)
    db = client[settings.mongodb_db]
    updated = await enrich_all_water_towers(db)
    print(f"Enriched {len(updated)} water towers.")


if __name__ == "__main__":
    asyncio.run(main())
