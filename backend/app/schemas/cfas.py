from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CFARead(BaseModel):
    """Schema for Community Forest Associations linked to water towers."""

    id: str
    name: str
    water_tower_id: Optional[str] = None
    county: Optional[str] = None
    contact_email: Optional[str] = None
    website: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = None
    metadata: Optional[dict] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
