/**
 * OptionSelect.tsx
 *
 * OptionGroup을 받아 자동으로 Select UI를 렌더링합니다.
 */

"use client";

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
      <label className="text-sm font-medium text-gray-800">{group.label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={`${group.label} 선택`} />
        </SelectTrigger>
        <SelectContent>
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
