/**
 * OutputPanel.tsx
 *
 * AI 생성 결과를 표시하고 후보 선택을 처리합니다.
 * - Redesigned with side-by-side card layout
 * - Matches reference design system
 */

"use client";

import type { IdeaResult } from "@/types/idea";
import { Button } from "./ui/button";
import { AppHeader } from "./AppHeader";
import { Chip } from "./Chip";
import { RotateCcw, Check, Lightbulb, Users, BookOpen, Globe, Target, Heart } from "lucide-react";

export interface OutputPanelProps {
  result: IdeaResult;
  onConfirm: (candidateIndex: number) => void;
  onBack?: () => void;
}

export function OutputPanel({ result, onConfirm, onBack }: OutputPanelProps) {
  // Icon mapping for candidate types
  const candidateIcons = [
    { icon: Target, label: "Goal-Driven", color: "text-blue-600" },
    { icon: Heart, label: "Character-Focused", color: "text-pink-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AppHeader currentStep={{ id: "compare", label: "Compare" }} />

      {/* Page content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
            Compare Your Candidates
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Review the two generated logline & synopsis below and choose the one that best resonates with your story vision.
          </p>
        </div>

        {/* Top chips row */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Chip icon={Check} variant="success">
            Idea
          </Chip>
          <Chip icon={Check} variant="success">
            Generated 3 times
          </Chip>
          <Chip icon={Globe} variant="info">
            Cyberpunk
          </Chip>
          <Chip icon={Users} variant="info">
            Antihero
          </Chip>
          <Chip icon={BookOpen} variant="info">
            Hero
          </Chip>
          <Chip icon={Target} variant="info">
            Redemption
          </Chip>
          <Chip icon={Heart} variant="info">
            Found Family
          </Chip>
        </div>

        {/* Candidate cards (side-by-side) */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {result.candidates.map((candidate, index) => {
            const iconData = candidateIcons[index] || candidateIcons[0];
            const Icon = iconData.icon;

            return (
              <div
                key={index}
                className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                {/* Card header */}
                <div className="border-b border-gray-200 p-6">
                  <div className="mb-3 flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 ${iconData.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {index + 1}
                      </h2>
                      <p className="text-xs text-gray-500">{iconData.label}</p>
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div className="flex-1 space-y-6 p-6">
                  {/* Logline */}
                  <div>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
                      Logline
                    </h3>
                    <p className="text-lg font-medium leading-relaxed text-gray-900">
                      {candidate.logline}
                    </p>
                  </div>

                  {/* Synopsis */}
                  <div>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
                      Synopsis
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-600">
                      {candidate.synopsis}
                    </p>
                  </div>

                  {/* Tags */}
                  <div>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {candidate.tags.map((tag, tagIndex) => (
                        <Chip key={tagIndex} variant="default">
                          {tag}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card footer (button) */}
                <div className="border-t border-gray-200 p-6">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => onConfirm(index)}
                  >
                    Use this idea
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-between">
          {onBack && (
            <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Regenerate Candidates
            </Button>
          )}
          <Button
            variant="default"
            className="ml-auto bg-green-600 hover:bg-green-700"
            onClick={() => onConfirm(0)}
          >
            Continue to 5 Acts Outline →
          </Button>
        </div>

        {/* [placeholder=left] Back to idea options */}
        <div className="mt-6 text-center text-sm text-gray-500">
          [placeholder=left] Back to Idea options
        </div>
      </div>
    </div>
  );
}
