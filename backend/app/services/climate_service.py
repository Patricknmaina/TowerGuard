import json
from pathlib import Path
from datetime import datetime
from app.services.http import http_service


async def fetch_climate_summary(lat: float, lon: float, start_date: str, end_date: str) -> dict:
    """
    Fetch climate summary from NASA POWER API.
    Falls back to fixture if API fails.
    
    Returns dict with: tmin_c, tmax_c, solar_radiation, partial
    """
    try:
        # Parse dates
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        
        # NASA POWER API
        url = "https://power.larc.nasa.gov/api/temporal/daily/point"
        params = {
            "parameters": "T2M_MIN,T2M_MAX,ALLSKY_SFC_SW_DWN",
            "community": "AG",
            "longitude": lon,
            "latitude": lat,
            "start": start.strftime("%Y%m%d"),
            "end": end.strftime("%Y%m%d"),
            "format": "JSON"
        }
        
        response = await http_service.get(url, params=params)
        
        # Extract parameters
        properties = response.get("properties", {}).get("parameter", {})
        
        tmin_values = list(properties.get("T2M_MIN", {}).values())
        tmax_values = list(properties.get("T2M_MAX", {}).values())
        solar_values = list(properties.get("ALLSKY_SFC_SW_DWN", {}).values())
        
        result = {
            "tmin_c": sum(tmin_values) / len(tmin_values) if tmin_values else None,
            "tmax_c": sum(tmax_values) / len(tmax_values) if tmax_values else None,
            "solar_radiation": sum(solar_values) / len(solar_values) if solar_values else None,
            "partial": False
        }
        
        if any(v is None for k, v in result.items() if k != "partial"):
            result["partial"] = True
        
        return result
        
    except Exception as e:
        # Fallback to fixture
        fixture_path = Path(__file__).parent.parent.parent / "data" / "fixtures" / "nasa_power_sample.json"
        
        if fixture_path.exists():
            with open(fixture_path, "r") as f:
                data = json.load(f)
                params = data.get("parameters", {})
                
                tmin_values = list(params.get("T2M_MIN", {}).values())
                tmax_values = list(params.get("T2M_MAX", {}).values())
                solar_values = list(params.get("ALLSKY_SFC_SW_DWN", {}).values())
                
                return {
                    "tmin_c": sum(tmin_values) / len(tmin_values) if tmin_values else None,
                    "tmax_c": sum(tmax_values) / len(tmax_values) if tmax_values else None,
                    "solar_radiation": sum(solar_values) / len(solar_values) if solar_values else None,
                    "partial": True
                }
        
        return {
            "tmin_c": None,
            "tmax_c": None,
            "solar_radiation": None,
            "partial": True
        }
