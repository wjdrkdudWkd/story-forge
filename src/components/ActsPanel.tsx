/**
 * ActsPanel.tsx
 *
 * 5막 구조 결과 표시 컴포넌트
 * - Redesigned with 5-column grid layout
 * - Matches reference design system
 */

"use client";

import type { ActsResult } from "@/types/acts";
import { Button } from "./ui/button";
import { AppHeader } from "./AppHeader";
import { Chip } from "./Chip";
import { Check, ArrowRight } from "lucide-react";

export interface ActsPanelProps {
  actsResult: ActsResult;
  onBack: () => void;
  onGenerateBlocks: () => void;
}

export function ActsPanel({ actsResult, onBack, onGenerateBlocks }: ActsPanelProps) {
  const { acts, state } = actsResult;

  const actColors = [
    "bg-green-50 border-green-200",
    "bg-blue-50 border-blue-200",
    "bg-purple-50 border-purple-200",
    "bg-amber-50 border-amber-200",
    "bg-pink-50 border-pink-200",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AppHeader currentStep={{ id: "5-acts", label: "5 Acts" }} />

      {/* Page content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
            5-Act Outline
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Your story structure at a glance
          </p>
        </div>

        {/* Selected logline chip */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Chip icon={Check} variant="success">
              Selected Logline
            </Chip>
          </div>
          <p className="text-sm font-medium leading-relaxed text-gray-800">
            In a dying kingdom where magic bleeds from the earth, a reluctant hero must uncover forbidden knowledge to save their found family from a corrupt power that twists fate itself.
          </p>
        </div>

        {/* Story Structure heading */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Story Structure</h2>
        </div>

        {/* 5-column grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {acts.map((act, index) => {
            const colorClass = actColors[index] || actColors[0];

            return (
              <div
                key={act.key}
                className={`flex flex-col rounded-lg border p-4 ${colorClass}`}
              >
                {/* Act badge */}
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-gray-700">
                    {index + 1}
                  </div>
                  <Chip variant="default">
                    {act.key === "setup" ? "Act I - Setup" :
                     act.key === "progress" ? "Act II - Progress" :
                     act.key === "crisis" ? "Act III - Crisis" :
                     act.key === "climax" ? "Act IV - Climax" :
                     "Act V - Resolution"}
                  </Chip>
                </div>

                {/* Act content */}
                <div className="flex-1">
                  <h3 className="mb-2 text-sm font-semibold text-gray-800">
                    {act.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-gray-600">
                    {act.summary}
                  </p>
                  <p className="mt-3 text-xs italic text-gray-500">
                    Parent group's StoryBlock's hooks
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-6">
          <Button variant="outline" onClick={onBack}>
            [placeholder=left] Back to Compare
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              5-act outline ready
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={onGenerateBlocks}
            >
              Continue to 24-Blocks
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
