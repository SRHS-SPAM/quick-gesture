# CLAUDE.md

## 프로젝트 개요

**Quick,Gesture!** — 사용자가 몸으로 제스처를 표현하면 AI가 이를 실시간으로 추측하는 웹 기반 게임.

이 프로젝트는 단순 게임이 아니라:

> **Play → Data → Validate → Train → Improve**

로 이어지는 **데이터 플라이휠 기반 AI 서비스**다.

---

## 핵심 목표

1. 실시간 Pose 기반 Gesture 게임 제공
2. 사용자 행동 데이터를 자연스럽게 수집
3. 데이터 품질 검증 후 저장
4. 모델을 지속적으로 재학습
5. 유저 리텐션을 통해 데이터 루프 유지

---

## 핵심 원칙

- 유저는 데이터 생성기가 아니라 **플레이어**
- 재미가 없으면 데이터도 없다
- 모든 데이터는 **검증 후 학습**
- 영상은 저장하지 않고 **좌표만 저장**
- 프론트 실시간 처리 / 백엔드 학습 분리

---

## 시스템 아키텍처

```

Frontend (Web)
↓
MediaPipe Pose
↓
Pose Sequence Buffer (30 frames)
↓
Realtime Inference (ONNX / TFJS)
↓
Game Logic
↓
Backend API
↓
Data Validation
↓
Database (MongoDB)
↓
Training Pipeline (Python)
↓
Model Export (ONNX)
↓
Frontend Model Update

```

---

## 기술 스택

### Frontend
- JavaScript / TypeScript
- MediaPipe Pose
- ONNX Runtime Web 또는 TensorFlow.js

### Backend
- Python (FastAPI)

### Database
- MongoDB

### ML
- PyTorch / TensorFlow
- ONNX export

---

## 파일 구조

```

/frontend
/backend
/training
/data
/models
/docs

````

---

## Gesture Metadata (중요)

모든 제스처는 metadata 기반으로 관리한다.

```json
[
  {
    "name": "star",
    "type": "static",
    "threshold": 18,
    "minConfidence": 0.5
  },
  {
    "name": "wave",
    "type": "dynamic",
    "threshold": 10,
    "minConfidence": 0.4
  }
]
````

### 규칙

* static: 유지형 동작
* dynamic: 움직임 기반 동작
* 각 gesture마다 판정 기준 다르게 적용

---

## 게임 규칙

* 한 판: 6개 제스처
* 제한 시간: 60초
* AI가 실시간 추측
* 맞추면 다음 문제

### 종료 조건

* 6개 완료
* 시간 초과

---

## UX / 리텐션 설계

### 필수 요소

* 점수 및 결과 화면
* 최고 기록 저장
* 연속 성공 (streak)
* 콤보 시스템
* AI 오답 표시 (핵심 재미 요소)

### 온보딩

* 카메라 사용 이유 설명
* "영상은 저장되지 않음" 안내
* 카메라 프리뷰 제공
* 자세 가이드 UI

---

## 실행 흐름

1. intro
2. permission
3. loading
4. game
5. result

### 프레임 루프

* pose landmark 추출
* feature vector 생성
* sequence buffer 저장
* 모델 추론
* prediction 업데이트

---

## 모델 입력 형식

* 30 프레임 sequence
* 33 landmarks × 3 = 99
* shape: `[1, 30, 99]`
* float32

---

## Feature Preprocessing

필수 조건:

* MediaPipe normalized 좌표 사용
* UI 반전은 모델 입력에 적용하지 않음
* 학습/추론 동일 처리

### 권장 정규화

* hip center 기준 변환
* body scale normalization

---

## Prediction Logic

각 gesture metadata 사용

정답 조건:

* 동일 gesture 유지 (threshold)
* confidence ≥ minConfidence

---

## Data Collection

수집 데이터:

```json
{
  "gestureLabel": "airplane",
  "poseSequence": [],
  "predictionHistory": [],
  "confidenceHistory": []
}
```

---

## Data Validation (핵심 시스템)

다음 데이터는 저장하지 않음:

* low confidence
* no movement (low variance)
* 잘못된 행동
* sequence 부족
* landmark 누락

### 검증 요소

* 평균 confidence
* frame variance
* prediction consistency
* visibility ratio

---

## Database Schema

```
gesture_samples
```

```json
{
  "gesture": "airplane",
  "poseSequence": [],
  "predictionHistory": [],
  "confidenceHistory": [],
  "qualityScore": 0.85,
  "validated": true,
  "timestamp": "ISO",
  "modelVersion": "v1.0"
}
```

---

## Backend API

### POST /gesture-data

역할:

* 데이터 검증
* rate limit 체크
* 저장 여부 결정

---

## Anti-Abuse

* rate limiting
* request validation
* 비정상 데이터 필터링

---

## Training Pipeline

1. 데이터 export
2. validation filtering
3. dataset 구성
4. 모델 학습
5. 평가
6. ONNX export
7. 배포

---

## Model Strategy

### Cold Start (필수)

* 초기 dataset 직접 수집
* 최소 200~500 samples 확보
* v1.0 baseline 모델 생성

---

### Model Update

* batch retraining 사용
* version 관리
* 성능 비교 후 배포
* rollback 가능해야 함

---

### Shadow Mode (고급)

* v1.0 → 실제 서비스
* v1.1 → 백그라운드 테스트
* 두 결과 비교 분석

---

## Performance

* 목표 FPS: 30
* sequence buffer: 30
* inference 최적화 필요

---

## Privacy

* 영상 저장 안함
* 좌표 데이터만 저장
* 사용자에게 명확히 안내

---

## 주요 리스크

1. 데이터 오염
2. gesture ambiguity
3. 리텐션 부족
4. 전처리 불일치
5. 모델 성능 저하

---

## 우선순위

1. Pose detection
2. Game loop
3. Inference 연결
4. Data API
5. Validation pipeline
6. Training system
7. UX 개선

---

## 프로젝트 정의

이 프로젝트는:

* 게임
* 데이터 수집 시스템
* AI 학습 플랫폼

이다.

> 플레이가 곧 데이터이고, 데이터가 곧 모델을 개선한다.

````

---

# ⭐ 이번 버전 핵심 업그레이드

이전 대비 추가된 것:

```text
- Gesture metadata (핵심)
- Data validation 강화
- Cold start 전략
- Shadow mode
- UX 리텐션 구조
- 실제 운영 관점 추가
````

---
