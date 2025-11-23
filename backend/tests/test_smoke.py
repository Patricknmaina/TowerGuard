import uuid

import pytest
from fastapi.testclient import TestClient
from mongomock import MongoClient

from app.core import loaders
from app.db.session import get_db
from app.main import app

mongo_client = MongoClient()
test_db = mongo_client["towerguard_test"]


def override_get_db():
    yield test_db


app.dependency_overrides[get_db] = override_get_db

loaders.load_all_data(test_db)


@pytest.fixture(autouse=True)
def clean_site_collections():
    test_db["sites"].delete_many({})
    test_db["site_features"].delete_many({})
    test_db["site_predictions"].delete_many({})
    yield


client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_and_get_site():
    payload = {
        "name": "Test Site",
        "description": "Automated test site",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[36.8, -1.3], [36.9, -1.3], [36.9, -1.2], [36.8, -1.2], [36.8, -1.3]]]
        },
        "country": "Kenya"
    }

    create_resp = client.post("/api/sites", json=payload)
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["name"] == payload["name"]

    get_resp = client.get(f"/api/sites/{created['id']}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == created["id"]


def test_list_sites_empty():
    response = client.get("/api/sites")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_water_towers_loaded():
    response = client.get("/api/water-towers")
    assert response.status_code == 200
    towers = response.json()
    assert isinstance(towers, list)
    assert len(towers) > 0


def test_nurseries_available():
    response = client.get("/api/nurseries")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_biodiversity_requires_filter():
    response = client.get("/api/biodiversity")
    assert response.status_code == 400

    some_uuid = str(uuid.uuid4())
    response = client.get(f"/api/biodiversity?site_id={some_uuid}")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
