/**
 * actsClient.ts
 *
 * 5막 구조 생성 클라이언트
 *
 * [리팩토링]
 * - mock 모드: 기존 mockGenerateActs() 유지 (백엔드 개발 전 테스트용)
 * - server 모드: FastAPI POST /api/v1/story/acts 호출
 */

import type { GenerateActsInput, ActsResult } from "@/types/acts";
import { mockGenerateActs } from "./mockActsClient";
import { generateActsFromServer } from "./api/storyApi";
import { logAI } from "./logAI";
import { buildActsPrompt, ACTS_PROMPT_VERSION } from "./prompts";

/**
 * 5막 구조 생성
 */
export async function generateActs(
  input: GenerateActsInput,
  mode: "mock" | "server" = "mock"
): Promise<ActsResult> {
  const startTime = Date.now();

  try {
    let result: ActsResult;

    if (mode === "server") {
      // FastAPI 백엔드 호출 (actCount 포함)
      result = await generateActsFromServer(
        input.logline,
        input.synopsis,
        input.state,
        input.actCount
      );
    } else {
      // Mock 모드
      await new Promise((resolve) => setTimeout(resolve, 800));
      result = mockGenerateActs(input);
    }

    const latencyMs = Date.now() - startTime;
    const prompt = buildActsPrompt(input);

    logAI({
      stage: "acts",
      mode,
      prompt,
      response: JSON.stringify({
        acts: result.acts.map((act) => ({ key: act.key, title: act.title })),
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
          actCount: input.actCount,
        },
      },
    }).catch((err) => {
      console.warn("[generateActs] Failed to log AI call:", err);
    });

    return result;
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const prompt = buildActsPrompt(input);

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
