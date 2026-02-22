/**
 * apiClient.ts
 *
 * 백엔드(FastAPI) 통신을 위한 공통 HTTP 클라이언트
 *
 * - 모든 API 요청의 단일 진입점
 * - NEXT_PUBLIC_BACKEND_URL 환경변수로 베이스 URL 설정
 * - 공통 헤더 / 에러 처리 / 타임아웃 관리
 * - anonId / sessionId 자동 주입 (X-Anon-Id, X-Session-Id)
 */

import { getIdentity } from "@/lib/identity";

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

async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  options?: RequestOptions
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
