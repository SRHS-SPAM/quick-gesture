from datetime import datetime, timezone
from app.core.database import get_db
from app.core.config import settings
from app.schemas.gesture import GestureDataRequest, ValidationResult


async def save_gesture(req: GestureDataRequest, validation: ValidationResult) -> None:
    db = get_db()
    doc = {
        "gesture": req.gestureLabel,
        "poseSequence": req.poseSequence,
        "predictionHistory": req.predictionHistory,
        "confidenceHistory": req.confidenceHistory,
        "qualityScore": validation.quality_score,
        "validated": True,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "modelVersion": settings.model_version,
    }
    await db["gesture_samples"].insert_one(doc)


async def get_stats() -> dict:
    db = get_db()
    col = db["gesture_samples"]
    total = await col.count_documents({})
    pipeline = [{"$group": {"_id": "$gesture", "count": {"$sum": 1}}}]
    cursor = col.aggregate(pipeline)
    by_gesture = {doc["_id"]: doc["count"] async for doc in cursor}
    return {"total": total, "by_gesture": by_gesture}
