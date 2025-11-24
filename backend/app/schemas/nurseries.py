from datetime import datetime
from pydantic import BaseModel
from typing import Any


class NurseryRead(BaseModel):
    """Schema for reading a nursery."""
    id: str
    name: str
    lat: float
    lon: float
    water_tower_id: str | None
    metadata: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}
