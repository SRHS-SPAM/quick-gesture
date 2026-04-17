from pydantic import BaseModel, Field
from typing import Annotated
from datetime import datetime


class GestureDataRequest(BaseModel):
    gestureLabel: str
    poseSequence: list[list[list[float]]]   # (30, 33, 3)
    predictionHistory: list[str]
    confidenceHistory: list[float]


class ValidationResult(BaseModel):
    passed: bool
    reason: str | None = None
    quality_score: float = 0.0


class GestureDataResponse(BaseModel):
    saved: bool
    reason: str | None = None
    quality_score: float | None = None
