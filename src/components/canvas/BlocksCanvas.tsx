/**
 * BlocksCanvas.tsx
 *
 * 세로형(Top-to-Bottom) React Flow 캔버스 — 고정 레이아웃 + 4방향 핸들
 *
 * ── 경로 규칙 ─────────────────────────────────────────────────────
 *
 * [초기 / v1 확정 경로]
 *   block-N-main (bottom) ──확정 실선──▶ block-(N+1)-main (top)
 *
 * [v2 생성 직후]
 *   1. block-N-main → block-N-branch-A: 수평 점선 (right → left)  ← 대안 표시
 *   2. block-N-branch-A 를 즉시 확정 경로로 승격:
 *      block-N-branch-A (bottom) ──확정 실선 ↵──▶ block-(N+1)-main (right)
 *   3. 기존 block-N-main (bottom) → block-(N+1)-main (top) 비활성화 (점선)
 *   4. activePath: block-N-branch-A + block-(N+1)-main + ...
 *
 * ["이 경로 선택" 클릭 — 브랜치 채택]
 *   - 이미 브랜치가 확정 경로면 → 무조건 유지 (노드 위치 불변)
 *   - v1으로 복귀 시: block-N-main(bottom) → block-(N+1)-main(top) 재활성
 *     + branch 경로 비활성
 *
 * [↵ 에지 형태]
 *   source: branch-A bottom  →  target: block-(N+1)-main right
 *   React Flow smoothstep이 자동으로 ↵ 곡선 생성
 *
 * ── 핸들 ID 체계 ──────────────────────────────────────────────────
 *   "top"    : target — 수직 흐름 입력
 *   "bottom" : source — 수직 흐름 출력 / 브랜치 확정 경로 출력
 *   "left"   : target — 브랜치 수신 (branch 노드가 수신)
 *   "right"  : target — ↵ 확정 경로 수신 (다음 블록 main이 브랜치에서 수신)
 *
 * ── 레이아웃 고정 ─────────────────────────────────────────────────
 *   nodesDraggable = false  (사용자 드래그 불가)
 */

'use client';

import { useMemo, useCallback, useState, useRef } from 'react';
import { useTheme } from '@/lib/theme';
import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
  type Connection,
  MarkerType,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type {
  BlocksDraft,
  BlockIndex,
  ExpandPreset,
  BlockNode,
  BlockRoutes,
  PathEdge,
} from '@/types/blocks';
import type { DetailPolicy } from '@/config/policy';
import { BlockDetailModal } from '@/components/BlockDetailModal';
import { BlockNodeCard, type BlockNodeData } from './BlockNodeCard';
import { ActGroupBackground, type ActGroupRect } from './ActGroupBackground';
import { InspectorPanel } from './InspectorPanel';

// ─────────────────────────────────────────────────────────────────
// 레이아웃 상수
// ─────────────────────────────────────────────────────────────────

const NODE_WIDTH = 220;
const NODE_HEIGHT = 200;
const NODE_GAP_Y = 80;
/** 브랜치 노드 X 오프셋 (v2 = TRUNK_X + BRANCH_GAP_X) */
const BRANCH_GAP_X = 320;
const TRUNK_X = 0;
const GROUP_PADDING_X = 40;
const GROUP_PADDING_Y = 30;

// ─────────────────────────────────────────────────────────────────
// 색상 상수
// ─────────────────────────────────────────────────────────────────

const COLOR_CONFIRMED = '#6366f1'; // Indigo-500 — 확정 경로 실선
const COLOR_ALT = '#9ca3af'; // Gray-400   — 대안/비활성 점선
const COLOR_BRANCH_H = '#a78bfa'; // Violet-400 — main→branch 수평 대안선

// ─────────────────────────────────────────────────────────────────
// PathEdge 확장 (핸들 정보 포함)
// ─────────────────────────────────────────────────────────────────

// type PathEdgeEx = PathEdge & {
//   sourceHandle?: string;
//   targetHandle?: string;
// };
// ─────────────────────────────────────────────────────────────────
// 막 번호별 탭 색상
// ─────────────────────────────────────────────────────────────────

const ACT_TAB_COLORS: Record<
  number,
  { active: string; inactive: string; dot: string }
> = {
  1: {
    active: 'bg-blue-600 text-white border-blue-600',
    inactive: 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50',
    dot: 'bg-blue-500',
  },
  2: {
    active: 'bg-green-600 text-white border-green-600',
    inactive: 'bg-white text-green-600 border-green-300 hover:bg-green-50',
    dot: 'bg-green-500',
  },
  3: {
    active: 'bg-yellow-500 text-white border-yellow-500',
    inactive: 'bg-white text-yellow-600 border-yellow-300 hover:bg-yellow-50',
    dot: 'bg-yellow-400',
  },
  4: {
    active: 'bg-orange-500 text-white border-orange-500',
    inactive: 'bg-white text-orange-600 border-orange-300 hover:bg-orange-50',
    dot: 'bg-orange-500',
  },
  5: {
    active: 'bg-purple-600 text-white border-purple-600',
    inactive: 'bg-white text-purple-600 border-purple-300 hover:bg-purple-50',
    dot: 'bg-purple-500',
  },
};
const DEFAULT_TAB_COLOR = {
  active: 'bg-gray-700 text-white border-gray-700',
  inactive: 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
  dot: 'bg-gray-500',
};
function getTabColor(actIndex: number) {
  return ACT_TAB_COLORS[actIndex] ?? DEFAULT_TAB_COLOR;
}

