from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class PredictionRequestBody(BaseModel):
    """Schema for requesting a prediction."""
    features_id: UUID | None = Field(None, description="Optional features ID to use for prediction")


class SitePredictionRead(BaseModel):
    """Schema for reading a site prediction."""
    id: UUID
    site_id: UUID
    features_id: UUID | None
    score: float
    model_version: str
    partial: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}
