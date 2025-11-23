from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import (
    biodiversity,
    features,
    health,
    nurseries,
    predictions,
    sites,
    water_towers,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown."""
    # Startup
    print("Starting up...")
    print("Running with MongoDB backend and seeded feature datasets")
    
    yield
    
    # Shutdown
    print("Shutting down...")


# Create FastAPI app
app = FastAPI(
    title="Wangaari Maathai Hackathon API",
    description="API for ecosystem health monitoring and prediction",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(sites.router, prefix="/api", tags=["Sites"])
app.include_router(features.router, prefix="/api", tags=["Features"])
app.include_router(predictions.router, prefix="/api", tags=["Predictions"])
app.include_router(water_towers.router, prefix="/api", tags=["Water Towers"])
app.include_router(nurseries.router, prefix="/api", tags=["Nurseries"])
app.include_router(biodiversity.router, prefix="/api", tags=["Biodiversity"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Wangaari Maathai Hackathon API",
        "version": "1.0.0",
        "docs": "/docs"
    }
