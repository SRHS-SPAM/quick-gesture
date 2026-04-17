const BASE_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';

interface GestureDataPayload {
  gestureLabel: string;
  poseSequence: number[][][];
  predictionHistory: string[];
  confidenceHistory: number[];
}

export async function sendGestureData(payload: GestureDataPayload): Promise<void> {
  try {
    await fetch(`${BASE_URL}/api/gesture-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // 네트워크 오류는 게임 흐름에 영향 없이 무시
  }
}
