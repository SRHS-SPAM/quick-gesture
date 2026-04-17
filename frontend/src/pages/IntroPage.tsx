import { GESTURES } from '../constants/gestures';

interface Props {
  onStart: () => void;
}

export default function IntroPage({ onStart }: Props) {
  return (
    <div style={{ textAlign: 'center' }}>
      <span style={{ fontSize: '5rem', display: 'block', marginBottom: 12 }}>🕺</span>
      <h1 style={{ fontSize: 'clamp(2.5rem,6vw,4rem)', fontWeight: 900, marginBottom: 12,
        background: 'linear-gradient(135deg,#ffd93d,#ff6b6b,#c77dff)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Body Quick Draw!
      </h1>
      <p style={{ color: 'rgba(255,255,255,.8)', maxWidth: 440, margin: '0 auto 36px', lineHeight: 1.6 }}>
        몸으로 제스처를 취해보세요.<br />AI가 실시간으로 무엇인지 맞춰봅니다!
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 36 }}>
        {GESTURES.map(g => (
          <span key={g.id} style={{
            background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.15)',
            borderRadius: 20, padding: '8px 16px', fontSize: '.9rem',
          }}>
            {g.emoji} {g.label}
          </span>
        ))}
      </div>
      <button className="btn btn-primary" onClick={onStart}>게임 시작 🎮</button>
    </div>
  );
}
