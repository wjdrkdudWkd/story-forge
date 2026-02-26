/**
 * auth.ts
 *
 * FastAPI 백엔드 인증 API 타입 정의
 * POST /api/v1/auth/signup | login | refresh
 * GET  /api/v1/auth/me
 * POST /api/v1/auth/logout
 * PUT  /api/v1/auth/password
 */

// ─────────────────────────────────────────────
// 요청 타입
// ─────────────────────────────────────────────

export interface SignupRequest {
  email: string;
  password: string;
  nickname?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// ─────────────────────────────────────────────
// 응답 타입
// ─────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  /** 액세스 토큰 만료까지 남은 초 */
  expires_in: number;
}

export interface UserResponse {
  id: string;
  email: string;
  nickname?: string;
  is_active: boolean;
  created_at: string;
}
