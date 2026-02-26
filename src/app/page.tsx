'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/authContext';
import { AuthPanel } from '@/components/AuthPanel';
import { ApiError, NetworkError } from '@/lib/api/apiClient';
import { InputPanel } from '@/components/InputPanel';
import { OutputPanel } from '@/components/OutputPanel';
import { ActsPanel } from '@/components/ActsPanel';
import { BlocksPanel } from '@/components/BlocksPanel';
import { SelectionPanel } from '@/components/SelectionPanel'; // 추가
import { CharacterPanel } from '@/components/CharacterPanel'; // 추가
import type { IdeaFormState } from '@/types/form';
import type {
  IdeaResult,
  GenerateIdeaInput,
  IdeaCandidate, // 추가 (이미 있었지만 혹시 몰라 다시)
} from '@/types/idea';
import type { ActsResult, GenerateActsInput } from '@/types/acts';
import type {
  BlocksDraft,
  GenerateBlocksOverviewInput,
  BlockIndex,
  ExpandPreset,
  DensityOption, // 추가
  BlockSpec, // 추가
  BlockNode, // 추가
  BlockOverviewVariant, // 추가
} from '@/types/blocks';
import type { CharacterState, CharacterSuggestion } from '@/types/character'; // 추가
import { getCharacterSuggestions } from '@/lib/characterClient'; // 추가
import { generateIdea, compactFormPayload } from '@/lib/aiClient';
import { generateActs } from '@/lib/actsClient';
import {
  generateBlocksOverview,
  generateBlockDetail,
  regenerateOverview,
  expandOverview,
} from '@/lib/blocksClient';
import { generateSeed } from '@/lib/random';
import { DEFAULT_DETAIL_POLICY } from '@/config/policy';
import { track } from '@/lib/track';
import { AnalyticsDebugPanel } from '@/components/AnalyticsDebugPanel';

// ─────────────────────────────────────────────
// AI 모드 설정
// 백엔드 연동 전: 'mock'
// 백엔드 연동 후: 'server'
// ─────────────────────────────────────────────
const AI_MODE: 'mock' | 'server' = 'server';

// ─────────────────────────────────────────────
// 창작 흐름 (리팩토링) (복구)
// input → loading → output
//   → confirmed (잠깐)
//     → selection         ← 구조/밀도 선택 단계 (아이디어 확정 직후)
//       → acts_loading
//         → acts
//           → blocks_loading
//             → blocks
// ─────────────────────────────────────────────
type ViewState =
  | 'input'
  | 'loading'
  | 'output'
  | 'confirmed'
  | 'character_loading' // 캐릭터 제안 로딩 (아이디어 확정 직후) (복구)
  | 'character_setting' // 캐릭터 페르소나 설정 (복구)
  | 'selection' // 구조/밀도 선택 (복구)
  | 'acts_loading'
  | 'acts'
  | 'blocks_loading'
  | 'blocks';

// ─────────────────────────────────────────────
// 밀도 프리셋 (서버 없이 사용; server 모드 시 API로 교체) (복구)
// ─────────────────────────────────────────────
const MOCK_DENSITY_OPTIONS: DensityOption[] = [
  {
    id: 'compact',
    label: '간략',
    description: '핵심 장면만 구성합니다. 숏폼·단편에 적합합니다.',
    blockCount: 15,
    actCount: 3,
  },
  {
    id: 'standard',
    label: '표준',
    description: '균형 잡힌 기본 구성입니다. 일반 시나리오 호흡에 적합합니다.',
    blockCount: 24,
    actCount: 4,
  },
  {
    id: 'detailed',
    label: '상세',
    description: '세밀하게 장면을 분할합니다. 장편·정교한 플롯에 적합합니다.',
    blockCount: 30,
    actCount: 5,
  },
];

// ─────────────────────────────────────────────
// 브랜치 suffix → 0-based 인덱스 변환 헬퍼 (복구)
// BlocksCanvas의 getBranchSuffix()의 역방향 함수
// 예: "A" → 0, "B" → 1, "AA" → 26
// ─────────────────────────────────────────────
function suffixToIndex(suffix: string): number {
  const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (suffix.length === 1) return L.indexOf(suffix);
  return (L.indexOf(suffix[0]) + 1) * 26 + L.indexOf(suffix[1]);
}