// ─────────────────────────────────────────────────────────────────
// 노드 ID 헬퍼
// ─────────────────────────────────────────────────────────────────

function getBranchSuffix(branchIdx: number): string {
  const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (branchIdx < 26) return L[branchIdx];
  return L[Math.floor(branchIdx / 26) - 1] + L[branchIdx % 26];
}
function makeMainNodeId(bi: number): string {
  return `block-${bi}-main`;
}
function makeBranchNodeId(bi: number, s: string): string {
  return `block-${bi}-branch-${s}`;
}

// ─────────────────────────────────────────────────────────────────
// 활성 경로 계산 (selectedVariantIdByRow 기반)
// ─────────────────────────────────────────────────────────────────

function computeActivePath(
  sortedBlockIndices: number[],
  draft: BlocksDraft,
  selectedVariantIdByRow: Record<number, string>,
): Set<string> {
  const active = new Set<string>();
  if (sortedBlockIndices.length === 0) return active;

  // 각 행에서 selectedVariantIdByRow에 해당하는 노드를 활성 경로로 간주
  for (const spec of draft.specs) {
    const rowIndex = spec.rowIndex ?? spec.index;
    const selectedVariantId = selectedVariantIdByRow[rowIndex];
    if (selectedVariantId) {
      const blockNode = draft.blocksByIndex[spec.index];
      if (blockNode) {
        const variantIndex = blockNode.overviewVariants.findIndex(
          (v) => v.id === selectedVariantId,
        );
        if (variantIndex === 0) {
          active.add(makeMainNodeId(spec.index));
        } else if (variantIndex > 0) {
          active.add(
            makeBranchNodeId(spec.index, getBranchSuffix(variantIndex - 1)),
          );
        }
      }
    }
  }
  return active;
}

// ─────────────────────────────────────────────────────────────────
// 기본 blockRoutes (선형 트렁크)
// block-N-main (bottom) → block-(N+1)-main (top)
// ─────────────────────────────────────────────────────────────────

// function buildDefaultRoutes(sortedSpecs: { index: number }[]): BlockRoutes {
//   const routes: BlockRoutes = {};
//   sortedSpecs.forEach((spec, idx) => {
//     if (idx === 0) return;
//     const prevIdx = sortedSpecs[idx - 1].index;
//     const srcId = makeMainNodeId(prevIdx);
//     const tgtId = makeMainNodeId(spec.index);
//     routes[srcId] = [
//       {
//         id: `route-${srcId}-to-${tgtId}`,
//         sourceNodeId: srcId,
//         targetNodeId: tgtId,
//         isActive: true,
//         label: "확정 경로",
//         sourceHandle: "bottom",
//         targetHandle: "top",
//       } as PathEdgeEx,
//     ];
//   });
//   return routes;
// }
// activateBranchRoute는 page.tsx(상위)에서 처리됩니다.
// BlocksCanvas의 handleRegenerate는 onRegenerateOverview만 위임합니다.

// ─────────────────────────────────────────────────────────────────
// 레이아웃 계산
// ─────────────────────────────────────────────────────────────────

const nodeTypes = { blockNode: BlockNodeCard };

