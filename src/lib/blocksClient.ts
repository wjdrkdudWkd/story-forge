/**
 * blocksClient.ts
 *
 * 24블록 생성 클라이언트
 * 현재는 Mock만 지원, 나중에 실제 AI 서버로 확장 가능
 */

import type {
  GenerateBlocksOverviewInput,
  GenerateBlockDetailInput,
  RegenerateOverviewInput,
  ExpandOverviewInput,
  BlocksDraft,
  BlockOverviewVariant,
  BlockDetailVariant,
} from "@/types/blocks";
import {
  mockGenerateBlocksOverview,
  mockGenerateBlockDetail,
  mockRegenerateOverview,
  mockExpandOverview,
} from "./mockBlocksClient";

/**
 * 24블록 개요 생성
 */
export async function generateBlocksOverview(
  input: GenerateBlocksOverviewInput
): Promise<BlocksDraft> {
  const mode = input.mode || "mock";

  if (mode === "server") {
    throw new Error("Server mode not implemented yet");
  }

  // Mock 모드 (기본값)
  await new Promise((resolve) => setTimeout(resolve, 1200));

  return mockGenerateBlocksOverview(input);
}

/**
 * 블록 상세 생성
 */
export async function generateBlockDetail(
  input: GenerateBlockDetailInput
): Promise<BlockDetailVariant> {
  const mode = input.mode || "mock";

  if (mode === "server") {
    throw new Error("Server mode not implemented yet");
  }

  // Mock 모드
  await new Promise((resolve) => setTimeout(resolve, 600));

  return mockGenerateBlockDetail(input);
}

/**
 * 개요 재생성
 */
export async function regenerateOverview(
  input: RegenerateOverviewInput
): Promise<BlockOverviewVariant> {
  const mode = input.mode || "mock";

  if (mode === "server") {
    throw new Error("Server mode not implemented yet");
  }

  // Mock 모드
  await new Promise((resolve) => setTimeout(resolve, 500));

  return mockRegenerateOverview(input);
}

/**
 * 개요 발전시키기
 */
export async function expandOverview(
  input: ExpandOverviewInput
): Promise<BlockOverviewVariant> {
  const mode = input.mode || "mock";

  if (mode === "server") {
    throw new Error("Server mode not implemented yet");
  }

  // Mock 모드
  await new Promise((resolve) => setTimeout(resolve, 500));

  return mockExpandOverview(input);
}
