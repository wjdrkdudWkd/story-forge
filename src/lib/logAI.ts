/**
 * logAI.ts
 *
 * AI 호출 로깅 헬퍼
 * - 클라이언트 사이드에서 AI 호출을 로깅
 * - /api/ai-calls로 전송
 */

import { getIdentity } from "./identity";
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
 * AI 호출을 로깅
 * - 비동기로 전송 (best-effort)
 * - 실패해도 앱 동작에 영향 없음
 */
export async function logAI(input: LogAIInput): Promise<void> {
  if (typeof window === "undefined") {
    console.warn("[logAI] Called from server side, skipping");
    return;
  }

  const { anonId, sessionId } = getIdentity();

  const payload = {
    anonId,
    sessionId,
    stage: input.stage,
    mode: input.mode,
    model: input.model,
    prompt: input.prompt,
    response: input.response,
    promptChars: input.prompt.length,
    responseChars: input.response.length,
    latencyMs: input.latencyMs,
    ok: input.ok !== undefined ? input.ok : true,
    error: input.error,
    meta: input.meta,
  };

  try {
    await sendAILog(payload);
  } catch (error) {
    console.warn("[logAI] Failed to send AI log:", error);
    // Retry once after 1 second
    setTimeout(async () => {
      try {
        await sendAILog(payload);
      } catch (retryError) {
        console.warn("[logAI] Retry failed, AI log dropped:", retryError);
      }
    }, 1000);
  }
}

/**
 * AI 로그를 서버로 전송
 */
async function sendAILog(payload: unknown): Promise<void> {
  const response = await fetch("/api/ai-calls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to send AI log: ${response.status}`);
  }
}