// ─────────────────────────────────────────────
// 특정 블록 노드에서 variant의 물리 열 반환 (복구)
// variantColumnMap 없으면 배열 인덱스(0=main, 1=branchA …)를 열로 사용
// ─────────────────────────────────────────────
function getVariantCol(bn: BlockNode, variantId: string): number {
  if (bn.variantColumnMap?.[variantId] !== undefined) {
    return bn.variantColumnMap[variantId];
  }
  const idx = bn.overviewVariants.findIndex((v) => v.id === variantId);
  return idx < 0 ? 0 : idx;
}

// ─────────────────────────────────────────────
// 전역 열 삽입 (Excel "열 삽입"과 동일) (복구)
//
// fromCol 열에 새 노드가 들어온다 → 현재 캔버스 전체에서
// col >= fromCol 인 모든 variant 를 +1 로 밀어냄.
//
// • 행(row) 구분 없음 — 전체 캔버스 적용
// • variantColumnMap 이 없는 블록도 배열 인덱스 기반으로 초기화 후 처리
// ─────────────────────────────────────────────
function shiftColumnsGlobally(
  blocksByIndex: Record<BlockIndex, BlockNode>,
  fromCol: number
): Record<BlockIndex, BlockNode> {
  const result: Record<BlockIndex, BlockNode> = {};
  for (const [biStr, bn] of Object.entries(blocksByIndex)) {
    const bi = Number(biStr);
    const newVcm: Record<string, number> = {};
    for (const [vi, v] of bn.overviewVariants.entries()) {
      const col = bn.variantColumnMap?.[v.id] ?? vi; // vcm 없으면 배열 인덱스
      newVcm[v.id] = col >= fromCol ? col + 1 : col;
    }
    result[bi] = { ...bn, variantColumnMap: newVcm };
  }
  return result;
}

