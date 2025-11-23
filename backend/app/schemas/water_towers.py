from datetime import datetime
from pydantic import BaseModel
from typing import Any


class WaterTowerRead(BaseModel):
    """Schema for reading a water tower."""
    id: str
    name: str
    counties: list[str] | str | None
    geometry: dict[str, Any]
    area_ha: float | None
    description: str | None
    metadata: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}
