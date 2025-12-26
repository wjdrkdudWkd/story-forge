/**
 * actsClient.ts
 *
 * 5막 구조 생성 클라이언트
 * 현재는 Mock만 지원, 나중에 실제 AI 서버로 확장 가능
 */

import type { GenerateActsInput, ActsResult } from "@/types/acts";
import { mockGenerateActs } from "./mockActsClient";

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
  if (mode === "server") {
    throw new Error("Server mode not implemented yet");
  }

  // Mock 모드 (기본값)
  // 실제 AI 호출처럼 보이도록 약간의 지연 추가
  await new Promise((resolve) => setTimeout(resolve, 800));

  return mockGenerateActs(input);
}
