"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SliderProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function Slider({
  value = [0],
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className,
}: SliderProps) {
  const currentValue = value[0] ?? 0;
  const percentage = ((currentValue - min) / (max - min)) * 100;

  return (
    <div className={cn("relative w-full", className)}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={(e) => onValueChange?.([Number(e.target.value)])}
        className="w-full h-2 bg-foreground/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:border-0"
      />
      <div className="flex justify-between mt-1 text-xs text-foreground/60">
        <span>{min}</span>
        <span>{currentValue}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
