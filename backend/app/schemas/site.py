from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Any


class SiteCreate(BaseModel):
    """Schema for creating a new site."""
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    geometry: dict[str, Any] = Field(..., description="GeoJSON geometry (Polygon or MultiPolygon)")
    country: str = Field(default="Kenya", max_length=100)


class SiteRead(BaseModel):
    """Schema for reading a site."""
    id: UUID
    name: str
    description: str | None
    geometry: dict[str, Any]
    country: str
    created_at: datetime
    updated_at: datetime
    water_tower_id: str | None = None
    
    model_config = {"from_attributes": True}
