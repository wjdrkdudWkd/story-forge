/**
 * BlockDetailModal.tsx
 *
 * 블록 상세 모달 - 개요/상세 버전 선택, 상세 생성/재생성
 */

"use client";

import { useState, useEffect } from "react";
import type {
  BlockNode,
  BlockSpec,
  BlocksMemory,
  BlockDetailVariant,
  ExpandPreset,
} from "@/types/blocks";
import { Button } from "./ui/button";

export interface BlockDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: BlockNode;
  spec: BlockSpec;
  memory: BlocksMemory;
  onSelectOverviewVariant: (variantId: string) => void;
  onSelectDetailVariant: (variantId: string) => void;
  onGenerateDetail: (preset?: ExpandPreset) => Promise<BlockDetailVariant>;
}

export function BlockDetailModal({
  isOpen,
  onClose,
  node,
  spec,
  memory,
  onSelectOverviewVariant,
  onSelectDetailVariant,
  onGenerateDetail,
}: BlockDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"content" | "overview-versions" | "detail-versions">("content");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPresetMenu, setShowPresetMenu] = useState(false);

  const selectedOverview = node.overviewVariants.find(
    (v) => v.id === node.selectedOverviewId
  );
  const selectedDetail = node.selectedDetailId
    ? node.detailVariants.find((v) => v.id === node.selectedDetailId)
    : null;

  const hasDetail = node.detailVariants.length > 0;

  const presetOptions: { value: ExpandPreset; label: string }[] = [
    { value: "more_specific", label: "구체화" },
    { value: "raise_stakes", label: "위험 상승" },
    { value: "add_emotion", label: "감정 추가" },
    { value: "add_twist", label: "반전 추가" },
    { value: "add_dialogue", label: "대사 추가" },
  ];

  // 모달이 열릴 때 detail이 없으면 자동 생성
  useEffect(() => {
    if (isOpen && !hasDetail && !isGenerating) {
      handleGenerateDetail();
    }
  }, [isOpen, hasDetail]);

  const handleGenerateDetail = async (preset?: ExpandPreset) => {
    setIsGenerating(true);
    try {
      await onGenerateDetail(preset);
      if (preset) {
        // Preset으로 생성한 경우 버전 탭 자동 열기
        setActiveTab("detail-versions");
      }
    } catch (error) {
      alert("상세 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
      setShowPresetMenu(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {spec.index}. {spec.title}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{spec.purpose}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("content")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "content"
                ? "border-b-2 border-gray-800 text-gray-800"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            내용
          </button>
          <button
            onClick={() => setActiveTab("overview-versions")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "overview-versions"
                ? "border-b-2 border-gray-800 text-gray-800"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            개요 버전 ({node.overviewVariants.length})
          </button>
          <button
            onClick={() => setActiveTab("detail-versions")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "detail-versions"
                ? "border-b-2 border-gray-800 text-gray-800"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            상세 버전 ({node.detailVariants.length})
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "content" && (
            <div className="space-y-4">
              {/* 개요 */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">개요</h3>
                {selectedOverview && (
                  <>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {selectedOverview.headline}
                    </p>
                    {selectedOverview.hooks.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium text-gray-600">Hooks:</p>
                        {selectedOverview.hooks.map((hook, idx) => (
                          <p key={idx} className="text-xs text-gray-600 pl-2">
                            → {hook}
                          </p>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 상세 */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">상세 (Beat)</h3>
                  {hasDetail && (
                    <div className="relative">
                      <button
                        onClick={() => setShowPresetMenu(!showPresetMenu)}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                        disabled={isGenerating}
                      >
                        {isGenerating ? "생성 중..." : "+ 발전시키기"}
                      </button>
                      {showPresetMenu && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 min-w-[120px]">
                          {presetOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleGenerateDetail(option.value)}
                              className="w-full px-3 py-1.5 text-xs text-left hover:bg-gray-100"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {isGenerating ? (
                  <div className="text-sm text-gray-600">상세 내용을 생성하는 중...</div>
                ) : selectedDetail ? (
                  <>
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                      {selectedDetail.beat}
                    </p>
                    {selectedDetail.microHooks && selectedDetail.microHooks.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium text-gray-600">Micro Hooks:</p>
                        {selectedDetail.microHooks.map((hook, idx) => (
                          <p key={idx} className="text-xs text-gray-600 pl-2">
                            → {hook}
                          </p>
                        ))}
                      </div>
                    )}
                    {selectedDetail.preset && (
                      <div className="mt-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {selectedDetail.preset}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-500">상세 내용이 없습니다.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "overview-versions" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-600">
                개요 버전을 선택하면 해당 버전이 채택됩니다.
              </p>
              {node.overviewVariants.map((variant) => (
                <div
                  key={variant.id}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    variant.id === node.selectedOverviewId
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => onSelectOverviewVariant(variant.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {new Date(variant.createdAt).toLocaleString("ko-KR", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                        {variant.source}
                      </span>
                      {variant.note && (
                        <span className="text-xs text-blue-600">{variant.note}</span>
                      )}
                    </div>
                    {variant.id === node.selectedOverviewId && (
                      <span className="text-xs text-blue-600 font-medium">✓ 선택됨</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800">{variant.headline}</p>
                  {variant.hooks.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {variant.hooks.map((hook, idx) => (
                        <p key={idx} className="text-xs text-gray-600">
                          → {hook}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "detail-versions" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-600">
                상세 버전을 선택하면 해당 버전이 채택됩니다.
              </p>
              {node.detailVariants.length === 0 ? (
                <div className="text-sm text-gray-500">
                  아직 생성된 상세 버전이 없습니다.
                </div>
              ) : (
                node.detailVariants.map((variant) => (
                  <div
                    key={variant.id}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      variant.id === node.selectedDetailId
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => onSelectDetailVariant(variant.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {new Date(variant.createdAt).toLocaleString("ko-KR", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                          {variant.source}
                        </span>
                        {variant.preset && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                            {variant.preset}
                          </span>
                        )}
                      </div>
                      {variant.id === node.selectedDetailId && (
                        <span className="text-xs text-blue-600 font-medium">✓ 선택됨</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                      {variant.beat}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
}
