import { useReducer, useRef, useCallback } from 'react';
import type { GameState, GamePhase, GestureInfo, PredictionResult } from '../types/gesture';
import { GESTURES } from '../constants/gestures';
import { sendGestureData } from '../services/api';

type Action =
  | { type: 'START'; gestures: GestureInfo[] }
  | { type: 'SET_PHASE'; phase: GamePhase }
  | { type: 'TICK' }
  | { type: 'CONFIRM' }
  | { type: 'NEXT' }
  | { type: 'END' };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START':
      return {
        phase: 'countdown',
        selectedGestures: action.gestures,
        currentIdx: 0,
        score: 0,
        timeLeft: 60,
        completedGestures: [],
        confirmFrames: 0,
      };
    case 'SET_PHASE':
      return { ...state, phase: action.phase };
    case 'TICK':
      return { ...state, timeLeft: state.timeLeft - 1 };
    case 'CONFIRM':
      return { ...state, confirmFrames: state.confirmFrames + 1 };
    case 'NEXT': {
      const gesture = state.selectedGestures[state.currentIdx];
      return {
        ...state,
        phase: 'playing',
        score: state.score + 1,
        currentIdx: state.currentIdx + 1,
        confirmFrames: 0,
        completedGestures: [...state.completedGestures, { gesture, hit: true }],
      };
    }
    case 'END': {
      const remaining = state.selectedGestures.slice(state.currentIdx);
      return {
        ...state,
        phase: 'result',
        completedGestures: [
          ...state.completedGestures,
          ...remaining.map(g => ({ gesture: g, hit: false })),
        ],
      };
    }
    default:
      return state;
  }
}

const INITIAL: GameState = {
  phase: 'intro',
  selectedGestures: [],
  currentIdx: 0,
  score: 0,
  timeLeft: 60,
  completedGestures: [],
  confirmFrames: 0,
};

function pickGestures() {
  return [...GESTURES].sort(() => Math.random() - 0.5).slice(0, 6);
}

export function useGame() {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const poseSeqRef        = useRef<number[][][]>([]);
  const predHistoryRef    = useRef<string[]>([]);
  const confHistoryRef    = useRef<number[]>([]);

  const startGame = useCallback(() => {
    poseSeqRef.current     = [];
    predHistoryRef.current = [];
    confHistoryRef.current = [];
    dispatch({ type: 'START', gestures: pickGestures() });
  }, []);

  const startTimer = useCallback((onEnd: () => void) => {
    timerRef.current = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, 1000);
    setTimeout(() => {
      clearInterval(timerRef.current!);
      onEnd();
    }, 60000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const processPrediction = useCallback(
    (preds: PredictionResult, currentGesture: GestureInfo, currentConfFrames: number) => {
      const sorted = Object.entries(preds).sort((a, b) => b[1] - a[1]);
      const [topId, topConf] = sorted[0];

      predHistoryRef.current.push(topId);
      confHistoryRef.current.push(topConf);
      if (predHistoryRef.current.length > 90) {
        predHistoryRef.current.shift();
        confHistoryRef.current.shift();
      }

      const hit = topId === currentGesture.id && topConf >= currentGesture.minConfidence;
      if (hit) {
        const nextFrames = currentConfFrames + 1;
        if (nextFrames >= currentGesture.threshold) {
          sendGestureData({
            gestureLabel: currentGesture.id,
            poseSequence: poseSeqRef.current.slice(-30),
            predictionHistory: predHistoryRef.current.slice(-30),
            confidenceHistory: confHistoryRef.current.slice(-30),
          });
          return 'confirmed' as const;
        }
        dispatch({ type: 'CONFIRM' });
      }
      return 'pending' as const;
    },
    []
  );

  const addPoseFrame = useCallback((frame: number[][]) => {
    poseSeqRef.current.push(frame);
    if (poseSeqRef.current.length > 30) poseSeqRef.current.shift();
  }, []);

  return {
    state,
    poseSeqRef,
    predHistoryRef,
    confHistoryRef,
    startGame,
    startTimer,
    stopTimer,
    processPrediction,
    addPoseFrame,
    dispatch,
  };
}
