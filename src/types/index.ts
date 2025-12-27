/**
 * types/index.ts
 *
 * 타입 시스템의 중앙 export
 */

// Options 계약
export type { Option, OptionGroup, ToneKey } from "./options";

// Form 상태
export type { IdeaFormState, CompactedFormPayload } from "./form";

// AI 입력/출력 계약
export type {
  IdeaCandidate,
  IdeaState,
  IdeaResult,
  GenerateIdeaInput,
} from "./idea";

// 5막 구조 계약
export type { Act, ActKey, ActsResult, GenerateActsInput } from "./acts";

// 24블록 계약
export type {
  BlockIndex,
  BlockSpec,
  BlockOverviewVariant,
  BlockDetailVariant,
  BlockNode,
  BlocksMemory,
  BlocksDraft,
  ExpandPreset,
  VariantSource,
  GenerateBlocksOverviewInput,
  GenerateBlockDetailInput,
  RegenerateOverviewInput,
  ExpandOverviewInput,
} from "./blocks";

/**
 * 타입 간 관계 요약:
 *
 * 1. 옵션 정의 (options.ts)
 *    OptionGroup → 폼 필드 자동 생성의 기준
 *
 * 2. 폼 상태 (form.ts)
 *    IdeaFormState → 사용자가 채우는 전체 폼
 *    CompactedFormPayload → AI에 전달할 압축 버전
 *
 * 3. AI 계약 (idea.ts)
 *    GenerateIdeaInput → AI 호출 시 입력
 *    IdeaResult → AI 호출 결과
 *    IdeaState → 다음 단계(5막/24블록)로 전달될 상태
 *
 * 4. 5막 구조 (acts.ts)
 *    GenerateActsInput → 5막 생성 입력
 *    ActsResult → 5막 구조 결과
 *
 * 5. 24블록 (blocks.ts)
 *    GenerateBlocksOverviewInput → 24개 블록 개요 생성
 *    BlocksDraft → 24블록 전체 초안
 *    GenerateBlockDetailInput → 개별 블록 상세 생성
 *
 * 데이터 흐름:
 * OptionGroup → IdeaFormState → GenerateIdeaInput → AI → IdeaResult → IdeaState
 *                                                                          ↓
 *                                              GenerateActsInput → AI → ActsResult
 *                                                                          ↓
 *                                       GenerateBlocksOverviewInput → AI → BlocksDraft
 *                                                                          ↓
 *                                        GenerateBlockDetailInput → AI → BlockDetailVariant
 */
