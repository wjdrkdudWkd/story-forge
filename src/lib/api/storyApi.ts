/**
 * storyApi.ts
 *
 * Story-Forge 도메인별 API 래퍼
 *
 * FastAPI 백엔드의 /api/v1/... 엔드포인트를 호출합니다.
 * 각 함수는 기존 클라이언트 함수(aiClient, actsClient, blocksClient)와
 * 동일한 입/출력 인터페이스를 유지해 호출부(page.tsx)를 건드리지 않습니다.
 *
 * 엔드포인트 목록:
 *   POST /api/v1/story/idea            → generateIdeaFromServer
 *   POST /api/v1/story/acts            → generateActsFromServer
 *   POST /api/v1/story/blocks/overview → generateBlocksOverviewFromServer
 *   POST /api/v1/story/blocks/detail   → generateBlockDetailFromServer
 *   POST /api/v1/story/blocks/regenerate-overview → regenerateOverviewFromServer
 *   POST /api/v1/story/blocks/expand-overview     → expandOverviewFromServer
 *
 *   POST /api/v1/logs/ai-call          → logAICall
 *   POST /api/v1/logs/event            → logEvent
 */

import { apiClient } from "./apiClient";
import type { IdeaFormState, CompactedFormPayload } from "@/types/form";
import type { IdeaResult, IdeaState } from "@/types/idea";
import type { ActsResult } from "@/types/acts";
import type {
  BlocksDraft,
  BlockOverviewVariant,
  BlockDetailVariant,
  BlockIndex,
  BlockSpec,
  BlockOverviewVariant as OverviewVariant,
  ExpandPreset,
  BlocksMemory,
} from "@/types/blocks";
import type { EventRecord } from "@/types/events";

// ─────────────────────────────────────────────────────────────────
// DTOs: 백엔드 요청 / 응답 구조 (FastAPI Pydantic 모델과 1:1 대응)
// ─────────────────────────────────────────────────────────────────

/** POST /api/v1/story/idea - Request */
export interface GenerateIdeaRequest {
  form: IdeaFormState;
  compacted_payload: CompactedFormPayload;
}

/** POST /api/v1/story/acts - Request */
export interface GenerateActsRequest {
  logline: string;
  synopsis: string;
  state: IdeaState;
}

/** POST /api/v1/story/blocks/overview - Request */
export interface GenerateBlocksOverviewRequest {
  logline: string;
  synopsis: string;
  tags: string[];
  state: IdeaState;
  acts?: ActsResult;
}

/** POST /api/v1/story/blocks/detail - Request */
export interface GenerateBlockDetailRequest {
  block_index: BlockIndex;
  spec: BlockSpec;
  overview: OverviewVariant;
  state: IdeaState;
  memory: BlocksMemory;
  preset?: ExpandPreset;
  sentence_range?: { min: number; max: number };
}

/** POST /api/v1/story/blocks/regenerate-overview - Request */
export interface RegenerateOverviewRequest {
  block_index: BlockIndex;
  spec: BlockSpec;
  current_overview: OverviewVariant;
  state: IdeaState;
  memory: BlocksMemory;
}

/** POST /api/v1/story/blocks/expand-overview - Request */
export interface ExpandOverviewRequest {
  block_index: BlockIndex;
  spec: BlockSpec;
  current_overview: OverviewVariant;
  preset: ExpandPreset;
  state: IdeaState;
  memory: BlocksMemory;
}

/** POST /api/v1/logs/ai-call - Request */
export interface LogAICallRequest {
  anon_id: string;
  session_id: string;
  stage: string;
  mode: "mock" | "server";
  model?: string;
  prompt: string;
  response: string;
  prompt_chars?: number;
  response_chars?: number;
  latency_ms?: number;
  ok?: boolean;
  error?: string;
  meta?: Record<string, unknown>;
}

/** POST /api/v1/logs/event - Request */
export type LogEventRequest = EventRecord;

// ─────────────────────────────────────────────────────────────────
// Story Generation API 함수들
// ─────────────────────────────────────────────────────────────────

/**
 * 아이디어 후보 2개 생성
 * POST /api/v1/story/idea
 */
