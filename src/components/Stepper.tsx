"use client";

/**
 * Stepper.tsx
 *
 * Pill-based step navigation
 * Light: white bg, 현재 단계 초록 pill
 * Dark : 현재 단계 초록 pill, 나머지 흰 반투명
 */

import React from "react";
import { ChevronRight } from "lucide-react";

export type Step = {
  id: string;
  label: string;
};

export interface StepperProps {
  steps: Step[];
  currentStep?: Step;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <nav className="flex items-center gap-0.5">
      {steps.map((step, index) => {
        const isActive = currentStep?.id === step.id;
        const isPast =
          currentStep &&
          steps.findIndex((s) => s.id === currentStep.id) > index;

        return (
          <React.Fragment key={step.id}>
            {/* Step pill */}
            <span
              className={[
                "rounded-full px-3 py-1 text-xs font-semibold transition-all duration-150",
                isActive
                  ? "bg-green-500 text-white"
                  : isPast
                    ? /* light past */ "text-green-600 dark:text-green-400"
                    : /* light future */ "text-gray-400 dark:text-white/35",
              ].join(" ")}
            >
              {step.label}
            </span>

            {/* Chevron separator */}
            {index < steps.length - 1 && (
              <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-gray-300 dark:text-white/20" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