export default function Home() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [viewState, setViewState] = useState<ViewState>('input');
  const [result, setResult] = useState<IdeaResult | null>(null);
  const [confirmedIndex, setConfirmedIndex] = useState<number | null>(null);
  const [actsResult, setActsResult] = useState<ActsResult | null>(null);
  const [blocksDraft, setBlocksDraft] = useState<BlocksDraft | null>(null);
  const [characterSuggestions, setCharacterSuggestions] = useState<
    CharacterSuggestion[]
  >([]); // 복구
  const [characterState, setCharacterState] = useState<CharacterState | null>(
    null
  ); // 복구

  // ── 선택된 구조/밀도 전역 상태 ───────────────────────────── (복구)
  const [selectedDensityId, setSelectedDensityId] =
    useState<string>('standard');
  const [selectedActCount, setSelectedActCount] = useState<number>(4);
  // ── 행(rowIndex)별 선택된 variantId (핵심 목표) ───────────────── (복구)
  const [selectedVariantIdByRow, setSelectedVariantIdByRow] = useState<
    Record<number, string>
  >({});

  // 정책 및 세션 카운터
  const policy = DEFAULT_DETAIL_POLICY;
  const [detailGenCount, setDetailGenCount] = useState(0);
  const [lastActionAtByIndex, setLastActionAtByIndex] = useState<
    Record<number, number>
  >({});

  // ─────────────────────────────────────────────
  // 아이디어 생성
  // ─────────────────────────────────────────────
  const handleGenerate = async (form: IdeaFormState) => {
    setViewState('loading');

    const formWithSeed: IdeaFormState = {
      ...form,
      seed: form.seed ?? generateSeed(),
    };

    const selectedOptionsCount = [
      form.world_setting,
      form.world_era,
      form.world_scale,
      form.character_protagonist,
      form.character_count,
      form.character_relationship,
      form.plot_structure,
      form.plot_conflict,
      form.plot_ending,
      ...(form.motifs_ranked || []),
    ].filter(Boolean).length;
    track({
      name: 'idea_generate_clicked',
      meta: {
        tone: form.tone,
        realism: form.realism,
        selectedOptionsCount,
        seed: formWithSeed.seed,
      },
    });

    const input: GenerateIdeaInput = {
      form: formWithSeed,
      compactedPayload: compactFormPayload(formWithSeed),
      mode: AI_MODE, // AI_MODE 사용 (복구)
    };
    try {
      const ideaResult = await generateIdea(input);
      setResult(ideaResult);
      setViewState('output');
      track({
        name: 'idea_generated',
        meta: {
          candidates: ideaResult.candidates.length,
          tagsCount: ideaResult.candidates[0]?.tags?.length || 0,
        },
      });
    } catch (error) {
      console.error('아이디어 생성 실패:', error);
      let msg = '아이디어 생성 중 오류가 발생했습니다.';
      if (error instanceof ApiError) msg = `서버 오류 (${error.status}): ${error.message}`;
      else if (error instanceof NetworkError) msg = `네트워크 오류: ${error.message}`;
      alert(msg);
      setViewState('input');
    }
  };

  // ─────────────────────────────────────────────
  // 후보 확정 → character_setting 단계로 이동 (복구)
  // ─────────────────────────────────────────────
  const handleConfirm = async (candidateIndex: number) => {
    if (!result) return;

    track({
      name: 'idea_candidate_selected',
      meta: { candidateIndex },
    });

    setConfirmedIndex(candidateIndex);
    setViewState('character_loading');

    try {
      const logline = result.candidates[candidateIndex]?.logline ?? '';
      const { suggestions } = await getCharacterSuggestions({
        logline,
        mode: AI_MODE,
      });
      setCharacterSuggestions(suggestions);
      setViewState('character_setting');
    } catch (error) {
      console.error('캐릭터 제안 로딩 실패:', error);
      // 실패 시 character_setting으로 빈 제안 없이 진입 (사용자가 직접 입력 가능)
      setCharacterSuggestions([]);
      setViewState('character_setting');
    }
  };

  // ─────────────────────────────────────────────
  // 처음부터 다시 (복구: 상태 초기화 추가)
  // ─────────────────────────────────────────────
  const handleBack = () => {
    setViewState('input');
    setResult(null);
    setConfirmedIndex(null);
    setActsResult(null);
    setBlocksDraft(null);
    setSelectedDensityId('standard');
    setSelectedActCount(4);
    setCharacterSuggestions([]);
    setCharacterState(null);
    setSelectedVariantIdByRow({}); // 추가
  };

  // ─────────────────────────────────────────────
  // character_setting → output (뒤로가기) (복구)
  // ─────────────────────────────────────────────
  const handleBackFromCharacter = () => {
    setViewState('output');
  };

  // ─────────────────────────────────────────────
  // character_setting 완료 → selection 단계 (복구)
  // ─────────────────────────────────────────────
  const handleCharacterConfirm = (state: CharacterState) => {
    setCharacterState(state);
    setViewState('selection');
  };

  // ─────────────────────────────────────────────
  // selection → character_setting (뒤로가기) (복구)
  // ─────────────────────────────────────────────
  const handleBackFromSelection = () => {
    setViewState('character_setting');
  };

  // ─────────────────────────────────────────────
  // 구조/밀도 선택 확정 → 막 구조 생성 시작 (복구)
  // ─────────────────────────────────────────────
  const handleSelectionConfirm = async (
    densityId: string,
    actCount: number
  ) => {
    if (!result || confirmedIndex === null) return;

    setSelectedDensityId(densityId);
    setSelectedActCount(actCount);

    track({ name: 'density_selected', meta: { densityId, actCount } });

    await handleGenerateActs(densityId, actCount);
  };

  // ─────────────────────────────────────────────
  // 막 구조 생성 (복구: densityId, actCount 파라미터 추가)
  // ─────────────────────────────────────────────
  const handleGenerateActs = async (
    densityId?: string,
    actCount?: number
  ) => {
    if (!result || confirmedIndex === null) return;

    const resolvedActCount = actCount ?? selectedActCount;

    track({
      name: 'acts_generate_clicked',
      meta: { actCount: resolvedActCount },
    });
    setViewState('acts_loading');

    const selectedCandidate = result.candidates[confirmedIndex];
    const input: GenerateActsInput = {
      logline: selectedCandidate.logline,
      synopsis: selectedCandidate.synopsis,
      state: result.state,
      actCount: resolvedActCount, // actCount 추가
    };

    try {
      const acts = await generateActs(input, AI_MODE); // AI_MODE 사용
      setActsResult(acts);
      setViewState('acts');

      track({
        name: 'acts_generated',
        meta: { actCount: acts.acts.length },
      });
    } catch (error) {
      console.error('막 구조 생성 실패:', error);
      alert('막 구조 생성 중 오류가 발생했습니다.');
      setViewState('selection');
    }
  };

  const handleBackFromActs = () => {
    setViewState('selection');
    setActsResult(null);
  };

  // ─────────────────────────────────────────────
  // 블록 생성 (복구: densityId 추가, selectedVariantIdByRow 초기화 로직 추가)
  // ─────────────────────────────────────────────
  const handleGenerateBlocks = async () => {
    if (!result || confirmedIndex === null) return;

    setViewState('blocks_loading');

    const selectedCandidate = result.candidates[confirmedIndex];
    const input: GenerateBlocksOverviewInput = {
      candidate: selectedCandidate,
      state: result.state,
      acts: actsResult || undefined,
      densityId: selectedDensityId, // densityId 추가
      mode: AI_MODE, // AI_MODE 추가
    };

    try {
      const draft = await generateBlocksOverview(input);
      setBlocksDraft(draft);

      // selectedVariantIdByRow 초기화: 각 행의 첫 번째 variant를 선택된 경로로 설정
      const initialSelectedVariants: Record<number, string> = {};
      draft.specs.forEach((spec) => {
        const rowIndex = spec.rowIndex ?? spec.index;
        const block = draft.blocksByIndex[spec.index];
        if (block && block.overviewVariants.length > 0) {
          // 해당 rowIndex에 이미 선택된 variant가 없으면 첫 번째 variant를 기본으로 설정
          if (!initialSelectedVariants[rowIndex]) {
            initialSelectedVariants[rowIndex] = block.overviewVariants[0].id;
          }
        }
      });
      setSelectedVariantIdByRow(initialSelectedVariants);

      setViewState('blocks');

      track({
        name: 'blocks_overview_generated',
        meta: { count: draft.specs.length, densityId: selectedDensityId },
      });
    } catch (error) {
      console.error('블록 생성 실패:', error);
      alert('블록 생성 중 오류가 발생했습니다.');
      setViewState('acts');
    }
  };

  // 24블록 화면에서 뒤로 가기 핸들러 (복구: selectedVariantIdByRow 초기화 추가)
  const handleBackFromBlocks = () => {
    setViewState('acts');
    setBlocksDraft(null);
    setSelectedVariantIdByRow({}); // Clear selected variants on back
  };

  const handleUpdateDraft = (nextDraft: BlocksDraft) => {
    setBlocksDraft(nextDraft);
  };

  // ── 선택된 variantIdByRow 업데이트 (복구) ────────────────────────────
  const handleUpdateSelectedVariantIdByRow = useCallback(
    (rowIndex: number, variantId: string) => {
      setSelectedVariantIdByRow((prev) => ({ ...prev, [rowIndex]: variantId }));
    },
    []
  );

  // ─────────────────────────────────────────────
  // 정책 헬퍼
  // ─────────────────────────────────────────────
  const canGenerateDetail = (): boolean =>
    detailGenCount < policy.maxDetailGenerationsPerSession;

  const isCoolingDown = (index: number): boolean => {
    const lastActionAt = lastActionAtByIndex[index];
    if (!lastActionAt) return false;
    return Date.now() - lastActionAt < policy.actionCooldownMs;
  };

  const markAction = (index: number) => {
    setLastActionAtByIndex((prev) => ({ ...prev, [index]: Date.now() }));
  };

  const consumeDetailQuota = () => {
    setDetailGenCount((prev) => prev + 1);
  };

  // ─────────────────────────────────────────────
  // 블록 액션 핸들러들
  // ─────────────────────────────────────────────
  const handleRegenerateOverview = async (index: BlockIndex) => {
    if (!blocksDraft || !result) return;
    if (isCoolingDown(index)) return;

    markAction(index);

    const spec = blocksDraft.specs.find((s) => s.index === index);
    const block = blocksDraft.blocksByIndex[index];
    if (!spec || !block) return;

    const currentOverview = block.overviewVariants.find(
      (v) => v.id === block.selectedOverviewId
    );
    if (!currentOverview) return;

    try {
      const newOverview = await regenerateOverview({
        index,
        spec,
        currentOverview,
        state: result.state,
        memory: blocksDraft.memory,
        mode: AI_MODE, // AI_MODE 추가
      });

      // ── selectedOverviewId 변경 안 함: 기존 v1이 main trunk 유지 ──
      // 새 variant는 overviewVariants 끝에 추가 → branchVariants로 배치됨
      // ── 열(column) 관리: Excel "열 삽입" ──────────────────────────
      // insertCol = 이 블록의 현재 최대 col + 1  (자신 바로 오른쪽)
      // 전체 캔버스에서 col >= insertCol 인 모든 variant 를 +1 (행 구분 없음)
      // 그 다음 이 블록에 새 브랜치 variant 를 insertCol 에 추가.
      // ─────────────────────────────────────────────────────────────

      // 이 블록의 현재 최대 물리 열
      const selfMaxCol = block.overviewVariants.reduce((mx, v) => {
        return Math.max(mx, getVariantCol(block, v.id));
      }, 0);
      const insertCol = selfMaxCol + 1;

      // 전역 열 밀기: insertCol 이상의 모든 노드를 +1
      const shiftedBlocks = shiftColumnsGlobally(
        blocksDraft.blocksByIndex,
        insertCol
      );

      // 밀기 완료된 이 블록에 새 브랜치 variant 추가, insertCol 부여
      const shiftedSelf = shiftedBlocks[index];
      const finalVcm: Record<string, number> = {
        ...(shiftedSelf.variantColumnMap ?? {}),
      };
      finalVcm[newOverview.id] = insertCol;

      const nextBlocksByIndex: Record<BlockIndex, BlockNode> = {
        ...shiftedBlocks,
        [index]: {
          ...shiftedSelf,
          overviewVariants: [...shiftedSelf.overviewVariants, newOverview],
          variantColumnMap: finalVcm,
          // selectedOverviewId: 변경 안 함 → 기존 v1 유지
        },
      };

      setBlocksDraft({
        ...blocksDraft,
        blocksByIndex: nextBlocksByIndex,
      });
    } catch (error) {
      console.error('개요 재생성 실패:', error);
    }
  };

  // 개요 발전시키기
  const handleExpandOverview = async (
    index: BlockIndex,
    preset: ExpandPreset
  ) => {
    if (!blocksDraft || !result) return;
    if (isCoolingDown(index)) return;

    markAction(index);

    const spec = blocksDraft.specs.find((s) => s.index === index);
    const block = blocksDraft.blocksByIndex[index];
    if (!spec || !block) return;

    const currentOverview = block.overviewVariants.find(
      (v) => v.id === block.selectedOverviewId
    );
    if (!currentOverview) return;

    try {
      const newOverview = await expandOverview({
        index,
        spec,
        currentOverview,
        preset,
        state: result.state,
        memory: blocksDraft.memory,
      });

      const updatedDraft = {
        ...blocksDraft,
        blocksByIndex: {
          ...blocksDraft.blocksByIndex,
          [index]: {
            ...block,
            overviewVariants: [...block.overviewVariants, newOverview],
            selectedOverviewId: newOverview.id,
          },
        },
      };

      setBlocksDraft(updatedDraft);
    } catch (error) {
      console.error('개요 발전 실패:', error);
    }
  };

  // 상세 생성 (기본 sentenceRange)
  const handleGenerateDetail = async (index: BlockIndex) => {
    if (!blocksDraft || !result) return;

    // 쿨다운 체크
    if (isCoolingDown(index)) {
      track({
        name: 'cooldown_blocked',
        meta: {
          index,
          cooldownMs: policy.actionCooldownMs,
        },
      });
      return;
    }

    // 할당량 체크
    if (!canGenerateDetail()) {
      track({
        name: 'quota_exceeded',
        meta: {
          kind: 'detail_generation',
          limit: policy.maxDetailGenerationsPerSession,
          detailGenCount,
        },
      });
      return;
    }

    // Track: 상세 생성 클릭
    track({
      name: 'block_detail_generate_clicked',
      meta: {
        index,
        sentenceRange: policy.detailSentenceRange,
        detailGenCount,
      },
    });

    consumeDetailQuota();
    markAction(index);

    const spec = blocksDraft.specs.find((s) => s.index === index);
    const block = blocksDraft.blocksByIndex[index];
    if (!spec || !block) return;

    const currentOverview = block.overviewVariants.find(
      (v) => v.id === block.selectedOverviewId
    );
    if (!currentOverview) return;

    try {
      const newDetail = await generateBlockDetail({
        index,
        spec,
        overview: currentOverview,
        state: result.state,
        memory: blocksDraft.memory,
        sentenceRange: policy.detailSentenceRange,
      });

      // detailVariants 최대 3 유지 (선택된 것은 보호)
      let updatedDetailVariants = [...block.detailVariants, newDetail];
      if (updatedDetailVariants.length > policy.maxDetailVariantsPerBlock) {
        // 선택된 variant 찾기
        const selectedId = block.selectedDetailId;
        const selectedIndex = updatedDetailVariants.findIndex(
          (v) => v.id === selectedId
        );

        // 가장 오래된 non-selected variant 제거
        if (selectedIndex !== -1) {
          // 선택된 것은 보호
          const nonSelected = updatedDetailVariants.filter(
            (v) => v.id !== selectedId
          );
          nonSelected.shift(); // 가장 오래된 것 제거
          updatedDetailVariants = [
            updatedDetailVariants[selectedIndex],
            ...nonSelected,
          ];
        } else {
          // 선택된 것 없으면 그냥 가장 오래된 것 제거
          updatedDetailVariants.shift();
        }
      }

      const updatedDraft = {
        ...blocksDraft,
        blocksByIndex: {
          ...blocksDraft.blocksByIndex,
          [index]: {
            ...block,
            detailVariants: updatedDetailVariants,
            selectedDetailId: newDetail.id,
          },
        },
      };

      setBlocksDraft(updatedDraft);

      // Track: 상세 생성 완료
      track({
        name: 'block_detail_generated',
        meta: {
          index,
          variantCount: updatedDetailVariants.length,
        },
      });
    } catch (error) {
      console.error('상세 생성 실패:', error);
    }
  };

  // 상세 확장 (더 길게 / 프리셋)
  const handleExpandDetail = async (
    index: BlockIndex,
    preset?: ExpandPreset,
    sentenceRange?: { min: number; max: number }
  ) => {
    if (!blocksDraft || !result) return;

    // 쿨다운 체크
    if (isCoolingDown(index)) {
      track({
        name: 'cooldown_blocked',
        meta: {
          index,
          cooldownMs: policy.actionCooldownMs,
        },
      });
      return;
    }

    // 할당량 체크
    if (!canGenerateDetail()) {
      track({
        name: 'quota_exceeded',
        meta: {
          kind: 'detail_generation',
          limit: policy.maxDetailGenerationsPerSession,
          detailGenCount,
        },
      });
      return;
    }

    consumeDetailQuota();
    markAction(index);

    const spec = blocksDraft.specs.find((s) => s.index === index);
    const block = blocksDraft.blocksByIndex[index];
    if (!spec || !block) return;

    const currentOverview = block.overviewVariants.find(
      (v) => v.id === block.selectedOverviewId
    );
    if (!currentOverview) return;

    try {
      const newDetail = await generateBlockDetail({
        index,
        spec,
        overview: currentOverview,
        state: result.state,
        memory: blocksDraft.memory,
        preset,
        sentenceRange: sentenceRange || policy.expandSentenceRange,
      });

      // detailVariants 최대 3 유지 (선택된 것은 보호)
      let updatedDetailVariants = [...block.detailVariants, newDetail];
      if (updatedDetailVariants.length > policy.maxDetailVariantsPerBlock) {
        const selectedId = block.selectedDetailId;
        const selectedIndex = updatedDetailVariants.findIndex(
          (v) => v.id === selectedId
        );

        if (selectedIndex !== -1) {
          const nonSelected = updatedDetailVariants.filter(
            (v) => v.id !== selectedId
          );
          nonSelected.shift();
          updatedDetailVariants = [
            updatedDetailVariants[selectedIndex],
            ...nonSelected,
          ];
        } else {
          updatedDetailVariants.shift();
        }
      }

      const updatedDraft = {
        ...blocksDraft,
        blocksByIndex: {
          ...blocksDraft.blocksByIndex,
          [index]: {
            ...block,
            detailVariants: updatedDetailVariants,
            selectedDetailId: newDetail.id,
          },
        },
      };

      setBlocksDraft(updatedDraft);

      // Track: 상세 확장 완료
      track({
        name: 'block_detail_expanded',
        meta: {
          index,
          preset,
          sentenceRange: sentenceRange || policy.expandSentenceRange,
        },
      });
    } catch (error) {
      console.error('상세 확장 실패:', error);
    }
  };

  // ─────────────────────────────────────────────
  // 브랜치 노드 "AI 블록 생성" → 완전히 새로운 다음 블록 삽입 (복구 및 수정)
  //
  // 설계 원칙:
  //  - sourceNodeId: 클릭된 브랜치 노드 (예: "block-1-branch-A")
  //  - afterBlockIndex: 해당 블록 인덱스 (예: 1)
  //  - 새 블록 인덱스: 현재 최대 인덱스 + 1 (기존 블록 순서 유지)
  //  - 새 블록은 기존 block(afterBlockIndex+1)의 "v2"가 아님
  //  - 새 블록 spec은 afterBlockIndex와 동일한 actIndex(막) 사용
  //  - 새 블록은 부모의 column을 상속받아 같은 행의 대안으로 생성되도록 로직을 단순화하세요.
  // ─────────────────────────────────────────────
  const handleInsertAfterBlock = async (
    sourceNodeId: string,
    afterBlockIndex: BlockIndex
  ) => {
    if (!blocksDraft) return;

    // 1. 부모 노드의 정확한 물리 열(Column) 위치를 가져옵니다.
    const sourceBlock = blocksDraft.blocksByIndex[afterBlockIndex];
    let targetCol = 0; // 기본값

    if (sourceBlock) {
      const branchMatch = sourceNodeId.match(/branch-([A-Z]+)$/);
      if (branchMatch) {
        // 브랜치에서 만든 경우: 해당 브랜치의 열 번호 상속
        const branchIdx = suffixToIndex(branchMatch[1]);
        // overviewVariants는 main(0) + branch(1부터) 이므로 +1
        const variant = sourceBlock.overviewVariants[branchIdx + 1];
        targetCol = sourceBlock.variantColumnMap?.[variant.id] ?? branchIdx + 1;
      } else {
        // 메인에서 만든 경우: 메인의 열 번호(보통 0) 상속
        const mainV = sourceBlock.overviewVariants[0];
        targetCol = sourceBlock.variantColumnMap?.[mainV.id] ?? 0;
      }
    }

    // 2. 행(Row) 결정: 다음 장면의 행 번호를 그대로 가져옵니다. (장면 삽입이 아닌 대안 생성)
    //    새 블록은 부모 블록의 다음 행에 위치함. (부모 블록의 rowIndex + 1)
    const parentSpec = blocksDraft.specs.find((s) => s.index === afterBlockIndex);
    const targetRow =
      (parentSpec?.rowIndex ?? parentSpec?.index ?? afterBlockIndex) + 1;

    // nextDisplayRow: UI에 표시할 1-based 행 순서 번호 (버튼 문구/타이틀용)
    // sortedSpecs의 고유 rowIndex 순서에서 targetRow 위치를 계산
    const uniqueRows = [
      ...new Set(
        [...blocksDraft.specs]
          .sort((a, b) => (a.rowIndex ?? a.index) - (b.rowIndex ?? b.index))
          .map((s) => s.rowIndex ?? s.index),
      ),
    ];
    const nextDisplayRow = uniqueRows.indexOf(targetRow) >= 0
      ? uniqueRows.indexOf(targetRow) + 1  // 이미 존재하는 행
      : uniqueRows.length + 1;             // 완전히 새 행 추가

    // 3. [핵심] 겹침 방지: 해당 위치에 이미 노드가 있는지 확인하고 전역 열 밀기 실행
    let workingBlocks = blocksDraft.blocksByIndex;
    const isOccupied = Object.values(workingBlocks).some((bn) => {
      const spec = blocksDraft.specs.find((s) => s.index === bn.index);
      if (!spec || (spec.rowIndex ?? spec.index) !== targetRow) return false;
      return bn.overviewVariants.some(
        (v) => (bn.variantColumnMap?.[v.id] ?? 0) === targetCol
      );
    });

    if (isOccupied) {
      workingBlocks = shiftColumnsGlobally(workingBlocks, targetCol);
    }

    // 4. 새 블록 생성 (부모와 같은 열 번호 부여)
    const newBlockIndex = Math.max(...blocksDraft.specs.map((s) => s.index)) + 1;
    const newVariantId = `v-insert-${newBlockIndex}-${Date.now()}`;

    const newVariant: BlockOverviewVariant = {
      id: newVariantId,
      createdAt: Date.now(),
      source: 'initial',
      headline: `+ 이어지는 ${nextDisplayRow}장면 (AI 생성 예정)`,
      hooks: [],
    };

    const newBlockNode: BlockNode = {
      index: newBlockIndex,
      overviewVariants: [newVariant],
      selectedOverviewId: newVariantId,
      detailVariants: [],
      selectedDetailId: undefined,
      variantColumnMap: { [newVariantId]: targetCol },
    };

    // 부모 블록과 같은 actIndex 사용
    const newSpec: BlockSpec = {
      index: newBlockIndex,
      actIndex: parentSpec?.actIndex ?? 1,
      title: `${nextDisplayRow}장면`,
      purpose: '(AI 블록 생성으로 추가됨)',
      rowIndex: targetRow,
    };

    const nextDraft: BlocksDraft = {
      ...blocksDraft,
      blocksByIndex: {
        ...workingBlocks,
        [newBlockIndex]: newBlockNode,
      },
      specs: [...blocksDraft.specs, newSpec],
    };

    setBlocksDraft(nextDraft);

    // 생성 즉시 이 행의 확정 경로를 새 블록으로 강제 점유
    // (기존 선택이 있더라도 덮어씀 → 에지가 즉시 연결됨)
    setSelectedVariantIdByRow((prev) => ({
      ...prev,
      [targetRow]: newVariantId,
    }));
  };

  // ── 인증 게이트 ────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-sm text-gray-400 dark:text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPanel />;
  }

  return (
    <main className="min-h-screen p-8">
      {/* Input 화면 */}
      {viewState === 'input' && <InputPanel onGenerate={handleGenerate} />}

      {/* Loading 화면 */}
      {viewState === 'loading' && (
        <div className="w-full max-w-2xl mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold">아이디어 생성 중...</h1>
          <p className="mt-4 text-foreground/60">잠시만 기다려주세요</p>
        </div>
      )}

      {/* Output 화면 */}
      {viewState === 'output' && result && (
        <OutputPanel
          result={result}
          onConfirm={handleConfirm}
          onBack={handleBack}
        />
      )}

      {/* Character Loading 화면 */}
      {viewState === 'character_loading' && (
        <div className="w-full max-w-2xl mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold">캐릭터 제안 로딩 중...</h1>
          <p className="mt-4 text-foreground/60">잠시만 기다려주세요</p>
        </div>
      )}

      {/* Character Setting 화면 */}
      {viewState === 'character_setting' && result && confirmedIndex !== null && (
        <CharacterPanel
          suggestions={characterSuggestions}
          candidate={result.candidates[confirmedIndex]}
          onConfirm={handleCharacterConfirm}
          onBack={handleBackFromCharacter}
        />
      )}

      {/* Selection 화면 */}
      {viewState === 'selection' && result && confirmedIndex !== null && (
        <SelectionPanel
          candidate={result.candidates[confirmedIndex]}
          densityOptions={MOCK_DENSITY_OPTIONS}
          defaultDensityId={selectedDensityId}
          onConfirm={handleSelectionConfirm}
          onBack={handleBackFromSelection}
        />
      )}

      {/* Acts Loading 화면 */}
      {viewState === 'acts_loading' && (
        <div className="w-full max-w-2xl mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold">막 구조 생성 중...</h1>
          <p className="mt-4 text-foreground/60">잠시만 기다려주세요</p>
        </div>
      )}

      {/* Acts 화면 */}
      {viewState === 'acts' && actsResult && (
        <ActsPanel
          actsResult={actsResult}
          actCount={selectedActCount}
          densityId={selectedDensityId}
          onBack={handleBackFromActs}
          onGenerateBlocks={handleGenerateBlocks}
        />
      )}

      {/* Blocks Loading 화면 */}
      {viewState === 'blocks_loading' && (
        <div className="w-full max-w-2xl mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold">블록 생성 중...</h1>
          <p className="mt-4 text-foreground/60">
            블록 개요를 생성하고 있습니다. 잠시만 기다려주세요.
          </p>
        </div>
      )}

      {/* Blocks 화면 */}
      {viewState === 'blocks' && blocksDraft && (
        <BlocksPanel
          draft={blocksDraft}
          onBack={handleBackFromBlocks}
          onUpdateDraft={handleUpdateDraft}
          policy={policy}
          detailGenCount={detailGenCount}
          canGenerateDetail={canGenerateDetail()}
          isCoolingDown={isCoolingDown}
          onRegenerateOverview={handleRegenerateOverview}
          onExpandOverview={handleExpandOverview}
          onGenerateDetail={handleGenerateDetail}
          onExpandDetail={handleExpandDetail}
          onInsertAfterBlock={handleInsertAfterBlock}
          selectedVariantIdByRow={selectedVariantIdByRow}
          onSelectVariantInRow={handleUpdateSelectedVariantIdByRow}
        />
      )}

      {/* Analytics Debug Panel */}
      <AnalyticsDebugPanel policy={policy} detailGenCount={detailGenCount} />
    </main>
  );
}

