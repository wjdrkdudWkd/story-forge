/**
 * useAuth.ts
 *
 * [리팩토링] Supabase Auth 제거됨
 *
 * 인증은 FastAPI 백엔드로 이전 예정입니다.
 * 백엔드 인증 API가 구현될 때까지 항상 비로그인 상태를 반환하는
 * stub 구현체입니다. 인터페이스는 기존과 동일하게 유지합니다.
 */

"use client";

export interface UseAuthReturn {
  user: null;
  loading: false;
  error: null;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  isConfigured: false;
}

export function useAuth(): UseAuthReturn {
  const signInWithEmail = async (_email: string): Promise<void> => {
    console.warn("[useAuth] Auth not implemented. Backend auth API pending.");
  };

  const signOut = async (): Promise<void> => {
    console.warn("[useAuth] Auth not implemented. Backend auth API pending.");
  };

  return {
    user: null,
    loading: false,
    error: null,
    signInWithEmail,
    signOut,
    isConfigured: false,
  };
}
