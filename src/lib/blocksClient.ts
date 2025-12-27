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
import {
  buildBlocksOverviewPrompt,
  buildBlockDetailPrompt,
  buildBlocksRegenerateOverviewPrompt,
  buildBlocksExpandOverviewPrompt,
  BLOCKS_OVERVIEW_PROMPT_VERSION,
  BLOCK_DETAIL_PROMPT_VERSION,
  BLOCKS_REGEN_OVERVIEW_PROMPT_VERSION,
  BLOCKS_EXPAND_OVERVIEW_PROMPT_VERSION,
} from "./prompts";

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

    // 프롬프트 빌드
    const prompt = buildBlocksOverviewPrompt(input);

    // AI 로그 기록
    logAI({
      stage: "blocks_overview",
      mode,
      prompt,
      response: JSON.stringify({
        blockCount: Object.keys(result.blocksByIndex).length,
      }),
      model: mode === "mock" ? "mock-blocks-overview-v1" : undefined,
      latencyMs,
      ok: true,
      meta: {
        promptVersion: BLOCKS_OVERVIEW_PROMPT_VERSION,
        inputPayload: {
          logline: input.candidate.logline,
          synopsis: input.candidate.synopsis,
          tone: input.state.tone,
          seed: input.state.seed,
          actKeys: input.acts?.acts.map((act) => act.key),
        },
      },
    }).catch((err) => {
      console.warn("[generateBlocksOverview] Failed to log AI call:", err);
    });

    return result;
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    // 프롬프트 빌드 (오류 로깅용)
    const prompt = buildBlocksOverviewPrompt(input);

    logAI({
      stage: "blocks_overview",
      mode,
      prompt,
      response: "",
      latencyMs,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      meta: {
        promptVersion: BLOCKS_OVERVIEW_PROMPT_VERSION,
        inputPayload: {
          logline: input.candidate.logline,
        },
      },
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

    // 프롬프트 빌드
    const prompt = buildBlockDetailPrompt(input);

    // AI 로그 기록
    logAI({
      stage: "block_detail",
      mode,
      prompt,
      response: JSON.stringify({
        source: result.source,
        beatLength: result.beat.length,
      }),
      model: mode === "mock" ? "mock-block-detail-v1" : undefined,
      latencyMs,
      ok: true,
      meta: {
        promptVersion: BLOCK_DETAIL_PROMPT_VERSION,
        inputPayload: {
          blockIndex: input.index,
          preset: input.preset,
          sentenceRange: input.sentenceRange,
          tone: input.state.tone,
        },
      },
    }).catch((err) => {
      console.warn("[generateBlockDetail] Failed to log AI call:", err);
    });

    return result;
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    // 프롬프트 빌드 (오류 로깅용)
    const prompt = buildBlockDetailPrompt(input);

    logAI({
      stage: "block_detail",
      mode,
      prompt,
      response: "",
      latencyMs,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      meta: {
        promptVersion: BLOCK_DETAIL_PROMPT_VERSION,
        inputPayload: {
          blockIndex: input.index,
        },
      },
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

    // 프롬프트 빌드
    const prompt = buildBlocksRegenerateOverviewPrompt(input);

    // AI 로그 기록
    logAI({
      stage: "block_overview_regenerate",
      mode,
      prompt,
      response: JSON.stringify({
        hookCount: result.hooks.length,
        headline: result.headline,
      }),
      model: mode === "mock" ? "mock-block-overview-v1" : undefined,
      latencyMs,
      ok: true,
      meta: {
        promptVersion: BLOCKS_REGEN_OVERVIEW_PROMPT_VERSION,
        inputPayload: {
          blockIndex: input.index,
          tone: input.state.tone,
          seed: input.state.seed,
        },
        usage: undefined,
      },
    }).catch((err) => {
      console.warn("[regenerateOverview] Failed to log AI call:", err);
    });

    return result;
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    const prompt = buildBlocksRegenerateOverviewPrompt(input);

    logAI({
      stage: "block_overview_regenerate",
      mode,
      prompt,
      response: "",
      latencyMs,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      meta: {
        promptVersion: BLOCKS_REGEN_OVERVIEW_PROMPT_VERSION,
        inputPayload: {
          blockIndex: input.index,
        },
        usage: undefined,
      },
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

    // 프롬프트 빌드
    const prompt = buildBlocksExpandOverviewPrompt(input);

    // AI 로그 기록
    logAI({
      stage: "block_overview_expand",
      mode,
      prompt,
      response: JSON.stringify({
        hookCount: result.hooks.length,
        headline: result.headline,
      }),
      model: mode === "mock" ? "mock-block-overview-v1" : undefined,
      latencyMs,
      ok: true,
      meta: {
        promptVersion: BLOCKS_EXPAND_OVERVIEW_PROMPT_VERSION,
        inputPayload: {
          blockIndex: input.index,
          preset: input.preset,
          tone: input.state.tone,
          seed: input.state.seed,
        },
        usage: undefined,
      },
    }).catch((err) => {
      console.warn("[expandOverview] Failed to log AI call:", err);
    });

    return result;
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    const prompt = buildBlocksExpandOverviewPrompt(input);

    logAI({
      stage: "block_overview_expand",
      mode,
      prompt,
      response: "",
      latencyMs,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      meta: {
        promptVersion: BLOCKS_EXPAND_OVERVIEW_PROMPT_VERSION,
        inputPayload: {
          blockIndex: input.index,
          preset: input.preset,
        },
        usage: undefined,
      },
    }).catch((err) => {
      console.warn("[expandOverview] Failed to log AI error:", err);
    });

    throw error;
  }
}