function computeLayout(
  draft: BlocksDraft,
  selectedNodeId: string | null,
  activePath: Set<string>,
  selectedVariantIdByRow: Record<number, string>, // New prop
  callbacks: {
    onNodeSelect: (nodeId: string, blockIndex: BlockIndex) => void;
    onSelectVariant: (index: BlockIndex, variantId: string) => void;
    onRegenerate: (index: BlockIndex) => void;
    onExpand: (index: BlockIndex, preset: ExpandPreset) => void;
    onInsertAfter: (sourceNodeId: string, blockIndex: BlockIndex) => void;
    onUpdateHeadline: (index: BlockIndex, variantId: string, h: string) => void;
    onUpdateHooks: (index: BlockIndex, variantId: string, hk: string[]) => void;
    isCoolingDown: (index: BlockIndex) => boolean;
    onSelectVariantInRow: (rowIndex: number, variantId: string) => void; // New callback
  },
): { nodes: Node[]; edges: Edge[]; actRects: ActGroupRect[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const actYRanges: Record<number, { minY: number; maxY: number }> = {};
  // const routes = draft.blockRoutes ?? {}; // blockRoutes 제거
  // rowIndex 기준 정렬: AI 블록 생성 블록이 올바른 행에 배치됨
  const sortedSpecs = [...draft.specs].sort(
    (a, b) => (a.rowIndex ?? a.index) - (b.rowIndex ?? b.index),
  );

  // ── 행(row) 슬롯 매핑 ─────────────────────────────────────────
  // 같은 rowIndex 값을 가진 spec들은 동일한 y좌표(행)에 배치됨.
  // rowIndex의 고유값 순서대로 0, 1, 2... 행 번호(rowSlot)를 부여.
  // 예: rowIndex=[1, 2, 2, 3] → rowSlot=[0, 1, 1, 2
  const uniqueRowValues: number[] = [];
  sortedSpecs.forEach((spec) => {
    const rv = spec.rowIndex ?? spec.index;
    if (!uniqueRowValues.includes(rv)) uniqueRowValues.push(rv);
  });
  // spec의 rowIndex → 행 슬롯 번호
  function getRowSlot(spec: { index: number; rowIndex?: number }): number {
    const rv = spec.rowIndex ?? spec.index;
    return uniqueRowValues.indexOf(rv);
  }

  // ── 열(column) 배치: variantColumnMap을 신뢰하여 직접 배치 ──────
  // page.tsx에서 v2 생성 / AI 블록 생성 시 명시적으로 열을 관리하므로
  // computeLayout은 variantColumnMap 값을 그대로 사용함.
  // (충돌 자동 이동 제거 → 명시적 열 주소 방식)
  function resolveColumn(
    variantId: string | undefined,
    vcm: Record<string, number> | undefined,
    fallback: number,
  ): number {
    if (variantId !== undefined && vcm?.[variantId] !== undefined)
      return vcm[variantId];
    return fallback;
  }

  // ── 노드 생성 ──────────────────────────────────────────────────
  sortedSpecs.forEach((spec) => {
    const rowSlot = getRowSlot(spec);
    const blockNode: BlockNode | undefined = draft.blocksByIndex[spec.index];
    if (!blockNode) return;

    const trunkY = rowSlot * (NODE_HEIGHT + NODE_GAP_Y);
    // const selectedId = blockNode.selectedOverviewId; // Use selectedVariantIdByRow instead
    const selectedIdInRow = selectedVariantIdByRow[spec.rowIndex ?? spec.index];
    const actIdx = spec.actIndex;

    if (!actYRanges[actIdx]) {
      actYRanges[actIdx] = { minY: trunkY, maxY: trunkY + NODE_HEIGHT };
    } else {
      actYRanges[actIdx].minY = Math.min(actYRanges[actIdx].minY, trunkY);
      actYRanges[actIdx].maxY = Math.max(
        actYRanges[actIdx].maxY,
        trunkY + NODE_HEIGHT,
      );
    }

    // ── main/branch 분류: 배열 인덱스 기준 (selectedOverviewId 무관) ──
    // variants[0 = main 노드
    // variants[1+] = 브랜치 노드 (오른쪽)
    // variantColumnMap이 있으면 그것을 우선 사용하여 물리적 열 결정
    const mainVariant = blockNode.overviewVariants[0];
    const branchVariants = blockNode.overviewVariants.slice(1);

    // ── 다음 행 rowIndex 계산 (버튼 문구용) ───────────────────────
    const currentRowValue = spec.rowIndex ?? spec.index;
    const currentRowSlot = uniqueRowValues.indexOf(currentRowValue);
    const nextRowValue =
      currentRowSlot < uniqueRowValues.length - 1
        ? uniqueRowValues[currentRowSlot + 1]
        : undefined;
    // nextRowIndex: 다음 행 번호 (1-based 표시용) = nextRowSlot + 1
    const nextRowIndex =
      nextRowValue !== undefined ? currentRowSlot + 2 : undefined;

    // ── "이어지는 블록 생성" 버튼 표시 여부 ──────────────────────
    // 다음 행(nextRowValue)이 uniqueRowValues에 이미 존재하면
    // 이어지는 다음 장면이 이미 있으므로 버튼 숨김.
    // 마지막 행인 경우(nextRowValue === undefined)에만 버튼 표시.
    const canInsert = nextRowValue === undefined;

    // ── main 노드 배치 ──
    // variantColumnMap[mainVariant.id]가 0이 아니면 브랜치 열에 배치
    // (AI 블록 생성으로 만들어진 새 블록: trunk(x=0)가 아닌 특정 열에 배치)
    if (mainVariant) {
      const nodeId = makeMainNodeId(spec.index);

      // variantColumnMap에서 열 확인 (없으면 0 = trunk)
      // page.tsx에서 명시적으로 관리하므로 충돌 자동 이동 없음
      const finalMainCol = resolveColumn(
        mainVariant.id,
        blockNode.variantColumnMap,
        0,
      );
      const mainX = TRUNK_X + BRANCH_GAP_X * finalMainCol;
      // trunk가 아닌 열에 배치되면 isBranch=true (브랜치 스타일 적용)
      const isMainPlacedAsBranch = finalMainCol > 0;
      const isActive = activePath.has(nodeId);

      nodes.push({
        id: nodeId,
        type: 'blockNode',
        position: { x: mainX, y: trunkY },
        draggable: false,
        data: {
          blockIndex: spec.index,
          actIndex: spec.actIndex,
          rowIndex: spec.rowIndex ?? spec.index,
          specTitle: spec.title,
          specPurpose: spec.purpose,
          variant: mainVariant,
          selectedOverviewId: selectedIdInRow,
          variantCount: blockNode.overviewVariants.length,
          isBranch: isMainPlacedAsBranch,
          isCoolingDown: callbacks.isCoolingDown(spec.index),
          isActivePath: isActive,
          isNodeSelected: selectedNodeId === nodeId,
          canInsertAfter: canInsert,
          nextRowIndex,           // ← 다음 행 번호 전달
          onNodeSelect: () => callbacks.onNodeSelect(nodeId, spec.index),
          onCardClick: () => callbacks.onNodeSelect(nodeId, spec.index),
          onSelectVariant: () =>
            callbacks.onSelectVariantInRow(
              spec.rowIndex ?? spec.index,
              mainVariant.id,
            ),
          onRegenerate: () => callbacks.onRegenerate(spec.index),
          onExpand: (p: ExpandPreset) => callbacks.onExpand(spec.index, p),
          onInsertAfter: () => callbacks.onInsertAfter(nodeId, spec.index),
          onUpdateHeadline: (h: string) =>
            callbacks.onUpdateHeadline(spec.index, mainVariant.id, h),
          onUpdateHooks: (hk: string[]) =>
            callbacks.onUpdateHooks(spec.index, mainVariant.id, hk),
        } satisfies BlockNodeData,
        className: isActive ? '' : 'grayscale opacity-45',
      });
    }

    // ── 브랜치 노드 배치 ──
    // variantColumnMap이 있으면 그 열을 원하는 열로 사용, 없으면 branchIdx+1
    branchVariants.forEach((variant, branchIdx) => {
      const suffix = getBranchSuffix(branchIdx);
      const nodeId = makeBranchNodeId(spec.index, suffix);

      // 열: variantColumnMap 우선, 없으면 배열 순서 기반 (branchIdx+1)
      // page.tsx에서 명시적으로 관리하므로 충돌 자동 이동 없음
      const finalCol = resolveColumn(
        variant.id,
        blockNode.variantColumnMap,
        branchIdx + 1,
      );
      const branchX = TRUNK_X + BRANCH_GAP_X * finalCol;

      // const hasDownstream = !!(routes[nodeId]?.length); // blockRoutes 제거
      const isActive = activePath.has(nodeId);

      nodes.push({
        id: nodeId,
        type: 'blockNode',
        position: { x: branchX, y: trunkY },
        draggable: false,
        data: {
          blockIndex: spec.index,
          actIndex: spec.actIndex,
          rowIndex: spec.rowIndex ?? spec.index,
          specTitle: spec.title,
          specPurpose: spec.purpose,
          variant,
          selectedOverviewId: selectedIdInRow,
          variantCount: blockNode.overviewVariants.length,
          isBranch: true,
          isCoolingDown: callbacks.isCoolingDown(spec.index),
          isActivePath: isActive,
          isNodeSelected: selectedNodeId === nodeId,
          canInsertAfter: canInsert, // main과 동일 조건: 마지막 행일 때만 표시
          nextRowIndex,           // ← 다음 행 번호 전달
          onNodeSelect: () => callbacks.onNodeSelect(nodeId, spec.index),
          onCardClick: () => callbacks.onNodeSelect(nodeId, spec.index),
          onSelectVariant: () =>
            callbacks.onSelectVariantInRow(
              spec.rowIndex ?? spec.index,
              variant.id,
            ),
          onRegenerate: () => callbacks.onRegenerate(spec.index),
          onExpand: (p: ExpandPreset) => callbacks.onExpand(spec.index, p),
          onInsertAfter: () => callbacks.onInsertAfter(nodeId, spec.index),
          onUpdateHeadline: (h: string) =>
            callbacks.onUpdateHeadline(spec.index, variant.id, h),
          onUpdateHooks: (hk: string[]) =>
            callbacks.onUpdateHooks(spec.index, variant.id, hk),
        } satisfies BlockNodeData,
        className: isActive ? '' : 'grayscale opacity-45',
      });

      // main (right) ──점선──▶ branch (left)  [수평 대안 표시선]
      // AI 블록 생성으로 만든 블록(main이 브랜치 열에 있는 경우)은 이 에지 생략
      const mainVariantId = blockNode.overviewVariants[0]?.id;
      const mainIsOnTrunk =
        (blockNode.variantColumnMap?.[mainVariantId ?? ''] ?? 0) === 0;
      if (mainIsOnTrunk) {
        edges.push({
          id: `edge-branch-${spec.index}-${suffix}`,
          source: makeMainNodeId(spec.index),
          sourceHandle: 'right',
          target: nodeId,
          targetHandle: 'left',
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: COLOR_BRANCH_H,
            strokeWidth: 1.5,
            strokeDasharray: '5 3',
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: COLOR_BRANCH_H,
            width: 12,
            height: 12,
          },
          label: `v${branchIdx + 2}`,
          labelStyle: { fontSize: 9, fill: '#7c3aed' },
          labelBgStyle: { fill: '#f5f3ff', fillOpacity: 0.9, rx: 3 },
          labelBgPadding: [2, 4],
        });
      }
    });
  });

  // ── 확정 경로 에지 자동 생성 (selectedVariantIdByRow 기반) ─────────────────────────
  // for (i = 0 to totalRows - 2):
  //   Source : Row(i)에서 selectedVariantIdByRow 에 해당하는 노드 bottom 핸들
  //   Target : Row(i+1)에서 selectedVariantIdByRow 에 해당하는 노드 top 핸들
  //            (확정된 노드가 없으면 v1 main 노드로 fallback)
  //   스타일 : strokeWidth:4 Indigo 실선
  for (let i = 0; i < uniqueRowValues.length - 1; i++) {
    const currentRowValue = uniqueRowValues[i];
    const nextRowValue    = uniqueRowValues[i + 1];

    // ── Source 노드 결정 ─────────────────────────────────────────
    const currentBlock = sortedSpecs.find(
      (s) => (s.rowIndex ?? s.index) === currentRowValue,
    );
    const currentBlockNode = currentBlock
      ? draft.blocksByIndex[currentBlock.index]
      : undefined;
    if (!currentBlock || !currentBlockNode) continue;

    const currentSelectedVariantId = selectedVariantIdByRow[currentRowValue];
    let currentVariantIndex = currentSelectedVariantId
      ? currentBlockNode.overviewVariants.findIndex(
          (v) => v.id === currentSelectedVariantId,
        )
      : 0; // fallback → v1 main
    if (currentVariantIndex < 0) currentVariantIndex = 0;

    const sourceNodeId =
      currentVariantIndex === 0
        ? makeMainNodeId(currentBlock.index)
        : makeBranchNodeId(
            currentBlock.index,
            getBranchSuffix(currentVariantIndex - 1),
          );

    // ── Target 노드 결정 ─────────────────────────────────────────
    const nextBlock = sortedSpecs.find(
      (s) => (s.rowIndex ?? s.index) === nextRowValue,
    );
    const nextBlockNode = nextBlock
      ? draft.blocksByIndex[nextBlock.index]
      : undefined;
    if (!nextBlock || !nextBlockNode) continue;

    const nextSelectedVariantId = selectedVariantIdByRow[nextRowValue];
    let nextVariantIndex = nextSelectedVariantId
      ? nextBlockNode.overviewVariants.findIndex(
          (v) => v.id === nextSelectedVariantId,
        )
      : 0; // fallback → v1 main
    if (nextVariantIndex < 0) nextVariantIndex = 0;

    const targetNodeId =
      nextVariantIndex === 0
        ? makeMainNodeId(nextBlock.index)
        : makeBranchNodeId(
            nextBlock.index,
            getBranchSuffix(nextVariantIndex - 1),
          );

    // ── 에지 생성 (strokeWidth:4, 항상 bottom→top, zIndex 최상위) ──
    edges.push({
      id: `auto-route-${sourceNodeId}-to-${targetNodeId}`,
      source: sourceNodeId,
      sourceHandle: 'bottom',
      target: targetNodeId,
      targetHandle: 'top',
      type: 'smoothstep',
      animated: false,
      zIndex: 10,
      style: { stroke: COLOR_CONFIRMED, strokeWidth: 4 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: COLOR_CONFIRMED,
        width: 16,
        height: 16,
      },
      label: '확정',
      labelStyle: { fontSize: 9, fill: '#4338ca', fontWeight: 700 },
      labelBgStyle: { fill: '#eef2ff', fillOpacity: 0.9, rx: 3 },
      labelBgPadding: [2, 4],
    });
  }
  // ── Act 그룹 배경 ────────────────────────────────────────────
  const actRects: ActGroupRect[] = Object.entries(actYRanges).map(
    ([actIdxStr, { minY, maxY }]) => {
      const actIndex = Number(actIdxStr);
      let maxBranchX = TRUNK_X + NODE_WIDTH;
      sortedSpecs.forEach((spec) => {
        if (spec.actIndex !== actIndex) return;
        const bn = draft.blocksByIndex[spec.index];
        if (!bn) return;
        // variantColumnMap의 최대 열 값 고려
        const maxColFromMap = bn.variantColumnMap
          ? Math.max(0, ...Object.values(bn.variantColumnMap))
          : 0;
        const bc = Math.max(bn.overviewVariants.length - 1, maxColFromMap);
        if (bc > 0)
          maxBranchX = Math.max(
            maxBranchX,
            TRUNK_X + BRANCH_GAP_X * bc + NODE_WIDTH,
          );
      });
      return {
        actIndex,
        x: TRUNK_X - GROUP_PADDING_X,
        y: minY - GROUP_PADDING_Y,
        width: maxBranchX - TRUNK_X + GROUP_PADDING_X * 2,
        height: maxY - minY + GROUP_PADDING_Y * 2,
      };
    },
  );
  actRects.sort((a, b) => a.actIndex - b.actIndex);

  return { nodes, edges, actRects };
}

