from fastapi import APIRouter, Request, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.schemas.gesture import GestureDataRequest, GestureDataResponse
from app.services.validation import validate
from app.services.gesture_service import save_gesture, get_stats
from app.core.config import settings

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/gesture-data", response_model=GestureDataResponse)
@limiter.limit(settings.rate_limit)
async def receive_gesture_data(request: Request, body: GestureDataRequest):
    result = validate(body)

    if not result.passed:
        return GestureDataResponse(saved=False, reason=result.reason)

    try:
        await save_gesture(body, result)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"DB 저장 실패: {str(e)}")

    return GestureDataResponse(saved=True, quality_score=result.quality_score)


@router.get("/stats")
async def data_stats():
    return await get_stats()
