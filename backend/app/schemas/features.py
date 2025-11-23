from uuid import UUID
from datetime import date, datetime
from pydantic import BaseModel, Field
from typing import Any


class FeatureRequestBody(BaseModel):
    """Schema for requesting feature extraction."""
    start_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Start date in YYYY-MM-DD format")
    end_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="End date in YYYY-MM-DD format")


class SiteFeatureRead(BaseModel):
    """Schema for reading site features."""
    id: UUID
    site_id: UUID
    start_date: date
    end_date: date
    
    # NDVI metrics
    ndvi_mean: float | None
    ndvi_std: float | None
    
    # Rainfall metrics
    rainfall_total_mm: float | None
    rainfall_mean_mm_per_day: float | None
    
    # Climate metrics
    tmin_c: float | None
    tmax_c: float | None
    solar_radiation: float | None
    
    # Soil metrics
    soc: float | None
    sand: float | None
    clay: float | None
    silt: float | None
    ph: float | None
    
    # Metadata
    source_breakdown: dict[str, Any] | None
    partial: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}
