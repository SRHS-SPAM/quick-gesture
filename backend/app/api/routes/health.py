from fastapi import APIRouter
from app.core.database import get_db

router = APIRouter()


@router.get("/health")
async def health():
    try:
        await get_db().command("ping")
        db_status = "ok"
    except Exception:
        db_status = "error"
    return {"status": "ok", "db": db_status}
