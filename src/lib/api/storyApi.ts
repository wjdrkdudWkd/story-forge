/**
 * storyApi.ts
 *
 * Story-Forge 도메인별 API 래퍼
 *
 * FastAPI 백엔드의 /api/v1/... 엔드포인트를 호출합니다.
 *
 * 엔드포인트 목록:
 *   GET  /api/v1/projects/density-options   → getDensityOptions
 *   POST /api/v1/story/idea                 → generateIdeaFromServer
 *   POST /api/v1/story/acts                 → generateActsFromServer
 *   POST /api/v1/story/blocks/overview      → generateBlocksOverviewFromServer
 *   POST /api/v1/story/blocks/detail        → generateBlockDetailFromServer
 *   POST /api/v1/story/blocks/regenerate-overview → regenerateOverviewFromServer
 *   POST /api/v1/story/blocks/expand-overview     → expandOverviewFromServer
 *
 *   POST /api/v1/logs/ai-call              → logAICall
 *   POST /api/v1/logs/event               → logEvent
 */

import { apiClient } from "./apiClient";
import type { IdeaFormState, CompactedFormPayload } from "@/types/form";
import type { IdeaResult, IdeaState } from "@/types/idea";
import type { ActsResult } from "@/types/acts";
import type {
  DensityOption,
  DensityOptionsResponse,
  BlocksDraft,
  BlockOverviewVariant,
  BlockDetailVariant,
  BlockIndex,
  BlockSpec,
  ExpandPreset,
  BlocksMemory,
} from "@/types/blocks";
import type { EventRecord } from "@/types/events";

// ─────────────────────────────────────────────────────────────────
// DTOs
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
  /** 선택된 밀도로부터 결정된 목표 막 수 (3 | 4 | 5) */
  act_count: number;
}

/**
 * POST /api/v1/story/blocks/overview - Request
 * [리팩토링] density_id 파라미터 추가
 */
export interface GenerateBlocksOverviewRequest {
  logline: string;
  synopsis: string;
  tags: string[];
  state: IdeaState;
  /** 사용자가 선택한 밀도 옵션 ID */
  density_id: string;
  acts?: ActsResult;
}

/** POST /api/v1/story/blocks/detail - Request */
export interface GenerateBlockDetailRequest {
  block_index: BlockIndex;
  spec: BlockSpec;
  overview: BlockOverviewVariant;
  state: IdeaState;
  memory: BlocksMemory;
  preset?: ExpandPreset;
  sentence_range?: { min: number; max: number };
}

/** POST /api/v1/story/blocks/regenerate-overview - Request */
export interface RegenerateOverviewRequest {
  block_index: BlockIndex;
  spec: BlockSpec;
  current_overview: BlockOverviewVariant;
  state: IdeaState;
  memory: BlocksMemory;
  /**
   * 브랜치 재생성 시 부모 노드 ID 컨텍스트
   * 형식: "#N-A" (예: "#7-A") — 대안 시나리오 트래킹용
   * 일반 재생성 시 생략
   */
  branch_id?: string;
}

/** POST /api/v1/story/blocks/expand-overview - Request */
export interface ExpandOverviewRequest {
  block_index: BlockIndex;
  spec: BlockSpec;
  current_overview: BlockOverviewVariant;
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
// Density Options API
// ─────────────────────────────────────────────────────────────────

/**
 * 밀도 옵션 목록 조회
 * GET /api/v1/projects/density-options
 *
 * 5막 완료 후 블록 단계 진입 전에 호출합니다.
 * 응답: { options: DensityOption[], default_id: string }
 */
export async function getDensityOptions(): Promise<DensityOptionsResponse> {
  return apiClient.get<DensityOptionsResponse>(
    "/api/v1/projects/density-options"
  );
}

// ─────────────────────────────────────────────────────────────────
// Story Generation API
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
 * 막 구조 생성 (actCount 기반 가변)
 * POST /api/v1/story/acts
 *
 * [리팩토링] act_count 파라미터 추가 — 서버가 actCount에 따라 3/4/5막 구조 생성
 */
export async function generateActsFromServer(
  logline: string,
  synopsis: string,
  state: IdeaState,
  actCount: number = 5
): Promise<ActsResult> {
  const requestBody: GenerateActsRequest = { logline, synopsis, state, act_count: actCount };
  return apiClient.post<ActsResult>("/api/v1/story/acts", requestBody);
}

/**
 * 블록 개요 생성 (가변 밀도)
 * POST /api/v1/story/blocks/overview
 *
 * [리팩토링] density_id 포함
 */
export async function generateBlocksOverviewFromServer(
  logline: string,
  synopsis: string,
  tags: string[],
  state: IdeaState,
  densityId: string,
  acts?: ActsResult
): Promise<BlocksDraft> {
  const requestBody: GenerateBlocksOverviewRequest = {
    logline,
    synopsis,
    tags,
    state,
    density_id: densityId,
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
 * 블록 개요 재생성 (일반)
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
 * 브랜치 노드 재생성 (AI 가지치기)
 * POST /api/v1/story/blocks/regenerate-overview
 *
 * 기존 재생성과 동일한 엔드포인트를 사용하지만
 * branch_id 컨텍스트를 추가로 전달합니다.
 *
 * 브랜치 ID 체계: "#N-A" ~ "#N-Z", "#N-AA" ...
 *   N: 블록 인덱스 (1-based)
 *   suffix: A=첫 번째 브랜치, B=두 번째 브랜치 ...
 *
 * @param branchId  "#7-A" 형식의 브랜치 ID
 */
export async function branchRegenerateOverviewFromServer(
  blockIndex: BlockIndex,
  spec: BlockSpec,
  currentOverview: BlockOverviewVariant,
  state: IdeaState,
  memory: BlocksMemory,
  branchId: string
): Promise<BlockOverviewVariant> {
  const requestBody: RegenerateOverviewRequest = {
    block_index: blockIndex,
    spec,
    current_overview: currentOverview,
    state,
    memory,
    branch_id: branchId,
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
// Logging API
// ─────────────────────────────────────────────────────────────────

/**
 * AI 호출 로그 전송 (best-effort)
 * POST /api/v1/logs/ai-call
 */
export async function logAICall(payload: LogAICallRequest): Promise<void> {
  await apiClient.post<void>("/api/v1/logs/ai-call", payload, {
    withIdentity: false,
  });
}

/**
 * 분석 이벤트 전송 (best-effort)
 * POST /api/v1/logs/event
 */
export async function logEvent(event: LogEventRequest): Promise<void> {
  await apiClient.post<void>("/api/v1/logs/event", event, {
    withIdentity: false,
  });
}
