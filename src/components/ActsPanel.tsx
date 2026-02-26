"use client";

/**
 * ActsPanel.tsx — 5 Acts 구조 확인
 * Light / Dark 양쪽 지원 + 공통 AppHeader 사용
 */

import type { ActsResult } from "@/types/acts";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { AppHeader } from "./AppHeader";

export interface ActsPanelProps {
  actsResult: ActsResult;
  actCount: number;
  densityId: string;
  logline?: string;
  onBack: () => void;
  onGenerateBlocks: () => void;
}

interface ActColor {
  border: string; bg: string;
  headerText: string; numBg: string; numText: string;
}

const ACT_CONFIGS: Record<number, { labels: string[]; roles: string[]; colors: ActColor[] }> = {
  3: {
    labels: ["Act Ⅰ — 발단", "Act Ⅱ — 전개 & 위기", "Act Ⅲ — 결말"],
    roles:  ["세계관 설정 · 주인공 소개", "갈등 심화 · 위기 고조", "절정 · 해소 · 여운"],
    colors: [
      { border:"border-blue-200 dark:border-blue-500/30",   bg:"bg-blue-50 dark:bg-blue-500/8",   headerText:"text-blue-700 dark:text-blue-300",   numBg:"bg-blue-100 dark:bg-blue-500/20",   numText:"text-blue-700 dark:text-blue-300"   },
      { border:"border-amber-200 dark:border-amber-500/30", bg:"bg-amber-50 dark:bg-amber-500/8", headerText:"text-amber-700 dark:text-amber-300", numBg:"bg-amber-100 dark:bg-amber-500/20", numText:"text-amber-700 dark:text-amber-300" },
      { border:"border-green-200 dark:border-green-500/30", bg:"bg-green-50 dark:bg-green-500/8", headerText:"text-green-700 dark:text-green-300", numBg:"bg-green-100 dark:bg-green-500/20", numText:"text-green-700 dark:text-green-300" },
    ],
  },
  4: {
    labels: ["Act Ⅰ — 발단", "Act Ⅱ — 전개", "Act Ⅲ — 위기", "Act Ⅳ — 결말"],
    roles:  ["세계관 · 주인공 소개", "갈등 시작 · 관계 형성", "위기 · 최저점", "절정 · 해소"],
    colors: [
      { border:"border-blue-200 dark:border-blue-500/30",   bg:"bg-blue-50 dark:bg-blue-500/8",   headerText:"text-blue-700 dark:text-blue-300",   numBg:"bg-blue-100 dark:bg-blue-500/20",   numText:"text-blue-700 dark:text-blue-300"   },
      { border:"border-green-200 dark:border-green-500/30", bg:"bg-green-50 dark:bg-green-500/8", headerText:"text-green-700 dark:text-green-300", numBg:"bg-green-100 dark:bg-green-500/20", numText:"text-green-700 dark:text-green-300" },
      { border:"border-amber-200 dark:border-amber-500/30", bg:"bg-amber-50 dark:bg-amber-500/8", headerText:"text-amber-700 dark:text-amber-300", numBg:"bg-amber-100 dark:bg-amber-500/20", numText:"text-amber-700 dark:text-amber-300" },
      { border:"border-red-200 dark:border-red-500/30",     bg:"bg-red-50 dark:bg-red-500/8",     headerText:"text-red-700 dark:text-red-300",     numBg:"bg-red-100 dark:bg-red-500/20",     numText:"text-red-700 dark:text-red-300"     },
    ],
  },
  5: {
    labels: ["Act Ⅰ — 발단", "Act Ⅱ — 전개", "Act Ⅲ — 위기", "Act Ⅳ — 절정", "Act Ⅴ — 결말"],
    roles:  ["세계관 · 소개", "갈등 시작", "위기 심화", "클라이맥스", "해소 · 여운"],
    colors: [
      { border:"border-blue-200 dark:border-blue-500/30",     bg:"bg-blue-50 dark:bg-blue-500/8",     headerText:"text-blue-700 dark:text-blue-300",     numBg:"bg-blue-100 dark:bg-blue-500/20",     numText:"text-blue-700 dark:text-blue-300"     },
      { border:"border-green-200 dark:border-green-500/30",   bg:"bg-green-50 dark:bg-green-500/8",   headerText:"text-green-700 dark:text-green-300",   numBg:"bg-green-100 dark:bg-green-500/20",   numText:"text-green-700 dark:text-green-300"   },
      { border:"border-purple-200 dark:border-purple-500/30", bg:"bg-purple-50 dark:bg-purple-500/8", headerText:"text-purple-700 dark:text-purple-300", numBg:"bg-purple-100 dark:bg-purple-500/20", numText:"text-purple-700 dark:text-purple-300" },
      { border:"border-orange-200 dark:border-orange-500/30", bg:"bg-orange-50 dark:bg-orange-500/8", headerText:"text-orange-700 dark:text-orange-300", numBg:"bg-orange-100 dark:bg-orange-500/20", numText:"text-orange-700 dark:text-orange-300" },
      { border:"border-pink-200 dark:border-pink-500/30",     bg:"bg-pink-50 dark:bg-pink-500/8",     headerText:"text-pink-700 dark:text-pink-300",     numBg:"bg-pink-100 dark:bg-pink-500/20",     numText:"text-pink-700 dark:text-pink-300"     },
    ],
  },
};

