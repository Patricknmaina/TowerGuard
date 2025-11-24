"""
Unified Configuration - Merges FastAPI settings with TowerGuard ML config.

Combines database settings, API configuration, and ML pipeline settings.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings with database, API, and ML configuration."""
    
    # ============================================================================
    # DATABASE CONFIGURATION (MongoDB)
    # ============================================================================
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "towerguard"
    
    # ============================================================================
    # ENVIRONMENT
    # ============================================================================
    environment: str = "development"
    log_level: str = "INFO"
    
    # ============================================================================
    # API CONFIGURATION
    # ============================================================================
    api_prefix: str = "/api"
    
    # ============================================================================
    # CORS SETTINGS
    # ============================================================================
    cors_origins: List[str] = ["*"]
    
    # ============================================================================
    # EXTERNAL API KEYS (Optional - fallback to fixtures if not provided)
    # ============================================================================
    nasa_power_api_key: str = ""  # Optional: NASA POWER API key
    
    # ============================================================================
    # CACHE & REQUEST SETTINGS
    # ============================================================================
    cache_enabled: bool = True
    cache_ttl_hours: int = 24
    request_timeout_seconds: int = 30
    request_retry_attempts: int = 3
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()


# Export ML config for use by ML modules
def get_ml_config():
    """Get ML-specific configuration for TowerGuard modules."""
    from app.ml.config import get_config as get_towerguard_config
    
    ml_config = get_towerguard_config()
    
    # Override with environment-specific settings
    if settings.nasa_power_api_key:
        ml_config["api_endpoints"]["nasa_power"]["api_key"] = settings.nasa_power_api_key
    
    ml_config["environment"] = settings.environment
    ml_config["cache"]["enabled"] = settings.cache_enabled
    ml_config["cache"]["max_age_hours"] = settings.cache_ttl_hours
    ml_config["request"]["timeout_seconds"] = settings.request_timeout_seconds
    ml_config["request"]["retry_attempts"] = settings.request_retry_attempts
    
    return ml_config
