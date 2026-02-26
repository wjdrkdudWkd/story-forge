/**
 * blocks.ts
 *
 * 블록 구조 관련 타입 정의
 *
 * [리팩토링] 동적 밀도(Density) 도입
 * - BlockIndex: 고정 24개 union → number (가변 개수 지원)
 * - BlockSpec: act(1|2|3|4) 고정 → actIndex: number (1-based, 서버 정의)
 * - DensityOption: 밀도 옵션 (fast / standard / detailed 등)
 * - GenerateBlocksOverviewInput: densityId 파라미터 추가
 */

import type { IdeaCandidate, IdeaState } from './idea';
import type { ActsResult } from './acts';

// ─────────────────────────────────────────────
// Density (밀도 옵션)
// ─────────────────────────────────────────────

/**
 * 서버에서 조회해 온 단일 밀도 옵션
 *
 * @property id          - 서버 식별자 (blocks/overview 요청 시 density_id로 전달)
 * @property label       - UI 표시 이름 (예: "빠른 구성", "표준", "세밀한 구성")
 * @property description - 이 밀도를 선택했을 때의 설명
 * @property blockCount  - 예상 생성 블록 수 (UI 힌트용)
 * @property actCount    - 사용할 막(Act) 수
 */
export interface DensityOption {
  id: string;
  label: string;
  description: string;
  blockCount: number;
  actCount: number;
}

/**
 * GET /api/v1/projects/density-options 응답 전체
 */
export interface DensityOptionsResponse {
  options: DensityOption[];
  default_id: string;
}

// ─────────────────────────────────────────────
// Block 기본 구조
// ─────────────────────────────────────────────

/**
 * [리팩토링] BlockIndex: 고정 24개 union 제거 → number
 *
 * 서버가 몇 개의 블록을 반환하든 그대로 수용합니다.
 * (예: fast=15개, standard=24개, detailed=30개)
 */
export type BlockIndex = number;

/**
 * 단일 블록 메타 스펙 (서버 정의)
 *
 * [리팩토링] act: 1|2|3|4 고정 → actIndex: number
 *   - 1-based 인덱스 (1막 = 1, 2막 = 2, ...)
 *   - 밀도에 따라 3막 / 4막 / 5막 구조가 달라질 수 있으므로 number로 확장
 */
export interface BlockSpec {
  /** 블록 순서 (1-based) */
  index: BlockIndex;
  /** 소속 막 번호 (1-based, 서버가 밀도에 따라 결정) */
  actIndex: number;
  /** 블록 제목 */
  title: string;
  /** 이 블록의 서사적 역할 */
  purpose: string;
  /** 반드시 포함해야 할 요소 */
  required?: string;
  /** 다음 블록으로 넘겨줘야 할 것 */
  deliver?: string;
  /**
   * 캔버스에서 표시될 행(row) 순서를 결정하는 정렬 키.
   *
   * 서버 생성 블록: index와 동일한 정수 (예: 1, 2, 3...)
   * AI 블록 생성으로 삽입된 블록: afterBlockIndex + 0.5 형식의 소수 (예: 1.5)
   *   → sortedSpecs 정렬 시 1블록과 2블록 사이에 배치됨
   *
   * undefined면 index를 fallback으로 사용.
   */
  rowIndex?: number;
}

// ─────────────────────────────────────────────
// Variant 구조
// ─────────────────────────────────────────────

export type VariantSource = 'initial' | 'regenerate' | 'expand';

export interface BlockOverviewVariant {
  id: string;
  createdAt: number;
  source: VariantSource;
  headline: string;
  hooks: string[];
  stakes?: string;
  tags?: string[];
  note?: string;
}

export type ExpandPreset =
  | 'more_specific'
  | 'raise_stakes'
  | 'add_emotion'
  | 'add_twist'
  | 'add_dialogue';

export interface BlockDetailVariant {
  id: string;
  createdAt: number;
  source: VariantSource;
  beat: string;
  microHooks?: string[];
  preset?: ExpandPreset;
}

// ─────────────────────────────────────────────
// BlockNode: 단일 블록의 전체 상태
// ─────────────────────────────────────────────

export interface BlockNode {
  /** 블록 순서 인덱스 (BlockSpec.index와 동일) */
  index: BlockIndex;
  overviewVariants: BlockOverviewVariant[];
  selectedOverviewId: string;
  detailVariants: BlockDetailVariant[];
  selectedDetailId?: string;
  /**
   * variant별 물리적 열(column) 인덱스 매핑
   *
   * 키: variantId
   * 값: 물리 열 인덱스 (0 = trunk, 1 = 첫 번째 브랜치 열 x=BRANCH_GAP_X, ...)
   *
   * 없으면 overviewVariants 배열 순서 기준으로 자동 배치.
   * AI 블록 생성으로 만들어진 블록의 variants[0]에 사용하여
   * trunk(x=0)가 아닌 특정 브랜치 열에 배치할 수 있음.
   */
  variantColumnMap?: Record<string, number>;
}

// ─────────────────────────────────────────────
// 블록 간 공유 컨텍스트 메모리
// ─────────────────────────────────────────────

export interface BlocksMemory {
  protagonistGoal?: string;
  centralConflict?: string;
  bStory?: string;
  progressFlags: string[];
  lastHooks?: string[];
}

