export interface GestureInfo {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  type: 'static' | 'dynamic';
  threshold: number;
  minConfidence: number;
}

export interface PredictionResult {
  [gestureId: string]: number;
}

export type GamePhase = 'intro' | 'permission' | 'loading' | 'countdown' | 'playing' | 'result';

export interface GameState {
  phase: GamePhase;
  selectedGestures: GestureInfo[];
  currentIdx: number;
  score: number;
  timeLeft: number;
  completedGestures: { gesture: GestureInfo; hit: boolean }[];
  confirmFrames: number;
}
