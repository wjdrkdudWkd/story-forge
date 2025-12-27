/**
 * identity.ts
 *
 * 클라이언트 측 익명 ID 및 세션 ID 관리
 * - anonId: localStorage에 영구 저장
 * - sessionId: sessionStorage에 세션별로 저장
 */

const ANON_ID_KEY = "story-forge:anon-id";
const SESSION_ID_KEY = "story-forge:session-id";

/**
 * 익명 사용자 ID 가져오기 또는 생성
 * localStorage에 저장되어 브라우저를 닫아도 유지됨
 */
export function getOrCreateAnonId(): string {
  if (typeof window === "undefined") return "";

  let anonId = localStorage.getItem(ANON_ID_KEY);
  if (!anonId) {
    anonId = crypto.randomUUID();
    localStorage.setItem(ANON_ID_KEY, anonId);
  }
  return anonId;
}

/**
 * 세션 ID 가져오기 또는 생성
 * sessionStorage에 저장되어 탭/창을 닫으면 새로 생성됨
 */
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

/**
 * 현재 identity 정보 반환
 */
export function getIdentity(): { anonId: string; sessionId: string } {
  return {
    anonId: getOrCreateAnonId(),
    sessionId: getOrCreateSessionId(),
  };
}