// ─────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────

export interface BlocksCanvasProps {
  draft: BlocksDraft;
  onUpdateDraft: (next: BlocksDraft) => void;
  policy: DetailPolicy;
  detailGenCount: number;
  canGenerateDetail: boolean;
  isCoolingDown: (index: number) => boolean;
  onRegenerateOverview: (index: BlockIndex) => void;
  onExpandOverview: (index: BlockIndex, preset: ExpandPreset) => void;
  onGenerateDetail: (index: BlockIndex) => void;
  onExpandDetail: (index: BlockIndex, preset?: ExpandPreset) => void;
  /**
   * 브랜치 노드의 "AI 블록 생성" 클릭 시 호출.
   * sourceNodeId: 클릭된 브랜치 노드 ID
   * afterBlockIndex: 클릭된 노드의 블록 인덱스 (이 다음에 새 블록 삽입)
   */
  onInsertAfterBlock: (
    sourceNodeId: string,
    afterBlockIndex: BlockIndex,
  ) => void;
  selectedVariantIdByRow: Record<number, string>; // New prop
  onSelectVariantInRow: (rowIndex: number, variantId: string) => void; // New prop
}

// ─────────────────────────────────────────────────────────────────
// 스티키 탭
// ─────────────────────────────────────────────────────────────────