// ─────────────────────────────────────────────
// 노드 위치 저장 (드래그 앤 드롭 퍼시스턴스)
// ─────────────────────────────────────────────

/**
 * 사용자가 드래그로 변경한 노드 위치를 저장합니다.
 * 키: React Flow 노드 ID (예: "block-3-main", "block-3-branch-uuid")
 */
export type NodePositions = Record<string, { x: number; y: number }>;

// ─────────────────────────────────────────────
// 동적 경로 선택 (Path Selection)
// ─────────────────────────────────────────────

/**
 * 캔버스 내 단일 에지(연결선)를 표현합니다.
 *
 * React Flow의 Edge와 1:1 대응하지만,
 * BlocksDraft에 직렬화하여 새로고침 후에도 복원됩니다.
 *
 * @property id         - 유일 식별자 (예: "route-block-7-main-to-block-8-main")
 * @property sourceNodeId - React Flow 소스 노드 ID
 * @property targetNodeId - React Flow 타겟 노드 ID
 * @property isActive   - true = 확정 경로(파란 실선), false = 대안/비활성 경로(회색 점선)
 * @property label      - 에지 레이블 (예: "확정 경로", "대안 경로", "#7-A")
 * @property isManual   - 사용자가 직접 연결한 경우 true (자동 재계산 제외)
 */
export interface PathEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  isActive: boolean;
  label?: string;
  isManual?: boolean;
  /**
   * React Flow 소스 핸들 ID
   * "bottom" (기본) | "right" (브랜치 → 다음 블록 ↵ 연결)
   */
  sourceHandle?: string;
  /**
   * React Flow 타겟 핸들 ID
   * "top" (기본, 수직 흐름) | "right" (↵ 형태로 브랜치에서 수신)
   */
  targetHandle?: string;
}

/**
 * blockRoutes: 블록 N의 "다음 연결" 정보
 *
 * 키: React Flow 소스 노드 ID (예: "block-7-main", "block-7-branch-A")
 * 값: 해당 소스에서 뻗어나가는 PathEdge 배열
 *
 * 설계 원칙:
 *  - 한 소스에서 복수의 타겟으로 연결 가능 (확정 1 + 대안 N)
 *  - isActive=true 인 에지가 "확정 경로"
 *  - isActive=false 인 에지가 "대안 경로"
 *  - 새 variant 채택 시: 기존 확정 경로 → isActive=false, 새 경로 → isActive=true
 */
export type BlockRoutes = Record<string, PathEdge[]>;

// ─────────────────────────────────────────────
// BlocksDraft: 전체 드래프트 (가변 블록 수 지원)
// ─────────────────────────────────────────────

/**
 * [리팩토링]
 * - specs: 서버가 반환한 블록 스펙 배열 (개수 가변)
 * - blocksByIndex: number 키 (고정 24개 가정 제거)
 * - densityId: 선택된 밀도 옵션 ID (추적용)
 * - totalActs: 이 드래프트의 총 막 수 (UI 그룹핑에 사용)
 * - nodePositions: 드래그 앤 드롭으로 변경된 노드 위치 (퍼시스턴스)
 */
export interface BlocksDraft {
  /** 선택된 밀도 ID */
  densityId: string;
  /** 서버 정의 블록 스펙 배열 */
  specs: BlockSpec[];
  /** 인덱스 → 블록 노드 맵 */
  blocksByIndex: Record<BlockIndex, BlockNode>;
  /** 총 막 수 (UI 그룹핑: actIndex 기준 분리) */
  totalActs: number;
  /** 공유 컨텍스트 메모리 */
  memory: BlocksMemory;
  /**
   * 드래그로 변경된 노드 위치 맵
   * 키: React Flow 노드 ID
   * 없으면 기본 레이아웃 좌표를 사용
   */
  nodePositions?: NodePositions;
  /**
   * 행(rowIndex)별로 선택된 variantId를 저장하는 맵.
   * key: rowIndex (number), value: variantId (string)
   * 이 맵에 따라 확정 경로가 결정되고 시각적으로 표현됩니다.
   */
  selectedVariantIdByRow?: Record<number, string>;
}

// ─────────────────────────────────────────────
// 생성 입력 타입들
// ─────────────────────────────────────────────

/**
 * [리팩토링] densityId 필드 추가
 */
export interface GenerateBlocksOverviewInput {
  candidate: IdeaCandidate;
  state: IdeaState;
  acts?: ActsResult;
  /** 사용자가 선택한 밀도 옵션 ID */
  densityId: string;
  mode?: 'mock' | 'server';
}

export interface GenerateBlockDetailInput {
  index: BlockIndex;
  spec: BlockSpec;
  overview: BlockOverviewVariant;
  state: IdeaState;
  memory: BlocksMemory;
  preset?: ExpandPreset;
  sentenceRange?: { min: number; max: number };
  mode?: 'mock' | 'server';
}

export interface RegenerateOverviewInput {
  index: BlockIndex;
  spec: BlockSpec;
  currentOverview: BlockOverviewVariant;
  state: IdeaState;
  memory: BlocksMemory;
  mode?: 'mock' | 'server';
}

export interface ExpandOverviewInput {
  index: BlockIndex;
  spec: BlockSpec;
  currentOverview: BlockOverviewVariant;
  preset: ExpandPreset;
  state: IdeaState;
  memory: BlocksMemory;
  mode?: 'mock' | 'server';
}
