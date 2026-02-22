/**
 * blocksClient.ts
 *
 * 24블록 생성 클라이언트
 *
 * [리팩토링]
 * - mock 모드: 기존 mock 함수들 유지 (백엔드 개발 전 테스트용)
 * - server 모드: FastAPI 백엔드 호출
 *   - generateBlocksOverview  → POST /api/v1/story/blocks/overview
 *   - generateBlockDetail     → POST /api/v1/story/blocks/detail
 *   - regenerateOverview      → POST /api/v1/story/blocks/regenerate-overview
 *   - expandOverview          → POST /api/v1/story/blocks/expand-overview
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
import {
  generateBlocksOverviewFromServer,
  generateBlockDetailFromServer,
  regenerateOverviewFromServer,
  expandOverviewFromServer,
} from "./api/storyApi";
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

// ─────────────────────────────────────────────────────────────────
// 24블록 개요 생성
// ─────────────────────────────────────────────────────────────────

export async function generateBlocksOverview(
  input: GenerateBlocksOverviewInput
): Promise<BlocksDraft> {
  const mode = input.mode || "mock";
  const startTime = Date.now();

  try {
    let result: BlocksDraft;

    if (mode === "server") {
      result = await generateBlocksOverviewFromServer(
        input.candidate.logline,
        input.candidate.synopsis,
        input.candidate.tags,
        input.state,
        input.acts
      );
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      result = mockGenerateBlocksOverview(input);
    }

    const latencyMs = Date.now() - startTime;
    const prompt = buildBlocksOverviewPrompt(input);

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
        inputPayload: { logline: input.candidate.logline },
      },
    }).catch((err) => {
      console.warn("[generateBlocksOverview] Failed to log AI error:", err);
    });

    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────
// 블록 상세 생성 (기본 / 확장 공통)
// ─────────────────────────────────────────────────────────────────

export async function generateBlockDetail(
  input: GenerateBlockDetailInput
): Promise<BlockDetailVariant> {
  const mode = input.mode || "mock";
  const startTime = Date.now();

  try {
    let result: BlockDetailVariant;

    if (mode === "server") {
      result = await generateBlockDetailFromServer(
        input.index,
        input.spec,
        input.overview,
        input.state,
        input.memory,
        input.preset,
        input.sentenceRange
      );
    } else {
      await new Promise((resolve) => setTimeout(resolve, 600));
      result = mockGenerateBlockDetail(input);
    }

    const latencyMs = Date.now() - startTime;
    const prompt = buildBlockDetailPrompt(input);

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
        inputPayload: { blockIndex: input.index },
      },
    }).catch((err) => {
      console.warn("[generateBlockDetail] Failed to log AI error:", err);
    });

    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────
// 블록 개요 재생성
// ─────────────────────────────────────────────────────────────────

export async function regenerateOverview(
  input: RegenerateOverviewInput
): Promise<BlockOverviewVariant> {
  const mode = input.mode || "mock";
  const startTime = Date.now();

  try {
    let result: BlockOverviewVariant;

    if (mode === "server") {
      result = await regenerateOverviewFromServer(
        input.index,
        input.spec,
        input.currentOverview,
        input.state,
        input.memory
      );
    } else {
      await new Promise((resolve) => setTimeout(resolve, 500));
      result = mockRegenerateOverview(input);
    }

    const latencyMs = Date.now() - startTime;
    const prompt = buildBlocksRegenerateOverviewPrompt(input);

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
        inputPayload: { blockIndex: input.index },
        usage: undefined,
      },
    }).catch((err) => {
      console.warn("[regenerateOverview] Failed to log AI error:", err);
    });

    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────
// 블록 개요 확장 (프리셋 적용)
// ─────────────────────────────────────────────────────────────────

export async function expandOverview(
  input: ExpandOverviewInput
): Promise<BlockOverviewVariant> {
  const mode = input.mode || "mock";
  const startTime = Date.now();

  try {
    let result: BlockOverviewVariant;

    if (mode === "server") {
      result = await expandOverviewFromServer(
        input.index,
        input.spec,
        input.currentOverview,
        input.preset,
        input.state,
        input.memory
      );
    } else {
      await new Promise((resolve) => setTimeout(resolve, 500));
      result = mockExpandOverview(input);
    }

    const latencyMs = Date.now() - startTime;
    const prompt = buildBlocksExpandOverviewPrompt(input);

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
        inputPayload: { blockIndex: input.index, preset: input.preset },
        usage: undefined,
      },
    }).catch((err) => {
      console.warn("[expandOverview] Failed to log AI error:", err);
    });

    throw error;
  }
}
