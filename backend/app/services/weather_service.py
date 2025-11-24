import json
from pathlib import Path
from app.services.http import http_service


async def fetch_current_weather(lat: float, lon: float) -> dict:
    """
    Fetch current weather from Open-Meteo API.
    Falls back to fixture if API fails.
    
    Returns dict with: temperature, partial
    """
    try:
        # Open-Meteo API
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "current_weather": True
        }
        
        response = await http_service.get(url, params=params)
        
        current = response.get("current_weather", {})
        
        return {
            "temperature": current.get("temperature"),
            "partial": False if current.get("temperature") is not None else True
        }
        
    except Exception as e:
        # Fallback to fixture
        fixture_path = Path(__file__).parent.parent.parent / "data" / "fixtures" / "open_meteo_sample.json"
        
        if fixture_path.exists():
            with open(fixture_path, "r") as f:
                data = json.load(f)
                current = data.get("current_weather", {})
                return {
                    "temperature": current.get("temperature"),
                    "partial": True
                }
        
        return {
            "temperature": None,
            "partial": True
        }
