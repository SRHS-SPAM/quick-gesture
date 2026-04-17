import type { GestureInfo } from '../types/gesture';

export const GESTURES: GestureInfo[] = [
  { id: 'airplane',      label: '비행기', emoji: '✈️',  desc: '양팔을 옆으로 벌려요',       type: 'static',  threshold: 18, minConfidence: 0.45 },
  { id: 'baseball',      label: '야구',   emoji: '⚾',  desc: '배트 스윙 자세를 취해요',    type: 'dynamic', threshold: 12, minConfidence: 0.40 },
  { id: 'star',          label: '별',     emoji: '⭐',  desc: '팔다리를 모두 벌려요',       type: 'static',  threshold: 18, minConfidence: 0.45 },
  { id: 'hands_up',      label: '손들기', emoji: '🙌',  desc: '양손을 높이 들어요',         type: 'static',  threshold: 18, minConfidence: 0.45 },
  { id: 'muscle',        label: '근육',   emoji: '💪',  desc: '보디빌더 근육 포즈',         type: 'static',  threshold: 18, minConfidence: 0.45 },
  { id: 'salute',        label: '경례',   emoji: '🫡',  desc: '이마에 손을 대요',           type: 'static',  threshold: 18, minConfidence: 0.45 },
  { id: 'wave',          label: '인사',   emoji: '👋',  desc: '한 손을 흔들어요',           type: 'dynamic', threshold: 10, minConfidence: 0.40 },
  { id: 'superhero',     label: '히어로', emoji: '🦸',  desc: '영웅 포즈를 취해요',         type: 'static',  threshold: 18, minConfidence: 0.45 },
  { id: 'robot',         label: '로봇',   emoji: '🤖',  desc: '딱딱한 로봇 자세',           type: 'static',  threshold: 18, minConfidence: 0.45 },
  { id: 'guitar',        label: '기타',   emoji: '🎸',  desc: '에어기타를 쳐요',            type: 'dynamic', threshold: 12, minConfidence: 0.40 },
  { id: 'weightlifting', label: '역도',   emoji: '🏋️',  desc: '바벨을 들어올리는 자세',     type: 'static',  threshold: 18, minConfidence: 0.45 },
  { id: 'boxing',        label: '복싱',   emoji: '🥊',  desc: '복싱 펀치 자세를 취해요',    type: 'dynamic', threshold: 12, minConfidence: 0.40 },
];

export const POSE_CONNECTIONS: [number, number][] = [
  [11,12],[11,13],[13,15],[12,14],[14,16],
  [11,23],[12,24],[23,24],
  [23,25],[25,27],[27,29],[27,31],
  [24,26],[26,28],[28,30],[28,32],
  [0,1],[1,3],[0,2],[2,4],
  [5,6],[5,7],[7,9],[6,8],[8,10],
];
