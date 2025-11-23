from datetime import datetime
from pathlib import Path


async def fetch_rainfall_summary(lat: float, lon: float, start_date: str, end_date: str) -> dict:
    """
    Fetch rainfall summary from CHIRPS data.
    This is a placeholder that uses a simple estimation.
    In production, this should read CHIRPS NetCDF files.
    
    Returns dict with: rainfall_total_mm, rainfall_mean_mm_per_day, partial
    """
    try:
        # Parse dates to calculate duration
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        days = (end - start).days + 1
        
        # In production, this would:
        # 1. Load CHIRPS NetCDF file
        # 2. Extract data for lat/lon
        # 3. Sum rainfall over date range
        
        # For now, use a reasonable estimate based on Kenya's climate
        # Kenya receives 630-1100mm annually, ~1.7-3mm/day average
        daily_estimate = 2.5  # mm/day (reasonable for Kenya)
        
        rainfall_total = daily_estimate * days
        rainfall_mean = daily_estimate
        
        return {
            "rainfall_total_mm": rainfall_total,
            "rainfall_mean_mm_per_day": rainfall_mean,
            "partial": True  # Mark as partial since we're estimating
        }
        
    except Exception as e:
        return {
            "rainfall_total_mm": None,
            "rainfall_mean_mm_per_day": None,
            "partial": True
        }
