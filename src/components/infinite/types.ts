/**
 * types.ts — Story Forge: Infinite 공유 타입
 */

export interface Character {
  id: string;
  name: string;
  color: string;      // hex (#7c3aed 등)
  personality: string;
  isMain?: boolean;   // Pre-Build DNA로 만든 주인공
}

export interface Choice {
  id: string;
  text: string;
}

/** 주인공 테마 색상 팔레트 (8가지) */
export const CHARACTER_PALETTE = [
  '#7c3aed', // violet   (0 — 기본 주인공)
  '#2563eb', // blue     (1)
  '#059669', // emerald  (2)
  '#d97706', // amber    (3)
  '#dc2626', // red      (4)
  '#0891b2', // cyan     (5)
  '#db2777', // pink     (6)
  '#16a34a', // green    (7)
] as const;

/** 색상별 반투명 배경 (Glassmorphism 헤더 tint용) */
export function colorToAlpha(hex: string, alpha = 0.08): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
