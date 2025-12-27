/**
 * BlocksPanel.tsx
 *
 * 24블록 메인 UI - Act별 그룹화, hover 액션, 클릭으로 상세 보기
 */

"use client";

import { useState } from "react";
import type {
  BlocksDraft,
  BlockNode,
  BlockIndex,
  BlockDetailVariant,
  BlockOverviewVariant,
  ExpandPreset,
} from "@/types/blocks";
import type { DetailPolicy } from "@/config/policy";
import { Button } from "./ui/button";
import { BlockDetailModal } from "./BlockDetailModal";
import { track } from "@/lib/track";

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
}: BlocksPanelProps) {
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<BlockIndex | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Act별로 블록 그룹화
  const blocksByAct = {
    1: [1, 2, 3, 4, 5, 6] as BlockIndex[],
    2: [7, 8, 9, 10, 11, 12] as BlockIndex[],
    3: [13, 14, 15, 16, 17, 18] as BlockIndex[],
    4: [19, 20, 21, 22, 23, 24] as BlockIndex[],
  };

  const handleBlockClick = (index: BlockIndex) => {
    // Track: 블록 열기
    track({
      name: "block_opened",
      meta: {
        index,
      },
    });

    setSelectedBlockIndex(index);
    setIsDetailModalOpen(true);
  };

  const handleSelectOverviewVariant = (index: BlockIndex, variantId: string) => {
    const node = draft.blocksByIndex[index];
    const updatedNode: BlockNode = {
      ...node,
      selectedOverviewId: variantId,
    };

    onUpdateDraft({
      ...draft,
      blocksByIndex: {
        ...draft.blocksByIndex,
        [index]: updatedNode,
      },
    });

    // Track: variant 선택
    track({
      name: "block_variant_selected",
      meta: {
        index,
        type: "overview",
        selectedId: variantId,
      },
    });
  };

  const handleSelectDetailVariant = (index: BlockIndex, variantId: string) => {
    const node = draft.blocksByIndex[index];
    const updatedNode: BlockNode = {
      ...node,
      selectedDetailId: variantId,
    };

    onUpdateDraft({
      ...draft,
      blocksByIndex: {
        ...draft.blocksByIndex,
        [index]: updatedNode,
      },
    });

    // Track: variant 선택
    track({
      name: "block_variant_selected",
      meta: {
        index,
        type: "detail",
        selectedId: variantId,
      },
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-gray-800">24블록 구조</h1>
        <p className="text-sm text-gray-600">
          각 블록을 클릭하면 상세 내용을 확인하고 편집할 수 있습니다.
        </p>
      </div>

      {/* Act 그룹별로 블록 표시 */}
      {[1, 2, 3, 4].map((act) => (
        <div key={act} className="space-y-3">
          <h2 className="text-base font-semibold text-gray-700">
            Act {act}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {blocksByAct[act as 1 | 2 | 3 | 4].map((index) => (
              <BlockCard
                key={index}
                node={draft.blocksByIndex[index]}
                spec={draft.specs.find((s) => s.index === index)!}
                onClick={() => handleBlockClick(index)}
                onRegenerate={() => onRegenerateOverview(index)}
                onExpand={(preset) => onExpandOverview(index, preset)}
                isCoolingDown={isCoolingDown(index)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* 디버그 정보 */}
      <details className="text-xs">
        <summary className="cursor-pointer text-gray-600">
          메모리 상태 (디버그)
        </summary>
        <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto text-gray-800">
          {JSON.stringify(draft.memory, null, 2)}
        </pre>
      </details>

      {/* 액션 버튼 */}
      <div className="pt-4 border-t border-gray-200 flex gap-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          ← 뒤로
        </Button>
        <Button className="flex-1" disabled>
          내보내기 (준비 중)
        </Button>
      </div>

      {/* 상세 모달 */}
      {selectedBlockIndex && (
        <BlockDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          node={draft.blocksByIndex[selectedBlockIndex]}
          spec={draft.specs.find((s) => s.index === selectedBlockIndex)!}
          memory={draft.memory}
          onSelectOverviewVariant={(variantId) =>
            handleSelectOverviewVariant(selectedBlockIndex, variantId)
          }
          onSelectDetailVariant={(variantId) =>
            handleSelectDetailVariant(selectedBlockIndex, variantId)
          }
          onGenerateDetail={() => onGenerateDetail(selectedBlockIndex)}
          onExpandDetail={(preset) => onExpandDetail(selectedBlockIndex, preset)}
          canGenerateDetail={canGenerateDetail}
          isCoolingDown={isCoolingDown(selectedBlockIndex)}
        />
      )}
    </div>
  );
}

// ============================================================================
// BlockCard Component
// ============================================================================

interface BlockCardProps {
  node: BlockNode;
  spec: any;
  onClick: () => void;
  onRegenerate: () => void;
  onExpand: (preset: ExpandPreset) => void;
  isCoolingDown: boolean;
}

function BlockCard({
  node,
  spec,
  onClick,
  onRegenerate,
  onExpand,
  isCoolingDown,
}: BlockCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [showPresetMenu, setShowPresetMenu] = useState(false);

  const selectedOverview = node.overviewVariants.find(
    (v) => v.id === node.selectedOverviewId
  )!;

  const presetOptions: { value: ExpandPreset; label: string }[] = [
    { value: "more_specific", label: "구체화" },
    { value: "raise_stakes", label: "위험 상승" },
    { value: "add_emotion", label: "감정 추가" },
    { value: "add_twist", label: "반전 추가" },
    { value: "add_dialogue", label: "대사 추가" },
  ];

  return (
    <div
      className="relative border border-gray-300 rounded p-3 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowPresetMenu(false);
      }}
      onClick={onClick}
    >
      {/* 블록 헤더 */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-800">
          {spec.index}. {spec.title}
        </h3>
        {node.overviewVariants.length > 1 && (
          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            v{node.overviewVariants.length}
          </span>
        )}
      </div>

      {/* 개요 헤드라인 */}
      <p className="text-sm text-gray-700 mb-2 line-clamp-2">
        {selectedOverview.headline}
      </p>

      {/* Hooks */}
      {selectedOverview.hooks.length > 0 && (
        <div className="space-y-1">
          {selectedOverview.hooks.map((hook, idx) => (
            <p key={idx} className="text-xs text-gray-500">
              → {hook}
            </p>
          ))}
        </div>
      )}

      {/* Hover 액션 버튼 */}
      {showActions && (
        <div className="absolute top-2 right-2 flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isCoolingDown) onRegenerate();
            }}
            className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isCoolingDown}
            title={isCoolingDown ? "잠시 후 다시 시도" : "다시 생성"}
          >
            🔄
          </button>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isCoolingDown) setShowPresetMenu(!showPresetMenu);
              }}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isCoolingDown}
              title={isCoolingDown ? "잠시 후 다시 시도" : "발전시키기"}
            >
              ✨
            </button>
            {showPresetMenu && !isCoolingDown && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 min-w-[120px]">
                {presetOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      onExpand(option.value);
                      setShowPresetMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-xs text-left hover:bg-gray-100"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
