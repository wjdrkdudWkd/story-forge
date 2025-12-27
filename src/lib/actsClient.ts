/**
 * actsClient.ts
 *
 * 5막 구조 생성 클라이언트
 * 현재는 Mock만 지원, 나중에 실제 AI 서버로 확장 가능
 */

import type { GenerateActsInput, ActsResult } from "@/types/acts";
import { mockGenerateActs } from "./mockActsClient";
import { logAI } from "./logAI";
import { buildActsPrompt, ACTS_PROMPT_VERSION } from "./prompts";

/**
 * 5막 구조 생성
 *
 * @param input - logline, synopsis, state 포함
 * @param mode - "mock" | "server" (현재는 mock만 지원)
 * @returns ActsResult
 */
export async function generateActs(
  input: GenerateActsInput,
  mode: "mock" | "server" = "mock"
): Promise<ActsResult> {
  const startTime = Date.now();

  try {
    if (mode === "server") {
      throw new Error("Server mode not implemented yet");
    }

    // Mock 모드 (기본값)
    // 실제 AI 호출처럼 보이도록 약간의 지연 추가
    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = mockGenerateActs(input);
    const latencyMs = Date.now() - startTime;

    // 프롬프트 빌드
    const prompt = buildActsPrompt(input);

    // AI 로그 기록
    logAI({
      stage: "acts",
      mode,
      prompt,
      response: JSON.stringify({
        acts: result.acts.map((act) => ({
          key: act.key,
          title: act.title,
        })),
      }),
      model: mode === "mock" ? "mock-acts-v1" : undefined,
      latencyMs,
      ok: true,
      meta: {
        promptVersion: ACTS_PROMPT_VERSION,
        inputPayload: {
          logline: input.logline,
          synopsis: input.synopsis,
          tone: input.state.tone,
          motifsRanked: input.state.motifsRanked,
        },
      },
    }).catch((err) => {
      console.warn("[generateActs] Failed to log AI call:", err);
    });

    return result;
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    // 프롬프트 빌드 (오류 로깅용)
    const prompt = buildActsPrompt(input);

    // 오류 로그 기록
    logAI({
      stage: "acts",
      mode,
      prompt,
      response: "",
      latencyMs,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      meta: {
        promptVersion: ACTS_PROMPT_VERSION,
        inputPayload: {
          logline: input.logline,
          synopsis: input.synopsis,
          tone: input.state.tone,
        },
      },
    }).catch((err) => {
      console.warn("[generateActs] Failed to log AI error:", err);
    });

    throw error;
  }
}
