"use client";

/**
 * OutputPanel.tsx — Compare Your Candidates
 * Light (레퍼런스 기준) / Dark 양쪽 지원
 */

import type { IdeaResult } from "@/types/idea";
import { AppHeader } from "./AppHeader";
import { Chip } from "./Chip";
import { RotateCcw, Check, Globe, Users, BookOpen, Target, Heart } from "lucide-react";

export interface OutputPanelProps {
  result: IdeaResult;
  onConfirm: (candidateIndex: number) => void;
  onBack?: () => void;
}

export function OutputPanel({ result, onConfirm, onBack }: OutputPanelProps) {
  const candidateIcons = [
    { icon: Target, label: "Goal-Driven",         accent: "text-blue-500 dark:text-blue-400",  iconBg: "bg-blue-50 dark:bg-blue-500/15" },
    { icon: Heart,  label: "Character-Focused",    accent: "text-pink-500 dark:text-pink-400",  iconBg: "bg-pink-50 dark:bg-pink-500/15" },
  ];

  const card = "flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/[0.12] dark:bg-white/[0.06] dark:backdrop-blur-xl dark:shadow-xl dark:shadow-black/25";

  return (
    <div className="min-h-screen bg-white dark:bg-transparent transition-colors duration-200">
      <AppHeader currentStep={{ id: "compare", label: "Compare" }} />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 제목 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Compare Your Candidates
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-white/50">
            Review the two generated loglines & synopses and choose the one that best resonates with your story vision.
          </p>
        </div>

        {/* 상단 chip row */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Chip icon={Check} variant="success">Idea</Chip>
          <Chip icon={Check} variant="success">Generated</Chip>
          <Chip icon={Globe}    variant="info">Cyberpunk</Chip>
          <Chip icon={Users}    variant="info">Antihero</Chip>
          <Chip icon={BookOpen} variant="info">Hero</Chip>
          <Chip icon={Target}   variant="info">Redemption</Chip>
          <Chip icon={Heart}    variant="info">Found Family</Chip>
        </div>

        {/* 후보 카드 */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {result.candidates.map((candidate, index) => {
            const ic = candidateIcons[index] ?? candidateIcons[0];
            const Icon = ic.icon;
            return (
              <div key={index} className={card}>
                {/* 카드 헤더 */}
                <div className="border-b border-gray-100 p-6 dark:border-white/8">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${ic.iconBg} ${ic.accent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900 dark:text-white">
                        Candidate {index + 1}
                      </h2>
                      <p className="text-xs text-gray-400 dark:text-white/40">{ic.label}</p>
                    </div>
                  </div>
                </div>

                {/* 카드 바디 */}
                <div className="flex-1 space-y-5 p-6">
                  <div>
                    <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/35">
                      Logline
                    </h3>
                    <p className="text-base font-medium leading-relaxed text-gray-900 dark:text-white/90">
                      {candidate.logline}
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/35">
                      Synopsis
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-600 dark:text-white/60">
                      {candidate.synopsis}
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/35">
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.tags.map((tag, i) => (
                        <Chip key={i}>{tag}</Chip>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 카드 푸터 */}
                <div className="border-t border-gray-100 p-6 dark:border-white/8">
                  <button
                    onClick={() => onConfirm(index)}
                    className="w-full rounded-lg bg-green-500 hover:bg-green-600 py-2.5 text-sm font-semibold text-white transition-colors"
                  >
                    Use this idea
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 하단 액션 */}
        {onBack && (
          <div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors dark:border-white/12 dark:text-white/60 dark:hover:border-white/25 dark:hover:text-white"
            >
              <RotateCcw className="h-4 w-4" />
              Regenerate Candidates
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
