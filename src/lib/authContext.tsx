"use client";

/**
 * authContext.tsx
 *
 * React Context 기반 인증 상태 관리
 *
 * 마운트 시 동작:
 *   1. sessionStorage에 access_token이 있으면 → 즉시 로그인 상태 복원
 *   2. 없지만 localStorage에 refresh_token이 있으면 → 서버에서 자동 갱신
 *   3. 둘 다 없으면 → 로그인 화면 표시
 *
 * apiClient의 401 처리로 토큰이 만료되면 sf:auth:expired 이벤트를 수신하여
 * 자동으로 로그아웃 처리합니다.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authClient } from "@/lib/authClient";
import { authStore } from "@/lib/authStore";
import type { UserResponse } from "@/types/auth";

// ─────────────────────────────────────────────
// Context 타입
// ─────────────────────────────────────────────

export interface AuthContextValue {
  /** 로그인된 유저 정보 (null = 비로그인) */
  user: UserResponse | null;
  /** 로그인 여부 */
  isAuthenticated: boolean;
  /** 초기 세션 복원 중 여부 */
  loading: boolean;
  /** 로그인 */
  login: (email: string, password: string) => Promise<void>;
  /** 회원가입 후 자동 로그인 */
  signup: (email: string, password: string, nickname?: string) => Promise<void>;
  /** 로그아웃 */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
});

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // ── 마운트 시 세션 복원 ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      const accessToken = authStore.getAccessToken();
      const storedUser = authStore.getUser();

      // Case 1: 세션에 토큰 + 캐시된 유저 → 즉시 복원
      if (accessToken && storedUser) {
        if (!cancelled) setUser(storedUser);
        if (!cancelled) setLoading(false);
        return;
      }

      // Case 2: refresh_token만 있음 → 서버에서 갱신 시도
      const refreshToken = authStore.getRefreshToken();
      if (refreshToken) {
        try {
          const tokens = await authClient.refresh(refreshToken);
          authStore.setTokens(tokens.access_token, tokens.refresh_token);
          const me = await authClient.me();
          authStore.setUser(me);
          if (!cancelled) setUser(me);
        } catch {
          authStore.clear();
        }
      }

      if (!cancelled) setLoading(false);
    };

    restore();
    return () => { cancelled = true; };
  }, []);

  // ── apiClient의 401 만료 이벤트 수신 ─────────────────────────
  useEffect(() => {
    const onExpired = () => {
      authStore.clear();
      setUser(null);
    };
    window.addEventListener("sf:auth:expired", onExpired);
    return () => window.removeEventListener("sf:auth:expired", onExpired);
  }, []);

  // ── 로그인 ────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authClient.login({ email, password });
    authStore.setTokens(tokens.access_token, tokens.refresh_token);
    const me = await authClient.me();
    authStore.setUser(me);
    setUser(me);
  }, []);

  // ── 회원가입 ──────────────────────────────────────────────────
  const signup = useCallback(
    async (email: string, password: string, nickname?: string) => {
      const tokens = await authClient.signup({ email, password, nickname });
      authStore.setTokens(tokens.access_token, tokens.refresh_token);
      const me = await authClient.me();
      authStore.setUser(me);
      setUser(me);
    },
    [],
  );

  // ── 로그아웃 ──────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await authClient.logout();
    } catch {
      // 서버 오류여도 클라이언트 상태는 정리
    }
    authStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
