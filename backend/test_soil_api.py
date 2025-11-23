"""
Quick test script to verify SoilGrids API is working
Run this to check if soil data can be fetched
"""
import sys
import logging
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.ml.environmental_api_client import SoilGridsClient

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(message)s'
)

def test_soilgrids():
    """Test SoilGrids API with a known location in Kenya"""
    client = SoilGridsClient()
    
    # Test with Mt Kenya coordinates (centroid)
    lat, lon = -0.1521, 37.3084
    
    print(f"\n{'='*60}")
    print(f"Testing SoilGrids API for Mt Kenya")
    print(f"Coordinates: ({lat}, {lon})")
    print(f"{'='*60}\n")
    
    result = client.get_soil_properties(lat, lon)
    
    if result:
        print("SUCCESS - Soil data retrieved:")
        print(f"   pH: {result.get('ph')}")
        print(f"   Sand: {result.get('sand')}%")
        print(f"   Clay: {result.get('clay')}%")
        print(f"   Silt: {result.get('silt')}%")
        print(f"   Soil Organic Carbon: {result.get('soc')}")
        print(f"   Bulk Density: {result.get('bulk_density')}")
        
        # Test classification
        sand = result.get('sand')
        clay = result.get('clay')
        silt = result.get('silt')
        
        if sand and clay and silt:
            print(f"\n   Soil Classification: Clay={clay}%, Sand={sand}%, Silt={silt}%")
            total = sand + clay + silt
            print(f"   Total: {total}%")
        
        return True
    else:
        print("FAILED - No soil data retrieved")
        print("\nPossible issues:")
        print("1. SoilGrids API is down or rate-limited")
        print("2. Network connectivity issues")
        print("3. Invalid coordinates")
        return False

if __name__ == "__main__":
    success = test_soilgrids()
    sys.exit(0 if success else 1)
