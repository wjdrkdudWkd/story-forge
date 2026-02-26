"use client";

/**
 * OptionSelect.tsx — Light / Dark 테마 지원
 */

import type { OptionGroup } from "@/types/options";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface OptionSelectProps {
  group: OptionGroup;
  value?: string;
  onChange: (value: string) => void;
}

export function OptionSelect({ group, value, onChange }: OptionSelectProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700 dark:text-white/60">
        {group.label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-white border-gray-300 text-gray-900 hover:border-gray-400 dark:bg-white/6 dark:border-white/12 dark:text-white/80 dark:hover:border-white/25 transition-colors">
          <SelectValue placeholder={`Select ${group.label.toLowerCase()}...`} />
        </SelectTrigger>
        <SelectContent className="z-[9999] bg-white border-gray-200 text-gray-900 dark:bg-gray-900 dark:border-white/12 dark:text-white">
          {group.options.map((option) => (
            <SelectItem key={option.key} value={option.key}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
