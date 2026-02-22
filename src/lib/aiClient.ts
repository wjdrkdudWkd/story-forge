/**
 * aiClient.ts
 *
 * 아이디어 생성 클라이언트
 *
 * [리팩토링]
 * - mock 모드: 기존 mockGenerateIdea() 유지 (백엔드 개발 전 테스트용)
 * - server 모드: FastAPI POST /api/v1/story/idea 호출
 *
 * page.tsx에서 mode: 'server'로 변경하면 즉시 백엔드 연동 가능.
 */

import type { GenerateIdeaInput, IdeaResult } from "@/types/idea";
import { mockGenerateIdea } from "./mockAiClient";
import { generateIdeaFromServer } from "./api/storyApi";
import { logAI } from "./logAI";
import { buildIdeaPrompt, IDEA_PROMPT_VERSION } from "./prompts";

/**
 * 아이디어 생성
 */
export async function generateIdea(
  input: GenerateIdeaInput
): Promise<IdeaResult> {
  const mode = input.mode ?? "mock";
  const startTime = Date.now();

  try {
    let result: IdeaResult;

    switch (mode) {
      case "mock":
        await simulateDelay(500);
        result = mockGenerateIdea(input);
        break;

      case "server":
        // FastAPI 백엔드 호출
        result = await generateIdeaFromServer(
          input.form,
          input.compactedPayload
        );
        break;

      default:
        throw new Error(`Unknown mode: ${mode}`);
    }

    const latencyMs = Date.now() - startTime;

    // 프롬프트 빌드 (로깅용 — mock 모드에서도 실제 프롬프트 구조 기록)
    const prompt = buildIdeaPrompt(input);

    logAI({
      stage: "idea",
      mode,
      prompt,
      response: JSON.stringify({
        candidatesCount: result.candidates.length,
        state: result.state,
      }),
      model: mode === "mock" ? "mock-idea-v1" : undefined,
      latencyMs,
      ok: true,
      meta: {
        promptVersion: IDEA_PROMPT_VERSION,
        inputPayload: {
          tone: input.form.tone,
          realism: input.form.realism,
          compactedPayload: input.compactedPayload,
        },
      },
    }).catch((err) => {
      console.warn("[generateIdea] Failed to log AI call:", err);
    });

    return result;
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const prompt = buildIdeaPrompt(input);

    logAI({
      stage: "idea",
      mode,
      prompt,
      response: "",
      latencyMs,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      meta: {
        promptVersion: IDEA_PROMPT_VERSION,
        inputPayload: { compactedPayload: input.compactedPayload },
      },
    }).catch((err) => {
      console.warn("[generateIdea] Failed to log AI error:", err);
    });

    throw error;
  }
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * IdeaFormState에서 undefined/null 제거한 압축 payload 생성
 */
export function compactFormPayload(
  form: Record<string, unknown>
): Record<string, unknown> {
  const compacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(form)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value) && value.length === 0) continue;
      compacted[key] = value;
    }
  }

  return compacted;
}
