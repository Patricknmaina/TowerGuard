from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "message": "TowerGuard API is running",
        "version": "1.0.0",
        "database": "disabled",
        "ml_modules": "integrated"
    }
