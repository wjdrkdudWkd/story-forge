/**
 * authStore.ts
 *
 * 인증 토큰 및 유저 정보 로컬 저장소 유틸리티
 *
 * 저장 전략:
 *   access_token  → sessionStorage (탭 닫히면 삭제)
 *   refresh_token → localStorage   (7일 유지)
 *   user          → localStorage   (화면 복원용 캐시)
 */

import type { UserResponse } from "@/types/auth";

const ACCESS_KEY  = "sf:access_token";
const REFRESH_KEY = "sf:refresh_token";
const USER_KEY    = "sf:user";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export const authStore = {
  getAccessToken(): string | null {
    if (!isBrowser()) return null;
    return sessionStorage.getItem(ACCESS_KEY);
  },

  getRefreshToken(): string | null {
    if (!isBrowser()) return null;
    return localStorage.getItem(REFRESH_KEY);
  },

  getUser(): UserResponse | null {
    if (!isBrowser()) return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as UserResponse) : null;
    } catch {
      return null;
    }
  },

  setTokens(accessToken: string, refreshToken: string): void {
    if (!isBrowser()) return;
    sessionStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },

  setUser(user: UserResponse): void {
    if (!isBrowser()) return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear(): void {
    if (!isBrowser()) return;
    sessionStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
