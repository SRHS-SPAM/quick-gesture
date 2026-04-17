import { useRef } from 'react';
import type { Results } from '@mediapipe/pose';
import type { GameState } from '../types/gesture';

interface Props {
  state: GameState;
  onPoseResults: (results: Results) => void;
  topPreds: [string, number][];
  aiText: string;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export default function GamePage({ state, onPoseResults: _onPoseResults, topPreds, aiText, videoRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { selectedGestures, currentIdx, score, timeLeft } = state;
  const current = selectedGestures[currentIdx];
  const timePct = (timeLeft / 60) * 100;
  const timerColor = timeLeft > 20 ? '#4ecdc4' : timeLeft > 10 ? '#ffd93d' : '#ff6b6b';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* HUD */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="hud-pill">
          <div className="hud-label">점수</div>
          <div className="hud-value">{score}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.5)' }}>시간</span>
            <span style={{ fontWeight: 700 }}>{timeLeft}초</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,.12)', borderRadius: 8, height: 10, overflow: 'hidden' }}>
            <div style={{ width: `${timePct}%`, height: '100%', borderRadius: 8,
              background: timerColor, transition: 'width 1s linear, background .5s' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {selectedGestures.map((g, i) => (
            <div key={g.id} style={{
              width: 14, height: 14, borderRadius: '50%',
              background: i < currentIdx ? '#6bcb77' : i === currentIdx ? '#ffd93d' : 'rgba(255,255,255,.2)',
              border: `2px solid ${i < currentIdx ? '#6bcb77' : i === currentIdx ? '#ffd93d' : 'rgba(255,255,255,.3)'}`,
            }} />
          ))}
        </div>
      </div>

      {/* 메인 영역 */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* 카메라 */}
        <div style={{ position: 'relative', flex: 1, borderRadius: 16, overflow: 'hidden',
          background: '#000', aspectRatio: '4/3' }}>
          <video ref={videoRef} autoPlay muted playsInline
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', transform: 'scaleX(-1)' }} />
          <canvas ref={canvasRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }} />
          <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,50,50,.85)',
            color: '#fff', fontSize: '.75rem', fontWeight: 700, borderRadius: 6, padding: '4px 10px',
            display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%',
              animation: 'blink 1s infinite' }} />
            LIVE
          </div>
        </div>

        {/* 사이드 패널 */}
        <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {current && (
            <div className="panel-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.5)',
                textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>따라해보세요</div>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 6 }}>{current.emoji}</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ffd93d' }}>{current.label}</div>
            </div>
          )}
          <div className="panel-card" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: '1.2rem' }}>🧠</span>
              <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.5)', textTransform: 'uppercase' }}>AI 추측</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,.1)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: '.95rem', fontWeight: 500 }}>{aiText}</div>
            </div>
          </div>
          <div className="panel-card">
            <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.4)', textTransform: 'uppercase',
              letterSpacing: '1px', marginBottom: 10 }}>상위 추측</div>
            {topPreds.map(([id, conf], i) => {
              const colors = ['#ffd93d','#4ecdc4','#c77dff','#ff6b6b'];
              const pct = Math.round(conf * 100);
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ fontSize: '.85rem', width: 80, flexShrink: 0 }}>{id}</div>
                  <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,.1)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: colors[i], borderRadius: 4, transition: 'width .3s' }} />
                  </div>
                  <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.6)', width: 34, textAlign: 'right' }}>{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
