/**
 * aiClient.ts
 *
 * AI 클라이언트 인터페이스
 * - 현재: Mock 모드만 지원
 * - 향후: Server/API 모드 추가 가능
 */

import type { GenerateIdeaInput, IdeaResult } from "@/types/idea";
import { mockGenerateIdea } from "./mockAiClient";
import { logAI } from "./logAI";
import { buildIdeaPrompt, IDEA_PROMPT_VERSION } from "./prompts";

/**
 * 아이디어 생성
 *
 * @param input - 생성 입력 (form + compactedPayload + mode)
 * @returns 생성된 아이디어 결과 (candidates + state)
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
        // Mock 모드: 즉시 반환 (비동기 시뮬레이션)
        await simulateDelay(500);
        result = mockGenerateIdea(input);
        break;

      case "server":
        // Server 모드: 향후 구현
        throw new Error("Server mode not implemented yet");

      default:
        throw new Error(`Unknown mode: ${mode}`);
    }

    const latencyMs = Date.now() - startTime;

    // 프롬프트 빌드
    const prompt = buildIdeaPrompt(input);

    // AI 로그 기록
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

    // 프롬프트 빌드 (오류 로깅용)
    const prompt = buildIdeaPrompt(input);

    // 오류 로그 기록
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
        inputPayload: {
          compactedPayload: input.compactedPayload,
        },
      },
    }).catch((err) => {
      console.warn("[generateIdea] Failed to log AI error:", err);
    });

    throw error;
  }
}

/**
 * 비동기 지연 시뮬레이션
 */
function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Compacted Payload 생성
 *
 * IdeaFormState에서 undefined/null 제거
 */
export function compactFormPayload(
  form: Record<string, any>
): Record<string, any> {
  const compacted: Record<string, any> = {};

  for (const [key, value] of Object.entries(form)) {
    if (value !== undefined && value !== null) {
      // 배열의 경우 빈 배열 제외
      if (Array.isArray(value) && value.length === 0) {
        continue;
      }
      compacted[key] = value;
    }
  }

  return compacted;
}