interface StickyActTabsProps {
  actRects: ActGroupRect[];
  actLabels: Record<number, string>;
  activeActIndex: number;
  onTabClick: (actIndex: number) => void;
}

function StickyActTabs({
  actRects,
  actLabels,
  activeActIndex,
  onTabClick,
}: StickyActTabsProps) {
  if (actRects.length === 0) return null;
  return (
    <div
      className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5
                 bg-white/90 dark:bg-black/40 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-full px-3 py-1.5
                 shadow-md dark:shadow-black/30 pointer-events-auto"
      style={{ maxWidth: 'calc(100% - 320px)' }}
    >
      {actRects.map(({ actIndex }) => {
        const label = actLabels[actIndex] ?? `Act ${actIndex}`;
        const color = getTabColor(actIndex);
        const isActive = actIndex === activeActIndex;
        return (
          <button
            key={actIndex}
            onClick={() => onTabClick(actIndex)}
            className={[
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
              'border transition-all duration-150 whitespace-nowrap',
              isActive ? color.active : color.inactive,
            ].join(' ')}
          >
            <span
              className={[
                'w-1.5 h-1.5 rounded-full flex-shrink-0',
                isActive ? 'bg-white' : color.dot,
              ].join(' ')}
            />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Inner Canvas
// ─────────────────────────────────────────────────────────────────

function BlocksCanvasInner({
  draft,
  onUpdateDraft,
  canGenerateDetail,
  isCoolingDown,
  onRegenerateOverview,
  onExpandOverview,
  onGenerateDetail,
  onExpandDetail,
  onInsertAfterBlock,
  selectedVariantIdByRow, // New prop
  onSelectVariantInRow, // New prop
}: BlocksCanvasProps) {
  const { fitView, setViewport, getViewport } = useReactFlow();
  const { theme } = useTheme();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedBlockIndex, setSelectedBlockIndex] =
    useState<BlockIndex | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeActIndex, setActiveActIndex] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const sortedSpecs = useMemo(
    () =>
      [...draft.specs].sort(
        (a, b) => (a.rowIndex ?? a.index) - (b.rowIndex ?? b.index),
      ),
    [draft.specs],
  );

  // ── blockRoutes 초기화 보장 (이제 필요 없음) ──────────────────────────────────
  // const ensureRoutes = useCallback(
  //   (d: BlocksDraft): BlocksDraft => {
  //     if (d.blockRoutes && Object.keys(d.blockRoutes).length > 0) return d;
  //     const specs = [...d.specs].sort((a, b) => (a.rowIndex ?? a.index) - (b.rowIndex ?? b.index));
  //     return { ...d, blockRoutes: buildDefaultRoutes(specs) };
  //   },
  //   []
  // );

  // ── 활성 경로 계산 ─────────────────────────────────────────────
  const activePath = useMemo(
    () =>
      computeActivePath(
        sortedSpecs.map((s) => s.index),
        draft,
        selectedVariantIdByRow,
      ),
    [sortedSpecs, draft, selectedVariantIdByRow],
  );

  const handleInspectorClose = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedBlockIndex(null);
  }, []);

  const handleNodeSelect = useCallback(
    (nodeId: string, blockIndex: BlockIndex) => {
      setSelectedNodeId(nodeId);
      setSelectedBlockIndex(blockIndex);
    },
    [],
  );

  // ── v2 생성 (🔄 재생성) ────────────────────────────────────────
  // onRegenerate 호출 후 새 variant가 overviewVariants 배열 끝에 추가될 예정.
  // 이 시점에서 blockRoutes를 "새 브랜치 확정 경로" 패턴으로 업데이트.
  //
  // 실제로 variant 추가는 상위(BlocksPage 등)에서 처리하므로,
  // 여기서는 **현재 overviewVariants 기준 마지막 브랜치**를 확정 경로로 승격하는
  // 함수를 onRegenerate 직후 호출할 수 있도록 별도로 노출.
  // → 단순화: onRegenerate 호출 시점에 미리 routes를 준비 (새 variant ID는 아직 모름)
  //   실제 새 브랜치 노드가 배열에 추가된 뒤 draft가 업데이트되면
  //   computeActivePath / computeLayout 이 자동으로 재계산됨.
  //   따라서 여기서는 "가장 최근 브랜치를 확정" 하는 로직을 draft 변화를 감지해 처리.
  //
  // ── 핵심 처리: draft.blocksByIndex[N].overviewVariants가 늘었을 때 ──
  // useEffect 없이, handleSelectVariant를 통해 명시적으로 처리.
  // 새 variant 추가 후 상위 컴포넌트가 draft를 업데이트하면:
  //   → computeLayout에서 branchVariants가 늘어남
  //   → 브랜치 노드가 오른쪽에 추가됨
  // 이 시점에 "자동 확정 경로 승격"을 트리거하려면 onRegenerate 래핑이 필요.

  // ── v2 재생성 ─────────────────────────────────────────────────
  // blockRoutes 업데이트는 page.tsx(상위)의 handleRegenerateOverview에서 처리.
  // 여기서는 단순히 위임만 함.
  const handleRegenerate = useCallback(
    (blockIndex: BlockIndex) => {
      onRegenerateOverview(blockIndex);
    },
    [onRegenerateOverview],
  );

  // ── variant 채택 ("이 경로 선택") ────────────────────────────
  // selectedVariantIdByRow를 업데이트하도록 상위 콜백 호출
  const handleSelectVariant = useCallback(
    (blockIndex: BlockIndex, variantId: string) => {
      const node = draft.blocksByIndex[blockIndex];
      if (!node) return;
      const rowIndex =
        sortedSpecs.find((s) => s.index === blockIndex)?.rowIndex ?? blockIndex;
      onSelectVariantInRow(rowIndex, variantId);
    },
    [draft.blocksByIndex, sortedSpecs, onSelectVariantInRow],
  );

  // ── 상세 variant 선택 ────────────────────────────────────────
  const handleSelectOverviewVariant = useCallback(
    (index: BlockIndex, variantId: string) =>
      handleSelectVariant(index, variantId),
    [handleSelectVariant],
  );

  const handleSelectDetailVariant = useCallback(
    (index: BlockIndex, variantId: string) => {
      const node = draft.blocksByIndex[index];
      if (!node) return;
      onUpdateDraft({
        ...draft,
        blocksByIndex: {
          ...draft.blocksByIndex,
          [index]: { ...node, selectedDetailId: variantId },
        },
      });
    },
    [draft, onUpdateDraft],
  );

  // ── 드래그 비활성화 (no-op) ──────────────────────────────────
  const handleNodesChange = useCallback(() => {}, []);

  // ── 수동 에지 연결 (비활성화) ──────────────────────────────────
  const handleConnect = useCallback((connection: Connection) => {
    // 수동 연결 비활성화
    console.log('Manual connection is disabled.');
  }, []);

  // ── 하단 AI 블록 생성 (브랜치 노드 전용) ────────────────────
  // 브랜치 노드의 bottom handle hover → "AI 블록 생성" 클릭
  // → 이 브랜치와 이어지는 완전히 새로운 다음 블록 생성을 상위에 위임
  // → 기존 block(N+1)의 재생성이 아님
  const handleInsertAfter = useCallback(
    (sourceNodeId: string, blockIndex: BlockIndex) => {
      onInsertAfterBlock(sourceNodeId, blockIndex);
    },
    [onInsertAfterBlock],
  );

  // ── 인라인 편집 ──────────────────────────────────────────────
  const handleUpdateHeadline = useCallback(
    (index: BlockIndex, variantId: string, h: string) => {
      const node = draft.blocksByIndex[index];
      if (!node) return;
      onUpdateDraft({
        ...draft,
        blocksByIndex: {
          ...draft.blocksByIndex,
          [index]: {
            ...node,
            overviewVariants: node.overviewVariants.map((v) =>
              v.id === variantId ? { ...v, headline: h } : v,
            ),
          },
        },
      });
    },
    [draft, onUpdateDraft],
  );

  const handleUpdateHooks = useCallback(
    (index: BlockIndex, variantId: string, hk: string[]) => {
      const node = draft.blocksByIndex[index];
      if (!node) return;
      onUpdateDraft({
        ...draft,
        blocksByIndex: {
          ...draft.blocksByIndex,
          [index]: {
            ...node,
            overviewVariants: node.overviewVariants.map((v) =>
              v.id === variantId ? { ...v, hooks: hk } : v,
            ),
          },
        },
      });
    },
    [draft, onUpdateDraft],
  );

  const handleUpdateTitle = useCallback(
    (index: BlockIndex, t: string) => {
      onUpdateDraft({
        ...draft,
        specs: draft.specs.map((s) =>
          s.index === index ? { ...s, title: t } : s,
        ),
      });
    },
    [draft, onUpdateDraft],
  );

  // ── 레이아웃 계산 ─────────────────────────────────────────────
  const { nodes, edges, actRects } = useMemo(
    () =>
      computeLayout(draft, selectedNodeId, activePath, selectedVariantIdByRow, {
        // Pass selectedVariantIdByRow
        onNodeSelect: handleNodeSelect,
        onSelectVariant: handleSelectVariant,
        onRegenerate: handleRegenerate,
        onExpand: onExpandOverview,
        onInsertAfter: handleInsertAfter,
        onUpdateHeadline: handleUpdateHeadline,
        onUpdateHooks: handleUpdateHooks,
        isCoolingDown,
        onSelectVariantInRow: onSelectVariantInRow, // Pass new callback
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      draft,
      selectedNodeId,
      activePath,
      isCoolingDown,
      selectedVariantIdByRow,
      onSelectVariantInRow,
    ], // Add selectedVariantIdByRow to deps
  );

  // ── 막 레이블 ─────────────────────────────────────────────────
  const actLabels = useMemo(() => {
    const l: Record<number, string> = {};
    for (let i = 1; i <= draft.totalActs; i++) l[i] = `Act ${i}`;
    return l;
  }, [draft.totalActs]);

  // ── 탭 클릭 ─────────────────────────────────────────────────
  const handleTabClick = useCallback(
    (actIndex: number) => {
      const rect = actRects.find((r) => r.actIndex === actIndex);
      if (!rect) return;
      setActiveActIndex(actIndex);
      const vw = containerRef.current?.clientWidth ?? window.innerWidth;
      const currentZoom = getViewport().zoom;
      const z = Math.max(currentZoom, 0.65);
      setViewport(
        {
          x: vw / 2 - (rect.x + rect.width / 2) * z,
          y: 80 - rect.y * z,
          zoom: z,
        },
        { duration: 400 },
      );
    },
    [actRects, getViewport, setViewport],
  );

  const inspectorNode = selectedBlockIndex
    ? (draft.blocksByIndex[selectedBlockIndex] ?? null)
    : null;
  const inspectorSpec = selectedBlockIndex
    ? (draft.specs.find((s) => s.index === selectedBlockIndex) ?? null)
    : null;

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <StickyActTabs
        actRects={actRects}
        actLabels={actLabels}
        activeActIndex={activeActIndex}
        onTabClick={handleTabClick}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15, minZoom: 0.3, maxZoom: 1.2 }}
        minZoom={0.15}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false} // Disable manual connections
        elementsSelectable={true}
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        defaultViewport={{ x: 80, y: 40, zoom: 0.7 }}
        onNodesChange={handleNodesChange}
        onConnect={handleConnect} // Keep handleConnect but it's a no-op now
        onPaneClick={() => {
          setSelectedNodeId(null);
          setSelectedBlockIndex(null);
        }}
        onInit={() => {
          setTimeout(() => {
            fitView({ padding: 0.15, duration: 300 });
            if (actRects.length > 0) setActiveActIndex(actRects[0].actIndex);
          }, 150);
        }}
        onMoveEnd={(_, viewport) => {
          if (actRects.length === 0) return;
          const vh = containerRef.current?.clientHeight ?? window.innerHeight;
          const cy = (-viewport.y + vh / 2) / viewport.zoom;
          let closest = actRects[0];
          let minD = Infinity;
          for (const r of actRects) {
            const d = Math.abs(r.y + r.height / 2 - cy);
            if (d < minD) {
              minD = d;
              closest = r;
            }
          }
          setActiveActIndex(closest.actIndex);
        }}
        style={{ background: theme === 'dark' ? 'transparent' : '#f8fafc' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={theme === 'dark' ? '#1e3a5f' : '#cbd5e1'}
        />
        <ActGroupBackground actRects={actRects} actLabels={actLabels} />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap
          position="bottom-right"
          nodeColor={(n) => {
            const d = n.data as unknown as BlockNodeData;
            if (d.isNodeSelected) return '#4338ca';
            if (!d.isActivePath) return theme === 'dark' ? '#1e3a5f' : '#e5e7eb';
            if (d.isBranch) return '#c7d2fe';
            return COLOR_CONFIRMED;
          }}
          maskColor={theme === 'dark' ? 'rgba(12,18,32,0.75)' : 'rgba(248,250,252,0.75)'}
          style={{
            backgroundColor: theme === 'dark' ? '#0f1e35' : '#f1f5f9',
            border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
            borderRadius: 8,
          }}
        />
      </ReactFlow>

      {inspectorNode && inspectorSpec && selectedBlockIndex !== null && (
        <InspectorPanel
          blockIndex={selectedBlockIndex}
          spec={inspectorSpec}
          node={inspectorNode}
          isCoolingDown={isCoolingDown(selectedBlockIndex)}
          onClose={handleInspectorClose}
          onUpdateHeadline={(h) =>
            handleUpdateHeadline(
              selectedBlockIndex,
              inspectorNode.selectedOverviewId,
              h,
            )
          }
          onUpdateHooks={(hk) =>
            handleUpdateHooks(
              selectedBlockIndex,
              inspectorNode.selectedOverviewId,
              hk,
            )
          }
          onUpdateTitle={(t) => handleUpdateTitle(selectedBlockIndex, t)}
          onRegenerate={() => handleRegenerate(selectedBlockIndex)}
          onExpand={(preset) => onExpandOverview(selectedBlockIndex, preset)}
        />
      )}

      {isDetailModalOpen &&
        inspectorNode &&
        inspectorSpec &&
        selectedBlockIndex !== null && (
          <BlockDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            node={inspectorNode}
            spec={inspectorSpec}
            memory={draft.memory}
            onSelectOverviewVariant={(v) =>
              handleSelectOverviewVariant(selectedBlockIndex, v)
            }
            onSelectDetailVariant={(v) =>
              handleSelectDetailVariant(selectedBlockIndex, v)
            }
            onGenerateDetail={() => onGenerateDetail(selectedBlockIndex)}
            onExpandDetail={(p) => onExpandDetail(selectedBlockIndex, p)}
            canGenerateDetail={canGenerateDetail}
            isCoolingDown={isCoolingDown(selectedBlockIndex)}
          />
        )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Public export
// ─────────────────────────────────────────────────────────────────

export function BlocksCanvas(props: BlocksCanvasProps) {
  return (
    <ReactFlowProvider>
      <BlocksCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
