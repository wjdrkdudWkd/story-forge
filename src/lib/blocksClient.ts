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
import { logAI } from "./logAI";

/**
 * 24블록 개요 생성
 */
export async function generateBlocksOverview(
  input: GenerateBlocksOverviewInput
): Promise<BlocksDraft> {
  const mode = input.mode || "mock";
  const startTime = Date.now();

  try {
    if (mode === "server") {
      throw new Error("Server mode not implemented yet");
    }

    // Mock 모드 (기본값)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const result = mockGenerateBlocksOverview(input);
    const latencyMs = Date.now() - startTime;

    // AI 로그 기록
    logAI({
      stage: "blocks_overview",
      mode,
      prompt: JSON.stringify({
        logline: input.candidate.logline,
        acts: input.acts?.acts.map((act) => act.key),
      }),
      response: JSON.stringify({
        blockCount: Object.keys(result.blocksByIndex).length,
      }),
      model: mode === "mock" ? "mock-blocks-overview-v1" : undefined,
      latencyMs,
      ok: true,
    }).catch((err) => {
      console.warn("[generateBlocksOverview] Failed to log AI call:", err);
    });

    return result;
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    logAI({
      stage: "blocks_overview",
      mode,
      prompt: JSON.stringify({ logline: input.candidate.logline }),
      response: "",
      latencyMs,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }).catch((err) => {
      console.warn("[generateBlocksOverview] Failed to log AI error:", err);
    });

    throw error;
  }
}

/**
 * 블록 상세 생성
 */
export async function generateBlockDetail(
  input: GenerateBlockDetailInput
): Promise<BlockDetailVariant> {
  const mode = input.mode || "mock";
  const startTime = Date.now();

  try {
    if (mode === "server") {
      throw new Error("Server mode not implemented yet");
    }

    // Mock 모드
    await new Promise((resolve) => setTimeout(resolve, 600));

    const result = mockGenerateBlockDetail(input);
    const latencyMs = Date.now() - startTime;

    // AI 로그 기록
    logAI({
      stage: "block_detail",
      mode,
      prompt: JSON.stringify({
        index: input.index,
        preset: input.preset,
        sentenceRange: input.sentenceRange,
      }),
      response: JSON.stringify({
        source: result.source,
        beatLength: result.beat.length,
      }),
      model: mode === "mock" ? "mock-block-detail-v1" : undefined,
      latencyMs,
      ok: true,
      meta: {
        index: input.index,
        preset: input.preset,
      },
    }).catch((err) => {
      console.warn("[generateBlockDetail] Failed to log AI call:", err);
    });

    return result;
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    logAI({
      stage: "block_detail",
      mode,
      prompt: JSON.stringify({ index: input.index }),
      response: "",
      latencyMs,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }).catch((err) => {
      console.warn("[generateBlockDetail] Failed to log AI error:", err);
    });

    throw error;
  }
}

/**
 * 개요 재생성
 */
export async function regenerateOverview(
  input: RegenerateOverviewInput
): Promise<BlockOverviewVariant> {
  const mode = input.mode || "mock";
  const startTime = Date.now();

  try {
    if (mode === "server") {
      throw new Error("Server mode not implemented yet");
    }

    // Mock 모드
    await new Promise((resolve) => setTimeout(resolve, 500));

    const result = mockRegenerateOverview(input);
    const latencyMs = Date.now() - startTime;

    // AI 로그 기록
    logAI({
      stage: "block_overview_regenerate",
      mode,
      prompt: JSON.stringify({
        index: input.index,
      }),
      response: JSON.stringify({
        hookCount: result.hooks.length,
      }),
      model: mode === "mock" ? "mock-block-overview-v1" : undefined,
      latencyMs,
      ok: true,
      meta: { index: input.index },
    }).catch((err) => {
      console.warn("[regenerateOverview] Failed to log AI call:", err);
    });

    return result;
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    logAI({
      stage: "block_overview_regenerate",
      mode,
      prompt: JSON.stringify({ index: input.index }),
      response: "",
      latencyMs,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }).catch((err) => {
      console.warn("[regenerateOverview] Failed to log AI error:", err);
    });

    throw error;
  }
}

/**
 * 개요 발전시키기
 */
export async function expandOverview(
  input: ExpandOverviewInput
): Promise<BlockOverviewVariant> {
  const mode = input.mode || "mock";
  const startTime = Date.now();

  try {
    if (mode === "server") {
      throw new Error("Server mode not implemented yet");
    }

    // Mock 모드
    await new Promise((resolve) => setTimeout(resolve, 500));

    const result = mockExpandOverview(input);
    const latencyMs = Date.now() - startTime;

    // AI 로그 기록
    logAI({
      stage: "block_overview_expand",
      mode,
      prompt: JSON.stringify({
        index: input.index,
        preset: input.preset,
      }),
      response: JSON.stringify({
        hookCount: result.hooks.length,
      }),
      model: mode === "mock" ? "mock-block-overview-v1" : undefined,
      latencyMs,
      ok: true,
      meta: {
        index: input.index,
        preset: input.preset,
      },
    }).catch((err) => {
      console.warn("[expandOverview] Failed to log AI call:", err);
    });

    return result;
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    logAI({
      stage: "block_overview_expand",
      mode,
      prompt: JSON.stringify({ index: input.index, preset: input.preset }),
      response: "",
      latencyMs,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }).catch((err) => {
      console.warn("[expandOverview] Failed to log AI error:", err);
    });

    throw error;
  }
}
