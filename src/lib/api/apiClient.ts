/**
 * apiClient.ts
 *
 * 백엔드(FastAPI) 통신을 위한 공통 HTTP 클라이언트
 *
 * - 모든 API 요청의 단일 진입점
 * - NEXT_PUBLIC_BACKEND_URL 환경변수로 베이스 URL 설정
 * - 공통 헤더 / 에러 처리 / 타임아웃 관리
 * - anonId / sessionId 자동 주입 (X-Anon-Id, X-Session-Id)
 * - Authorization: Bearer {access_token} 자동 주입 (withAuth 옵션)
 * - 401 응답 시 refresh token으로 자동 재발급 후 1회 재시도
 */

import { getIdentity } from "@/lib/identity";
import { authStore } from "@/lib/authStore";

// ─────────────────────────────────────────────
// 설정
// ─────────────────────────────────────────────

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

const DEFAULT_TIMEOUT_MS = 30_000; // 30초

// ─────────────────────────────────────────────
// 공통 에러 타입
// ─────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

// ─────────────────────────────────────────────
// 요청 옵션
// ─────────────────────────────────────────────

interface RequestOptions {
  /** 추가 헤더 */
  headers?: Record<string, string>;
  /** 타임아웃 (ms), 기본값 30초 */
  timeoutMs?: number;
  /** anonId / sessionId 헤더 자동 주입 여부 (기본 true) */
  withIdentity?: boolean;
  /**
   * Authorization: Bearer 헤더 자동 주입 여부 (기본 true)
   * 인증 엔드포인트(signup/login/refresh)는 false로 설정
   */
  withAuth?: boolean;
}

// ─────────────────────────────────────────────
// 내부 헬퍼
// ─────────────────────────────────────────────

function buildHeaders(options?: RequestOptions): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // identity 헤더 주입 (서버사이드 렌더링 환경 제외)
  if (options?.withIdentity !== false && typeof window !== "undefined") {
    const { anonId, sessionId } = getIdentity();
    headers["X-Anon-Id"] = anonId;
    headers["X-Session-Id"] = sessionId;
  }

  // Authorization: Bearer 헤더 주입
  if (options?.withAuth !== false && typeof window !== "undefined") {
    const token = authStore.getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  if (options?.headers) {
    Object.assign(headers, options.headers);
  }

  return headers;
}

async function parseErrorBody(response: Response): Promise<string> {
  try {
    const json = await response.json();
    return json?.detail ?? json?.error ?? JSON.stringify(json);
  } catch {
    return response.statusText || `HTTP ${response.status}`;
  }
}

/**
 * 토큰 갱신 전용 내부 함수 (authClient 순환참조 방지를 위해 fetch 직접 호출)
 * 성공 시 새 토큰을 authStore에 저장하고 true 반환
 */
async function tryRefreshToken(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const refreshToken = authStore.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const resp = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!resp.ok) return false;
    const tokens = await resp.json();
    authStore.setTokens(tokens.access_token, tokens.refresh_token);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  options?: RequestOptions,
  _isRetry = false
): Promise<T> {
  const url = `${BACKEND_URL}${path}`;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: buildHeaders(options),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timer);

    // ── 401 자동 갱신 (withAuth=true인 경우, 1회만) ──────────────
    if (
      response.status === 401 &&
      options?.withAuth !== false &&
      !_isRetry &&
      typeof window !== "undefined"
    ) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        // 새 토큰으로 원래 요청 재시도
        return request<T>(method, path, body, options, true);
      }
      // 갱신 실패 → 로그아웃 이벤트 발행 (authContext에서 수신)
      authStore.clear();
      window.dispatchEvent(new Event("sf:auth:expired"));
      throw new ApiError(401, "AUTH_EXPIRED", "인증이 만료되었습니다. 다시 로그인해주세요.");
    }

    if (!response.ok) {
      const message = await parseErrorBody(response);
      throw new ApiError(response.status, `HTTP_${response.status}`, message);
    }

    // 204 No Content 등 body 없는 응답 처리
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return undefined as unknown as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timer);

    if (error instanceof ApiError) throw error;

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new NetworkError(`Request timed out after ${timeoutMs}ms: ${url}`);
    }

    if (error instanceof TypeError) {
      // fetch 자체 실패 (CORS, 서버 다운 등)
      throw new NetworkError(`Network error: ${error.message} (${url})`);
    }

    throw error;
  }
}

// ─────────────────────────────────────────────
// Public API (GET / POST / PUT / PATCH / DELETE)
// ─────────────────────────────────────────────

export const apiClient = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("GET", path, undefined, options);
  },

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>("POST", path, body, options);
  },

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>("PUT", path, body, options);
  },

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>("PATCH", path, body, options);
  },

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("DELETE", path, undefined, options);
  },
};
