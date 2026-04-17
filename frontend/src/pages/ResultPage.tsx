import type { GameState } from '../types/gesture';

interface Props {
  state: GameState;
  onRestart: () => void;
  onHome: () => void;
}

export default function ResultPage({ state, onRestart, onHome }: Props) {
  const { score, completedGestures } = state;
  const total = completedGestures.length;
  const emoji = score >= 5 ? '🏆' : score >= 3 ? '🎯' : '💪';
  const title = score >= 5 ? '대단해요!' : score >= 3 ? '잘했어요!' : '계속 연습하세요!';

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '5rem', marginBottom: 8 }}>{emoji}</div>
      <h2 style={{ fontSize: 'clamp(1.8rem,5vw,3rem)', fontWeight: 700, marginBottom: 8 }}>{title}</h2>
      <div style={{ fontSize: '5rem', fontWeight: 900, color: '#ffd93d', lineHeight: 1, margin: '16px 0 8px' }}>
        {score}
      </div>
      <div style={{ color: 'rgba(255,255,255,.6)', marginBottom: 28 }}>/ {total}개 제스처</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
        {completedGestures.map(({ gesture, hit }) => (
          <div key={gesture.id} style={{
            borderRadius: 16, padding: '8px 16px', fontSize: '.9rem', fontWeight: 500,
            background: hit ? 'rgba(107,203,119,.2)' : 'rgba(255,107,107,.15)',
            border: `1px solid ${hit ? '#6bcb77' : 'rgba(255,107,107,.4)'}`,
            color: hit ? '#6bcb77' : 'rgba(255,255,255,.5)',
            textDecoration: hit ? 'none' : 'line-through',
          }}>
            {gesture.emoji} {gesture.label}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={onRestart}>다시 하기 🔄</button>
        <button className="btn btn-ghost" onClick={onHome}>홈 🏠</button>
      </div>
    </div>
  );
}
