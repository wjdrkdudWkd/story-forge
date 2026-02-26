/**
 * BlocksPanel.tsx
 *
 * 블록 메인 패널 — 세로형 React Flow 캔버스 기반
 *
 * [리팩토링
 * - 하드코딩된 24블록 × 4막 그리드 → 가변 블록 수 지원 캔버스로 교체
 * - 막 그룹화는 BlocksDraft.specs[].actIndex + totalActs 기반 동적 처리
 * - 상세 모달은 BlocksCanvas 내부에서 관리
 */

'use client';

import type { BlocksDraft, BlockIndex, ExpandPreset } from '@/types/blocks';
import type { DetailPolicy } from '@/config/policy';
import { Button } from './ui/button';
import { BlocksCanvas } from './canvas/BlocksCanvas';

export interface BlocksPanelProps {
  draft: BlocksDraft;
  onBack: () => void;
  onUpdateDraft: (next: BlocksDraft) => void;
  policy: DetailPolicy;
  detailGenCount: number;
  canGenerateDetail: boolean;
  isCoolingDown: (index: number) => boolean;
  onRegenerateOverview: (index: BlockIndex) => void;
  onExpandOverview: (index: BlockIndex, preset: ExpandPreset) => void;
  onGenerateDetail: (index: BlockIndex) => void;
  onExpandDetail: (index: BlockIndex, preset?: ExpandPreset) => void;
  /** 브랜치 노드 "AI 블록 생성" 클릭 → 완전히 새로운 다음 블록 삽입 */
  onInsertAfterBlock: (
    sourceNodeId: string,
    afterBlockIndex: BlockIndex,
  ) => void;
  selectedVariantIdByRow: Record<number, string>;
  onSelectVariantInRow: (rowIndex: number, variantId: string) => void;
}

export function BlocksPanel({
  draft,
  onBack,
  onUpdateDraft,
  policy,
  detailGenCount,
  canGenerateDetail,
  isCoolingDown,
  onRegenerateOverview,
  onExpandOverview,
  onGenerateDetail,
  onExpandDetail,
  onInsertAfterBlock,
  selectedVariantIdByRow,
  onSelectVariantInRow,
}: BlocksPanelProps) {
  return (
    <div className="flex flex-col w-full h-screen bg-slate-50 dark:bg-transparent">
      {/* 상단 툴바 */}
      <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-black/30 dark:backdrop-blur-xl border-b border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack} className="dark:border-white/15 dark:text-white/70 dark:hover:text-white dark:hover:border-white/30 dark:bg-transparent">
            ← 뒤로
          </Button>
          <div>
            <h1 className="text-base font-bold text-gray-800 dark:text-white">
              {draft.specs.length}블록 구조
            </h1>
            <p className="text-xs text-gray-500 dark:text-white/50">
              {draft.totalActs}막 ·{' '}
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {draft.densityId}
              </span>{' '}
              밀도 · 카드를 클릭하면 상세 편집
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 밀도 뱃지 */}
          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30 px-2.5 py-1 rounded-full font-medium">
            {draft.densityId}
          </span>

          {/* 상세 생성 카운트 */}
          <span className="text-xs text-gray-500 dark:text-white/40">
            상세 생성:{' '}
            <span
              className={
                canGenerateDetail
                  ? 'text-green-600 dark:text-green-400 font-medium'
                  : 'text-red-500 dark:text-red-400 font-medium'
              }
            >
              {detailGenCount}
            </span>
            /{policy.maxDetailGenerationsPerSession}
          </span>

          {/* 내보내기 (준비 중) */}
          <Button size="sm" disabled className="dark:bg-white/5 dark:text-white/30 dark:border-white/10">
            내보내기 (준비 중)
          </Button>
        </div>
      </div>

      {/* React Flow 캔버스 — 나머지 공간 전체 사용 */}
      <div className="flex-1 min-h-0">
        <BlocksCanvas
          draft={draft}
          onUpdateDraft={onUpdateDraft}
          policy={policy}
          detailGenCount={detailGenCount}
          canGenerateDetail={canGenerateDetail}
          isCoolingDown={isCoolingDown}
          onRegenerateOverview={onRegenerateOverview}
          onExpandOverview={onExpandOverview}
          onGenerateDetail={onGenerateDetail}
          onExpandDetail={onExpandDetail}
          onInsertAfterBlock={onInsertAfterBlock}
          selectedVariantIdByRow={selectedVariantIdByRow}
          onSelectVariantInRow={onSelectVariantInRow}
        />
      </div>
    </div>
  );
}
