/**
 * authClient.ts
 *
 * FastAPI 백엔드 인증 엔드포인트 호출 함수 모음
 *
 * POST /api/v1/auth/signup
 * POST /api/v1/auth/login
 * POST /api/v1/auth/refresh
 * GET  /api/v1/auth/me
 * POST /api/v1/auth/logout
 * PUT  /api/v1/auth/password
 */

import { apiClient } from "@/lib/api/apiClient";
import type {
  SignupRequest,
  LoginRequest,
  TokenResponse,
  UserResponse,
  ChangePasswordRequest,
} from "@/types/auth";

export const authClient = {
  /** 회원가입 → 토큰 발급 */
  signup(req: SignupRequest): Promise<TokenResponse> {
    return apiClient.post<TokenResponse>("/api/v1/auth/signup", req, {
      withAuth: false,
    });
  },

  /** 로그인 → 토큰 발급 */
  login(req: LoginRequest): Promise<TokenResponse> {
    return apiClient.post<TokenResponse>("/api/v1/auth/login", req, {
      withAuth: false,
    });
  },

  /** Access Token 갱신 (Refresh Token Rotation) */
  refresh(refreshToken: string): Promise<TokenResponse> {
    return apiClient.post<TokenResponse>(
      "/api/v1/auth/refresh",
      { refresh_token: refreshToken },
      { withAuth: false },
    );
  },

  /** 내 정보 조회 */
  me(): Promise<UserResponse> {
    return apiClient.get<UserResponse>("/api/v1/auth/me");
  },

  /** 로그아웃 */
  logout(): Promise<void> {
    return apiClient.post<void>("/api/v1/auth/logout");
  },

  /** 비밀번호 변경 */
  changePassword(req: ChangePasswordRequest): Promise<void> {
    return apiClient.put<void>("/api/v1/auth/password", req);
  },
};
