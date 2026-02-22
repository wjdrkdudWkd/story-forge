/**
 * logAI.ts
 *
 * AI 호출 로깅 헬퍼
 *
 * [리팩토링] Next.js API Route(/api/ai-calls) 제거됨
 * → FastAPI 백엔드 POST /api/v1/logs/ai-call 로 직접 전송
 *
 * - 비동기 best-effort (실패해도 앱 동작에 영향 없음)
 * - 실패 시 1회 재시도 (1초 후)
 */

import { getIdentity } from "./identity";
import { logAICall } from "./api/storyApi";
import type { LogAICallRequest } from "./api/storyApi";
import type { UsageMeta } from "@/types/ai";

export interface LogAIInput {
  stage: string; // "idea" | "acts" | "blocks_overview" | "block_detail" | etc.
  mode: "mock" | "server";
  prompt: string;
  response: string;
  model?: string;
  latencyMs?: number;
  ok?: boolean;
  error?: string;
  meta?: Record<string, unknown> & {
    usage?: UsageMeta;
    promptVersion?: string;
    inputPayload?: Record<string, unknown>;
  };
}

/**
 * AI 호출을 백엔드로 로깅
 * - 비동기로 전송 (best-effort)
 * - 실패해도 앱 동작에 영향 없음
 */
export async function logAI(input: LogAIInput): Promise<void> {
  if (typeof window === "undefined") {
    console.warn("[logAI] Called from server side, skipping");
    return;
  }

  const { anonId, sessionId } = getIdentity();

  const payload: LogAICallRequest = {
    anon_id: anonId,
    session_id: sessionId,
    stage: input.stage,
    mode: input.mode,
    model: input.model,
    prompt: input.prompt,
    response: input.response,
    prompt_chars: input.prompt.length,
    response_chars: input.response.length,
    latency_ms: input.latencyMs,
    ok: input.ok !== undefined ? input.ok : true,
    error: input.error,
    meta: input.meta,
  };

  try {
    await logAICall(payload);
  } catch (error) {
    console.warn("[logAI] Failed to send AI log, retrying once...", error);
    setTimeout(async () => {
      try {
        await logAICall(payload);
      } catch (retryError) {
        console.warn("[logAI] Retry failed, AI log dropped:", retryError);
      }
    }, 1000);
  }
}
