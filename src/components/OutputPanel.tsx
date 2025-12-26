/**
 * OutputPanel.tsx
 *
 * AI 생성 결과를 표시하고 후보 선택을 처리합니다.
 */

"use client";

import type { IdeaResult } from "@/types/idea";
import { Button } from "./ui/button";

export interface OutputPanelProps {
  result: IdeaResult;
  onConfirm: (candidateIndex: number) => void;
  onBack?: () => void;
}

export function OutputPanel({ result, onConfirm, onBack }: OutputPanelProps) {
  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">아이디어 생성 완료</h1>
          <p className="text-sm text-foreground/60 mt-1">
            두 가지 아이디어 중 하나를 선택하세요
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← 다시 생성
          </Button>
        )}
      </div>

      {/* 후보 카드 2개 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {result.candidates.map((candidate, index) => (
          <div
            key={index}
            className="border border-border rounded-md p-6 space-y-4 bg-background"
          >
            {/* 카드 헤더 */}
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-foreground/80">
                아이디어 {index + 1}
              </h2>
              <span className="text-xs text-foreground/40">
                {index === 0 ? "목표 중심" : "관계/반전 중심"}
              </span>
            </div>

            {/* Logline */}
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-foreground/60 uppercase">
                Logline
              </h3>
              <p className="text-lg font-semibold leading-snug">
                {candidate.logline}
              </p>
            </div>

            {/* Synopsis */}
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-foreground/60 uppercase">
                Synopsis
              </h3>
              <p className="text-sm leading-relaxed text-foreground/80">
                {candidate.synopsis}
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-foreground/60 uppercase">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {candidate.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="inline-block px-2 py-1 text-xs rounded bg-foreground/10 text-foreground/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 확정 버튼 */}
            <div className="pt-4 border-t border-border">
              <Button
                className="w-full"
                onClick={() => onConfirm(index)}
              >
                이 아이디어로 진행 →
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* 디버그 정보 */}
      <details className="text-xs">
        <summary className="cursor-pointer text-foreground/60">
          생성 정보 (디버그)
        </summary>
        <div className="mt-2 p-4 bg-foreground/5 rounded space-y-2">
          <div>
            <strong>Seed:</strong> {result.state.seed}
          </div>
          <div>
            <strong>Tone:</strong> {result.state.tone}
          </div>
          <div>
            <strong>Realism:</strong> {result.state.realism ?? "N/A"}
          </div>
          <div>
            <strong>World:</strong>{" "}
            {result.state.world
              ? JSON.stringify(result.state.world)
              : "N/A"}
          </div>
          <div>
            <strong>Character:</strong>{" "}
            {result.state.character
              ? JSON.stringify(result.state.character)
              : "N/A"}
          </div>
          <div>
            <strong>Plot:</strong>{" "}
            {result.state.plot
              ? JSON.stringify(result.state.plot)
              : "N/A"}
          </div>
          <div>
            <strong>Motifs:</strong>{" "}
            {result.state.motifsRanked?.join(", ") ?? "N/A"}
          </div>
        </div>
      </details>
    </div>
  );
}
