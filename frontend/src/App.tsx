import { useRef, useState, useCallback, useEffect } from 'react';
import type { Results } from '@mediapipe/pose';
import { useGame } from './hooks/useGame';
import { usePose } from './hooks/usePose';
import { loadModel, predict, isModelReady } from './utils/inference';
import IntroPage from './pages/IntroPage';
import GamePage from './pages/GamePage';
import ResultPage from './pages/ResultPage';
import { GESTURES } from './constants/gestures';
import './index.css';

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null!);
  const [loadingText, setLoadingText] = useState('로딩 중...');
  const [topPreds, setTopPreds] = useState<[string, number][]>([]);
  const [aiText, setAiText] = useState('카메라 앞에 서세요...');
  const inferringRef = useRef(false);

  const { state, poseSeqRef, startGame, startTimer, stopTimer, processPrediction, addPoseFrame, dispatch } = useGame();

  const onPoseResults = useCallback(async (results: Results) => {
    if (!results.poseLandmarks) return;

    const frame = results.poseLandmarks.map(lm => [lm.x, lm.y, lm.z]);
    addPoseFrame(frame);

    if (state.phase !== 'playing' || inferringRef.current || !isModelReady()) return;
    inferringRef.current = true;

    try {
      const preds = await predict(poseSeqRef.current);
      if (!preds) return;

      const sorted = Object.entries(preds).sort((a, b) => b[1] - a[1]);
      setTopPreds(sorted.slice(0, 4));

      const [topId, topConf] = sorted[0];
      const gesture = GESTURES.find(g => g.id === topId);
      const label = gesture?.label ?? topId;
      setAiText(topConf < 0.25 ? '잘 모르겠어요...' : topConf < 0.4 ? `뭔가 보이는데... ${label}?` : `${label}인 것 같아요!`);

      const current = state.selectedGestures[state.currentIdx];
      if (!current) return;

      const result = processPrediction(preds, current, state.confirmFrames);
      if (result === 'confirmed') {
        dispatch({ type: 'NEXT' });
        if (state.currentIdx + 1 >= state.selectedGestures.length) {
          stopTimer();
          dispatch({ type: 'END' });
        }
      }
    } finally {
      inferringRef.current = false;
    }
  }, [state, addPoseFrame, poseSeqRef, processPrediction, dispatch, stopTimer]);

  const { start: startPose } = usePose(onPoseResults);

  // 타이머 관리
  useEffect(() => {
    if (state.phase === 'playing') {
      startTimer(() => dispatch({ type: 'END' }));
    }
    return () => { if (state.phase !== 'playing') stopTimer(); };
  }, [state.phase]);

  // timeLeft 감지 → 종료
  useEffect(() => {
    if (state.phase === 'playing' && state.timeLeft <= 0) {
      stopTimer();
      dispatch({ type: 'END' });
    }
  }, [state.timeLeft]);

  const handleStart = useCallback(async () => {
    dispatch({ type: 'SET_PHASE', phase: 'permission' });
  }, [dispatch]);

  const handleCameraAllow = useCallback(async () => {
    dispatch({ type: 'SET_PHASE', phase: 'loading' });
    setLoadingText('카메라 연결 중...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
      videoRef.current.srcObject = stream;
      await new Promise<void>(r => { videoRef.current.onloadedmetadata = () => r(); });

      setLoadingText('MediaPipe 로딩 중...');
      await startPose(videoRef.current);

      setLoadingText('AI 모델 로딩 중...');
      await loadModel('/gesture_model.onnx', '/labels.json');

      setLoadingText('준비 완료!');
      setTimeout(() => {
        startGame();
        setTimeout(() => dispatch({ type: 'SET_PHASE', phase: 'playing' }), 3500);
      }, 500);
    } catch {
      dispatch({ type: 'SET_PHASE', phase: 'permission' });
    }
  }, [startPose, startGame, dispatch]);

  return (
    <div id="app">
      {state.phase === 'intro' && <IntroPage onStart={handleStart} />}

      {state.phase === 'permission' && (
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: 16 }}>📷</span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 12 }}>카메라 접근 필요</h2>
          <p style={{ color: 'rgba(255,255,255,.65)', marginBottom: 28 }}>
            웹캠이 필요합니다.<br />모든 데이터는 좌표만 저장됩니다.
          </p>
          <button className="btn btn-primary" onClick={handleCameraAllow}>카메라 허용 📸</button>
        </div>
      )}

      {state.phase === 'loading' && (
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>{loadingText}</h2>
        </div>
      )}

      {state.phase === 'countdown' && (
        <div style={{ textAlign: 'center', fontSize: '8rem', fontWeight: 900, color: '#ffd93d' }}>
          3
        </div>
      )}

      {(state.phase === 'playing') && (
        <GamePage
          state={state}
          onPoseResults={onPoseResults}
          topPreds={topPreds}
          aiText={aiText}
          videoRef={videoRef}
        />
      )}

      {state.phase === 'result' && (
        <ResultPage
          state={state}
          onRestart={() => { startGame(); setTimeout(() => dispatch({ type: 'SET_PHASE', phase: 'playing' }), 3500); }}
          onHome={() => dispatch({ type: 'SET_PHASE', phase: 'intro' })}
        />
      )}
    </div>
  );
}
