"use client";

/**
 * SelectionPanel.tsx — 구조/밀도 선택 단계
 * Light / Dark 양쪽 지원 + 공통 AppHeader 사용
 */

import { useState } from "react";
import type { IdeaCandidate } from "@/types/idea";
import type { DensityOption } from "@/types/blocks";
import { AppHeader } from "./AppHeader";

export interface SelectionPanelProps {
  candidate: IdeaCandidate;
  densityOptions: DensityOption[];
  defaultDensityId?: string;
  onConfirm: (densityId: string, actCount: number) => void;
  onBack: () => void;
}

interface PresetStyle {
  icon: string;
  borderColor: string; selectedBorder: string; selectedBg: string;
  badgeCls: string; blockColors: string[];
}

const PRESET_STYLES: Record<string, PresetStyle> = {
  compact: {
    icon: "⚡",
    borderColor:    "border-gray-200 dark:border-green-500/20",
    selectedBorder: "border-green-500",
    selectedBg:     "bg-green-50 dark:bg-green-500/10",
    badgeCls:       "bg-green-100 text-green-700 border border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30",
    blockColors:    ["#22c55e", "#16a34a", "#15803d"],
  },
  standard: {
    icon: "📖",
    borderColor:    "border-gray-200 dark:border-blue-500/20",
    selectedBorder: "border-blue-500",
    selectedBg:     "bg-blue-50 dark:bg-blue-500/10",
    badgeCls:       "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30",
    blockColors:    ["#3b82f6", "#2563eb", "#1d4ed8"],
  },
  detailed: {
    icon: "🎬",
    borderColor:    "border-gray-200 dark:border-purple-500/20",
    selectedBorder: "border-purple-500",
    selectedBg:     "bg-purple-50 dark:bg-purple-500/10",
    badgeCls:       "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30",
    blockColors:    ["#a855f7", "#9333ea", "#7c3aed"],
  },
};
const DEFAULT_STYLE: PresetStyle = {
  icon: "📋",
  borderColor: "border-gray-200 dark:border-white/12",
  selectedBorder: "border-gray-400",
  selectedBg: "bg-gray-50 dark:bg-white/5",
  badgeCls: "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-white/8 dark:text-white/60 dark:border-white/12",
  blockColors: ["#6b7280"],
};
const getStyle = (id: string) => PRESET_STYLES[id] ?? DEFAULT_STYLE;

export function SelectionPanel({
  candidate, densityOptions, defaultDensityId = "standard", onConfirm, onBack,
}: SelectionPanelProps) {
  const [selectedId, setSelectedId] = useState<string>(defaultDensityId);
  const selectedOption = densityOptions.find((o) => o.id === selectedId);

  return (
    <div className="min-h-screen bg-white dark:bg-transparent transition-colors duration-200">
      <AppHeader currentStep={{ id: "acts", label: "Acts" }} />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* 확정된 로그라인 */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/30 dark:bg-blue-500/10">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">
            ✓ 확정된 아이디어
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white/90 leading-relaxed">
            {candidate.logline}
          </p>
          {candidate.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {candidate.tags.slice(0, 5).map((tag) => (
                <span key={tag} className="text-xs bg-white/80 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/25">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 제목 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">이야기 구조를 선택하세요</h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-white/50">
            선택한 구조에 따라 막(Act)의 수와 블록 개수가 결정됩니다.
          </p>
        </div>

        {/* 프리셋 카드 목록 */}
        <div className="space-y-3">
          {densityOptions.map((option) => {
            const st = getStyle(option.id);
            const isSelected = option.id === selectedId;
            return (
              <button
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                className={[
                  "w-full text-left rounded-lg border p-5 transition-all duration-150 bg-white dark:bg-white/[0.06] dark:backdrop-blur-xl dark:shadow-lg dark:shadow-black/20",
                  isSelected
                    ? `${st.selectedBorder} ${st.selectedBg} shadow-sm`
                    : `${st.borderColor} hover:border-gray-300 dark:hover:border-white/20`,
                ].join(" ")}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl flex-shrink-0 mt-0.5">{st.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-semibold text-gray-900 dark:text-white">
                        {option.label}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.badgeCls}`}>
                        {option.actCount}막 / {option.blockCount}블록
                      </span>
                      {isSelected && (
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400 ml-auto">
                          ✓ 선택됨
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-gray-500 dark:text-white/50 leading-relaxed">
                      {option.description}
                    </p>

                    {/* 블록 프리뷰 */}
                    <div className="mt-3 flex items-center gap-1">
                      {Array.from({ length: option.actCount }).map((_, aIdx) => (
                        <div key={aIdx} className="flex gap-0.5">
                          {Array.from({ length: Math.round(option.blockCount / option.actCount) }).map((_, bIdx) => (
                            <div
                              key={bIdx}
                              className="h-2.5 rounded-sm"
                              style={{
                                width: Math.max(4, Math.min(10, 200 / option.blockCount)),
                                backgroundColor: isSelected
                                  ? st.blockColors[aIdx % st.blockColors.length]
                                  : "#d1d5db",
                                opacity: isSelected ? 0.85 : 0.5,
                              }}
                            />
                          ))}
                          {aIdx < option.actCount - 1 && <div className="w-px h-2.5 bg-gray-300 dark:bg-white/20 mx-0.5" />}
                        </div>
                      ))}
                      <span className="text-[10px] text-gray-400 dark:text-white/30 ml-1.5">
                        {option.blockCount}개 블록
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 요약 */}
        {selectedOption && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-white/8 dark:bg-white/3 dark:text-white/55">
            <span className="font-semibold text-gray-900 dark:text-white/80">{selectedOption.label}</span> 구조 ({selectedOption.actCount}막 / {selectedOption.blockCount}블록)로
            막 개요를 생성합니다. 이후 블록 캔버스에서 세부 편집이 가능합니다.
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3 pb-8">
          <button
            onClick={onBack}
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors dark:border-white/12 dark:text-white/60 dark:hover:border-white/25 dark:hover:text-white"
          >
            ← 아이디어로 돌아가기
          </button>
          <button
            onClick={() => selectedOption && onConfirm(selectedOption.id, selectedOption.actCount)}
            disabled={!selectedId}
            className="flex-1 rounded-lg bg-green-500 hover:bg-green-600 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {selectedOption ? `${selectedOption.actCount}막 개요 생성하기 →` : "구조를 선택하세요"}
          </button>
        </div>
      </div>
    </div>
  );
}