function getActConfig(n: number) { return ACT_CONFIGS[n] ?? ACT_CONFIGS[5]; }
function getGridCols(n: number) {
  if (n <= 3) return "md:grid-cols-3";
  if (n === 4) return "md:grid-cols-2 lg:grid-cols-4";
  return "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";
}
const DENSITY_LABELS: Record<string, string> = { compact:"간략", standard:"표준", detailed:"상세" };

export function ActsPanel({ actsResult, actCount, densityId, logline, onBack, onGenerateBlocks }: ActsPanelProps) {
  const { acts } = actsResult;
  const config = getActConfig(actCount);
  const gridCols = getGridCols(actCount);
  const densityLabel = DENSITY_LABELS[densityId] ?? densityId;

  return (
    <div className="min-h-screen bg-white dark:bg-transparent transition-colors duration-200">
      <AppHeader currentStep={{ id: "acts", label: "Acts" }} />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* 페이지 제목 + 뱃지 */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{actCount}막 개요</h1>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-white/50">
              이야기 구조를 확인하고 블록 캔버스로 이동하세요.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-semibold dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30">
              {densityLabel}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium dark:bg-white/8 dark:text-white/50">
              {actCount}막 구조
            </span>
          </div>
        </div>

        {/* 확정 로그라인 */}
        {logline && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/30 dark:bg-blue-500/10">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">
              ✓ 확정된 로그라인
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white/90 leading-relaxed">
              {logline}
            </p>
          </div>
        )}

        {/* 막 그리드 */}
        <div>
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/80 mb-4">이야기 구조</h2>
          <div className={`grid grid-cols-1 gap-4 ${gridCols}`}>
            {acts.map((act, index) => {
              const color = config.colors[index] ?? config.colors[0];
              const label = config.labels[index] ?? `Act ${index + 1}`;
              const role  = config.roles[index] ?? "";
              return (
                <div key={act.key} className={`flex flex-col rounded-lg border p-4 ${color.border} ${color.bg}`}>
                  <div className="mb-3 flex items-center gap-2">
                    <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${color.numBg} ${color.numText}`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${color.headerText} leading-tight`}>{label}</p>
                      <p className="text-[10px] text-gray-400 dark:text-white/30 leading-tight">{role}</p>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90 leading-snug">{act.title}</h3>
                    <p className="text-xs leading-relaxed text-gray-600 dark:text-white/55">{act.summary}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 하단 액션 */}
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-white/8 pt-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors dark:border-white/12 dark:text-white/60 dark:hover:border-white/25 dark:hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            구조 선택으로 돌아가기
          </button>
          <button
            onClick={onGenerateBlocks}
            className="flex items-center gap-2 rounded-lg bg-green-500 hover:bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            블록 캔버스 생성
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
