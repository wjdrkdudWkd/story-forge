/**
 * AppHeader.tsx
 *
 * Application header with wordmark and navigation stepper
 */

import React from "react";
import { Stepper, type Step } from "./Stepper";

export interface AppHeaderProps {
  currentStep?: Step;
}

const STEPS: Step[] = [
  { id: "idea", label: "Idea" },
  { id: "compare", label: "Compare" },
  { id: "5-acts", label: "5 Acts" },
  { id: "24-blocks", label: "24 Blocks" },
  { id: "write", label: "Write" },
];

export function AppHeader({ currentStep }: AppHeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Wordmark */}
        <div className="flex-shrink-0">
          <span className="text-lg font-semibold tracking-tight text-gray-900">
            story-forge
          </span>
        </div>

        {/* Stepper */}
        <div className="flex-1 px-8">
          <Stepper steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Auth stub (placeholder for future) */}
        <div className="flex-shrink-0">
          {/* Auth button will go here */}
        </div>
      </div>
    </header>
  );
}
