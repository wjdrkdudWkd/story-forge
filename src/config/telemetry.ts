/**
 * telemetry.ts
 *
 * 텔레메트리 설정
 * - 이벤트 추적 활성화/비활성화
 * - AI 로깅 활성화/비활성화
 */

/**
 * 텔레메트리 활성화 여부
 * - true: 이벤트와 AI 로그 기록
 * - false: 모든 텔레메트리 비활성화
 */
export const TELEMETRY_ENABLED =
  process.env.NEXT_PUBLIC_TELEMETRY_ENABLED !== "false";

/**
 * Supabase 사용 여부
 * - true: Supabase에 저장
 * - false: 로컬 파일에 저장 (개발 환경)
 */
export const USE_SUPABASE = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * 디버그 패널 표시 여부
 * - true: AnalyticsDebugPanel 표시
 * - false: 숨김
 */
export const SHOW_DEBUG_PANEL =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_SHOW_DEBUG_PANEL === "true";
