import numpy as np
from app.schemas.gesture import GestureDataRequest, ValidationResult
from app.core.config import settings


def validate(req: GestureDataRequest) -> ValidationResult:
    seq = req.poseSequence
    conf = req.confidenceHistory
    pred = req.predictionHistory

    # 1. 시퀀스 길이
    if len(seq) < settings.required_frames:
        return ValidationResult(passed=False, reason="sequence_too_short")

    # 2. 랜드마크 누락
    for frame in seq:
        if len(frame) != 33:
            return ValidationResult(passed=False, reason="landmark_missing")

    # 3. 평균 confidence
    if not conf:
        return ValidationResult(passed=False, reason="no_confidence_data")
    avg_conf = float(np.mean(conf))
    if avg_conf < settings.min_avg_confidence:
        return ValidationResult(passed=False, reason="low_confidence", quality_score=avg_conf)

    # 4. 움직임 분산 (동작이 있는지 확인)
    arr = np.array(seq, dtype=np.float32)  # (30, 33, 3)
    variance = float(np.var(arr))
    if variance < settings.min_frame_variance:
        return ValidationResult(passed=False, reason="no_movement")

    # 5. visibility ratio (z 좌표 절댓값이 너무 크면 미감지)
    visibility_ratio = float(np.mean(np.abs(arr[:, :, 2]) < 1.0))
    if visibility_ratio < settings.min_visibility_ratio:
        return ValidationResult(passed=False, reason="low_visibility")

    # 6. prediction consistency (마지막 절반이 정답 라벨과 일치하는 비율)
    if pred:
        recent = pred[len(pred) // 2:]
        consistency = sum(p == req.gestureLabel for p in recent) / len(recent)
    else:
        consistency = 0.0

    quality_score = round(
        avg_conf * 0.4 + min(variance * 1000, 1.0) * 0.3 + consistency * 0.3, 3
    )

    return ValidationResult(passed=True, quality_score=quality_score)
