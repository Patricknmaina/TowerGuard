from typing import Generator
from pymongo import MongoClient
from pymongo.database import Database

from app.core.config import settings

client = MongoClient(settings.mongodb_uri)


def get_db() -> Generator[Database, None, None]:
    """Dependency for getting the MongoDB client database."""
    db = client[settings.mongodb_db]
    try:
        yield db
    finally:
        pass
