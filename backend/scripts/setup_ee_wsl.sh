#!/usr/bin/env bash
set -euo pipefail

echo "Running TowerGuard EE setup in WSL..."

eval "$(conda shell.bash hook)"

if ! conda info --envs | awk '{print $1}' | grep -qx 'towerguard-ee'; then
  echo "Creating conda env 'towerguard-ee'..."
  conda create -n towerguard-ee python=3.10 -y
fi

echo "Activating env 'towerguard-ee'..."
conda activate towerguard-ee

echo "Installing Earth Engine and Google auth libraries (pip)..."
python -m pip install --upgrade pip setuptools wheel
python -m pip install earthengine-api google-auth google-auth-httplib2 google-auth-oauthlib google-api-python-client

SA_PATH="$HOME/towerguard/credentials/ee_service_account.json"
if [ ! -f "$SA_PATH" ]; then
  echo "Service account JSON not found at $SA_PATH" >&2
  exit 1
fi

export EE_SERVICE_ACCOUNT_EMAIL="gee-ndvi-sa@tower-guard-479011.iam.gserviceaccount.com"
export EE_SERVICE_ACCOUNT_JSON="$SA_PATH"

echo "Testing Earth Engine initialization..."
python - <<'PY'
import os
try:
    import ee
    print('ee imported:', ee is not None)
    sa = os.environ.get('EE_SERVICE_ACCOUNT_EMAIL')
    path = os.environ.get('EE_SERVICE_ACCOUNT_JSON')
    print('Using SA:', sa)
    print('SA JSON exists:', path, '->', os.path.exists(path))
    creds = ee.ServiceAccountCredentials(sa, path)
    ee.Initialize(creds)
    print('Earth Engine initialized successfully')
    print('Collection size (sample):', ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED').size().getInfo())
except Exception as e:
    print('Earth Engine test failed:', e)
    raise
PY

echo "Starting backend (uvicorn) in background, logs -> uvicorn_wsl.log"
cd "/mnt/a/AI projects/TowerGuard/backend"
nohup uvicorn app.main:app --reload --host 0.0.0.0 --port 8080 > uvicorn_wsl.log 2>&1 &
echo "Started uvicorn with PID: $!"
echo "Tailing last 200 lines of uvicorn log:"
sleep 1
tail -n 200 uvicorn_wsl.log || true

echo "Done. Visit http://localhost:8080/docs from Windows browser (if WSL port forwarding enabled)."
