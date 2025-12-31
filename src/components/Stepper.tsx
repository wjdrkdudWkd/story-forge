/**
 * Stepper.tsx
 *
 * Pill-based step navigation with chevrons
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
    <nav className="flex items-center justify-center gap-1">
      {steps.map((step, index) => {
        const isActive = currentStep?.id === step.id;
        const isPast =
          currentStep &&
          steps.findIndex((s) => s.id === currentStep.id) > index;

        return (
          <React.Fragment key={step.id}>
            {/* Step pill */}
            <div
              className={`
                rounded-full px-3 py-1 text-sm font-medium transition-colors
                ${
                  isActive
                    ? "bg-green-600 text-white"
                    : isPast
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                }
              `}
            >
              {step.label}
            </div>

            {/* Chevron separator (not after last step) */}
            {index < steps.length - 1 && (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
