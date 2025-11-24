# Quick Start Guide

## 1. Setup Environment

### Install MongoDB

**Windows:**
```bash
# Download and install MongoDB Community Server from:
# https://www.mongodb.com/try/download/community
# Start the MongoDB service (MongoDB Compass includes mongosh)
# or run: "net start MongoDB" after installation
```

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community@6.0
brew services start mongodb-community@6.0
```

**Linux:**
```bash
sudo apt-get update
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo tee /etc/apt/trusted.gpg.d/mongodb.gpg >/dev/null
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl enable --now mongod
```

### Configure MongoDB

```bash
mongosh <<'EOF'
use admin
db.createUser({
  user: "wangaari_user",
  pwd: "secure_password",
  roles: [{ role: "readWriteAnyDatabase", db: "admin" }]
})
use wangaari_db
db.createCollection("sites")
EOF
```

## 2. Install Python Dependencies

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your MongoDB connection settings
```

Example `.env`:
```
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=towerguard
ENVIRONMENT=development
```

## 4. Initialize Database (Optional)

The app seeds canonical datasets on first startup, but you can also run:

```bash
python - <<'PY'
from app.db.session import get_db
from app.core.loaders import load_all_data

db = next(get_db())
load_all_data(db)
PY
```

## 5. Run the Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server will start at:
- **API:** http://localhost:8000
- **Docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## 6. Test the API

### Health Check
```bash
curl http://localhost:8000/api/health
```

### Create a Site
```bash
curl -X POST http://localhost:8000/api/sites \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Site",
    "description": "A test monitoring site",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[[36.8, -1.3], [36.9, -1.3], [36.9, -1.2], [36.8, -1.2], [36.8, -1.3]]]
    },
    "country": "Kenya"
  }'
```

### List Water Towers
```bash
curl http://localhost:8000/api/water-towers
```

### Extract Features
```bash
# Replace {site_id} with actual site ID
curl -X POST http://localhost:8000/api/sites/{site_id}/features \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2023-01-01",
    "end_date": "2023-12-31"
  }'
```

### Generate Prediction
```bash
# Replace {site_id} with actual site ID
curl -X POST http://localhost:8000/api/sites/{site_id}/predict
```

## 7. Run Tests

```bash
pip install -r test-requirements.txt
pytest tests/test_smoke.py -v
```

## Troubleshooting

### MongoDB Connection Issues
```bash
mongosh --username wangaari_user --password secure_password --eval "db.stats()"
sudo systemctl status mongod
```

### Database Credentials
- Re-check `MONGODB_URI` / `MONGODB_DB` in `.env`
- Ensure the URI encodes the `wangaari_user` credentials if using authentication
- Confirm MongoDB service (`mongod`) is listening on the configured host/port

### Import Errors
```bash
# Ensure you're in the backend directory and venv is activated
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
```

## Data Loading

The application automatically loads:
- 18 Kenya water towers from GeoJSON
- Nursery locations from CSV
- Biodiversity records from CSV

Data is loaded on first startup. Check logs for confirmation:
```
Loading canonical datasets...
Loaded 18 water towers
Loaded 5 nurseries
Loaded 5 biodiversity records
Finished loading datasets
```

## Next Steps

1. Explore the API documentation at http://localhost:8000/docs
2. Create sites and extract features
3. Generate predictions for ecosystem health
4. Query biodiversity data by site or water tower
5. Integrate with frontend application
