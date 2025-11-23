import json
import os
from pathlib import Path
from app.services.http import http_service


async def fetch_soil_properties(lat: float, lon: float) -> dict:
    """
    Fetch soil properties from SoilGrids REST API.
    Falls back to fixture if API fails.
    
    Returns dict with: soc, sand, clay, silt, ph, partial
    """
    try:
        # Try SoilGrids REST API
        url = "https://rest.isric.org/soilgrids/v2.0/properties/query"
        params = {
            "lon": lon,
            "lat": lat,
            "property": ["soc", "sand", "clay", "silt", "phh2o"],
            "depth": ["0-5cm"],
            "value": ["mean"]
        }
        
        response = await http_service.get(url, params=params)
        
        # Extract values from response
        properties = response.get("properties", {})
        layers = properties.get("layers", [])
        
        result = {
            "soc": None,
            "sand": None,
            "clay": None,
            "silt": None,
            "ph": None,
            "partial": False
        }
        
        for layer in layers:
            name = layer.get("name")
            depths = layer.get("depths", [])
            if depths:
                values = depths[0].get("values", {})
                mean_value = values.get("mean")
                
                if name == "soc" and mean_value is not None:
                    result["soc"] = mean_value / 10.0  # Convert to g/kg
                elif name == "sand" and mean_value is not None:
                    result["sand"] = mean_value / 10.0  # Convert to %
                elif name == "clay" and mean_value is not None:
                    result["clay"] = mean_value / 10.0  # Convert to %
                elif name == "silt" and mean_value is not None:
                    result["silt"] = mean_value / 10.0  # Convert to %
                elif name == "phh2o" and mean_value is not None:
                    result["ph"] = mean_value / 10.0  # Convert to pH units
        
        # Check if any values are missing
        if any(v is None for k, v in result.items() if k != "partial"):
            result["partial"] = True
        
        return result
        
    except Exception as e:
        # Fallback to fixture
        fixture_path = Path(__file__).parent.parent.parent / "data" / "fixtures" / "soilgrids_sample.json"
        
        if fixture_path.exists():
            with open(fixture_path, "r") as f:
                data = json.load(f)
                return {
                    "soc": data.get("soc"),
                    "sand": data.get("sand"),
                    "clay": data.get("clay"),
                    "silt": data.get("silt"),
                    "ph": data.get("ph"),
                    "partial": True
                }
        
        # Last resort: return None values with partial=True
        return {
            "soc": None,
            "sand": None,
            "clay": None,
            "silt": None,
            "ph": None,
            "partial": True
        }