export async function generateIdeaFromServer(
  form: IdeaFormState,
  compactedPayload: CompactedFormPayload
): Promise<IdeaResult> {
  const requestBody: GenerateIdeaRequest = {
    form,
    compacted_payload: compactedPayload,
  };
  return apiClient.post<IdeaResult>("/api/v1/story/idea", requestBody);
}

/**
 * 5막 구조 생성
 * POST /api/v1/story/acts
 */
export async function generateActsFromServer(
  logline: string,
  synopsis: string,
  state: IdeaState
): Promise<ActsResult> {
  const requestBody: GenerateActsRequest = { logline, synopsis, state };
  return apiClient.post<ActsResult>("/api/v1/story/acts", requestBody);
}

/**
 * 24블록 개요 생성
 * POST /api/v1/story/blocks/overview
 */
export async function generateBlocksOverviewFromServer(
  logline: string,
  synopsis: string,
  tags: string[],
  state: IdeaState,
  acts?: ActsResult
): Promise<BlocksDraft> {
  const requestBody: GenerateBlocksOverviewRequest = {
    logline,
    synopsis,
    tags,
    state,
    acts,
  };
  return apiClient.post<BlocksDraft>(
    "/api/v1/story/blocks/overview",
    requestBody
  );
}

/**
 * 블록 상세 생성 (기본 / 확장 공통)
 * POST /api/v1/story/blocks/detail
 */
export async function generateBlockDetailFromServer(
  blockIndex: BlockIndex,
  spec: BlockSpec,
  overview: BlockOverviewVariant,
  state: IdeaState,
  memory: BlocksMemory,
  preset?: ExpandPreset,
  sentenceRange?: { min: number; max: number }
): Promise<BlockDetailVariant> {
  const requestBody: GenerateBlockDetailRequest = {
    block_index: blockIndex,
    spec,
    overview,
    state,
    memory,
    preset,
    sentence_range: sentenceRange,
  };
  return apiClient.post<BlockDetailVariant>(
    "/api/v1/story/blocks/detail",
    requestBody
  );
}

/**
 * 블록 개요 재생성
 * POST /api/v1/story/blocks/regenerate-overview
 */
export async function regenerateOverviewFromServer(
  blockIndex: BlockIndex,
  spec: BlockSpec,
  currentOverview: BlockOverviewVariant,
  state: IdeaState,
  memory: BlocksMemory
): Promise<BlockOverviewVariant> {
  const requestBody: RegenerateOverviewRequest = {
    block_index: blockIndex,
    spec,
    current_overview: currentOverview,
    state,
    memory,
  };
  return apiClient.post<BlockOverviewVariant>(
    "/api/v1/story/blocks/regenerate-overview",
    requestBody
  );
}

/**
 * 블록 개요 확장 (프리셋 적용)
 * POST /api/v1/story/blocks/expand-overview
 */
export async function expandOverviewFromServer(
  blockIndex: BlockIndex,
  spec: BlockSpec,
  currentOverview: BlockOverviewVariant,
  preset: ExpandPreset,
  state: IdeaState,
  memory: BlocksMemory
): Promise<BlockOverviewVariant> {
  const requestBody: ExpandOverviewRequest = {
    block_index: blockIndex,
    spec,
    current_overview: currentOverview,
    preset,
    state,
    memory,
  };
  return apiClient.post<BlockOverviewVariant>(
    "/api/v1/story/blocks/expand-overview",
    requestBody
  );
}

// ─────────────────────────────────────────────────────────────────
// Logging API 함수들
// ─────────────────────────────────────────────────────────────────

/**
 * AI 호출 로그 전송 (best-effort)
 * POST /api/v1/logs/ai-call
 */
export async function logAICall(payload: LogAICallRequest): Promise<void> {
  await apiClient.post<void>("/api/v1/logs/ai-call", payload, {
    withIdentity: false, // 이미 payload에 포함됨
  });
}

/**
 * 분석 이벤트 전송 (best-effort)
 * POST /api/v1/logs/event
 */
export async function logEvent(event: LogEventRequest): Promise<void> {
  await apiClient.post<void>("/api/v1/logs/event", event, {
    withIdentity: false, // 이미 payload에 포함됨
  });
}
