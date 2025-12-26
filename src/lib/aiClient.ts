/**
 * aiClient.ts
 *
 * AI 클라이언트 인터페이스
 * - 현재: Mock 모드만 지원
 * - 향후: Server/API 모드 추가 가능
 */

import type { GenerateIdeaInput, IdeaResult } from "@/types/idea";
import { mockGenerateIdea } from "./mockAiClient";

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

  switch (mode) {
    case "mock":
      // Mock 모드: 즉시 반환 (비동기 시뮬레이션)
      await simulateDelay(500);
      return mockGenerateIdea(input);

    case "server":
      // Server 모드: 향후 구현
      throw new Error("Server mode not implemented yet");

    default:
      throw new Error(`Unknown mode: ${mode}`);
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
