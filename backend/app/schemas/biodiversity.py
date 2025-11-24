from datetime import date, datetime
from pydantic import BaseModel


class BiodiversityRecordRead(BaseModel):
    """Schema for reading a single biodiversity record."""
    id: str
    scientific_name: str
    local_name: str | None
    english_common_name: str | None
    lat: float
    lon: float
    site_id: str | None
    water_tower_id: str | None
    observed_at: date | None
    source: str
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class BiodiversitySpeciesRead(BaseModel):
    """Schema for reading aggregated biodiversity species data."""
    scientific_name: str
    local_name: str | None
    english_common_name: str | None
    records: list[BiodiversityRecordRead]
    water_tower_id: str | None
    species_id: str
