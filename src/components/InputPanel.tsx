/**
 * InputPanel.tsx
 *
 * 스토리 아이디어 입력 폼
 * - OptionGroup 기반 자동 렌더링
 * - localStorage 자동 저장/복원
 * - Seed 기반 랜덤 생성
 * - Two-column layout: options (left) + preview (right)
 */

"use client";

import { useEffect, useState } from "react";
import type { IdeaFormState } from "@/types/form";
import type { ToneKey } from "@/types/options";
import { OptionSelect } from "./OptionSelect";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Check, Shuffle, Sparkles } from "lucide-react";
import { AppHeader } from "./AppHeader";
import { Chip } from "./Chip";
import {
  ALL_OPTION_GROUPS,
  MOTIF_OPTIONS,
  WORLD_OPTIONS,
  CHARACTER_OPTIONS,
  PLOT_OPTIONS,
} from "@/data/options";
import {
  seededRandom,
  weightedRandom,
  shuffle,
  generateSeed,
} from "@/lib/random";

const STORAGE_KEY = "story-forge:idea-form";

const INITIAL_STATE: IdeaFormState = {
  tone: "light",
  realism: 50,
};

export interface InputPanelProps {
  onGenerate?: (form: IdeaFormState) => void;
}

export function InputPanel({ onGenerate }: InputPanelProps = {}) {
  const [form, setForm] = useState<IdeaFormState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);

  // localStorage 복원 (1회만)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setForm(parsed);
      } catch (e) {
        console.error("Failed to parse saved form", e);
      }
    }
    setHydrated(true);
  }, []);

  // localStorage 자동 저장
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form, hydrated]);

  // 폼 필드 업데이트
  const updateField = <K extends keyof IdeaFormState>(
    key: K,
    value: IdeaFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // 톤 변경
  const setTone = (tone: ToneKey) => updateField("tone", tone);

  // 리얼리즘 변경
  const setRealism = (value: number[]) => updateField("realism", value[0]);

  // 랜덤 생성 (영역별)
  const randomize = (scope: "all" | "world" | "character" | "plot" | "motifs") => {
    const seed = form.seed ?? generateSeed();
    const rng = seededRandom(seed);

    const updates: Partial<IdeaFormState> = { seed };

    if (scope === "all" || scope === "world") {
      WORLD_OPTIONS.forEach((group) => {
        const selected = weightedRandom(group.options, rng);
        if (selected) {
          updates[group.id as keyof IdeaFormState] = selected.key as any;
        }
      });
    }

    if (scope === "all" || scope === "character") {
      CHARACTER_OPTIONS.forEach((group) => {
        const selected = weightedRandom(group.options, rng);
        if (selected) {
          updates[group.id as keyof IdeaFormState] = selected.key as any;
        }
      });
    }

    if (scope === "all" || scope === "plot") {
      PLOT_OPTIONS.forEach((group) => {
        const selected = weightedRandom(group.options, rng);
        if (selected) {
          updates[group.id as keyof IdeaFormState] = selected.key as any;
        }
      });
    }

    if (scope === "all" || scope === "motifs") {
      const shuffled = shuffle(MOTIF_OPTIONS.options, rng);
      updates.motifs_ranked = shuffled.slice(0, 5).map((opt) => opt.key);
    }

    setForm((prev) => ({ ...prev, ...updates }));
  };

  if (!hydrated) {
    return <div className="p-4">로딩 중...</div>;
  }

  // Count selected options for preview
  const selectedCount = [
    form.world_setting,
    form.world_era,
    form.world_scale,
    form.character_protagonist,
    form.character_count,
    form.character_relationship,
    form.plot_structure,
    form.plot_conflict,
    form.plot_ending,
    ...(form.motifs_ranked || []),
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AppHeader currentStep={{ id: "idea", label: "Idea" }} />

      {/* Page content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
            Generate Story Ideas
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Configure your story parameters and generate two unique logline candidates to explore.
          </p>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left column: Story Options */}
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Story Options</h2>

              {/* Tone */}
              <div className="mb-6 space-y-2">
                <label className="text-sm font-medium text-gray-700">Tone</label>
                <div className="flex gap-2">
                  {(["light", "hard", "bleak"] as ToneKey[]).map((tone) => (
                    <Button
                      key={tone}
                      variant={form.tone === tone ? "default" : "outline"}
                      onClick={() => setTone(tone)}
                      size="sm"
                      className={form.tone === tone ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {tone === "light" ? "Light" : tone === "hard" ? "Hard" : "Bleak"}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Realism Intensity */}
              <div className="mb-6 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Realism Intensity</label>
                  <span className="text-sm text-gray-500">{form.realism} / 100</span>
                </div>
                <Slider
                  value={[form.realism]}
                  onValueChange={setRealism}
                  min={0}
                  max={100}
                  step={1}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Gritty</span>
                  <span>Balanced</span>
                </div>
              </div>

              {/* Seed (Optional) */}
              <div className="mb-6 space-y-2">
                <label className="text-sm font-medium text-gray-700">Seed Text (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter a seed phrase..."
                    value={typeof form.seed === "number" ? String(form.seed) : form.seed || ""}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      updateField("seed", val ? Number(val) || undefined : undefined);
                    }}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => randomize("all")}
                    className="flex items-center gap-1.5"
                  >
                    <Shuffle className="h-4 w-4" />
                    Random
                  </Button>
                </div>
              </div>

              {/* Option groups */}
              <div className="space-y-4">
                {ALL_OPTION_GROUPS.map((group) => (
                  <OptionSelect
                    key={group.id}
                    group={group}
                    value={form[group.id as keyof IdeaFormState] as string | undefined}
                    onChange={(value) =>
                      updateField(group.id as keyof IdeaFormState, value as any)
                    }
                  />
                ))}
              </div>

              {/* Motifs */}
              <div className="mt-6 space-y-2">
                <label className="text-sm font-medium text-gray-700">{MOTIF_OPTIONS.label}</label>
                {form.motifs_ranked && form.motifs_ranked.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {form.motifs_ranked.map((key) => {
                      const option = MOTIF_OPTIONS.options.find((opt) => opt.key === key);
                      return option ? (
                        <Chip key={key} variant="default">
                          {option.label}
                        </Chip>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Use random buttons to select motifs</p>
                )}
              </div>

              {/* Advanced Options (collapsed) */}
              <details className="mt-6">
                <summary className="cursor-pointer text-sm font-medium text-gray-700">
                  ↓ Advanced Options
                </summary>
                <div className="mt-4 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" onClick={() => randomize("world")} size="sm">
                      <Shuffle className="mr-1.5 h-3.5 w-3.5" />
                      World
                    </Button>
                    <Button variant="ghost" onClick={() => randomize("character")} size="sm">
                      <Shuffle className="mr-1.5 h-3.5 w-3.5" />
                      Character
                    </Button>
                    <Button variant="ghost" onClick={() => randomize("plot")} size="sm">
                      <Shuffle className="mr-1.5 h-3.5 w-3.5" />
                      Plot
                    </Button>
                    <Button variant="ghost" onClick={() => randomize("motifs")} size="sm">
                      <Shuffle className="mr-1.5 h-3.5 w-3.5" />
                      Motifs
                    </Button>
                  </div>
                </div>
              </details>
            </div>

            {/* Generate button */}
            {onGenerate && (
              <Button
                onClick={() => onGenerate(form)}
                className="w-full bg-green-600 py-6 text-base hover:bg-green-700"
                size="lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Generate 2 Logline Candidates
              </Button>
            )}
          </div>

          {/* Right column: Generation Preview */}
          <div>
            <div className="sticky top-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                  <Sparkles className="h-4 w-4 text-gray-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Generation Preview</h2>
              </div>

              <p className="mb-6 text-sm text-gray-600">
                Based on your selected options, we'll generate:
              </p>

              {/* Generation checklist */}
              <div className="mb-6 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Two unique story loglines</p>
                    <p className="text-xs text-gray-500">Distinct narrative hooks to choose from</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Synopsis for each candidate</p>
                    <p className="text-xs text-gray-500">Brief narrative summary</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Genre & theme tags</p>
                    <p className="text-xs text-gray-500">Auto-detected story elements</p>
                  </div>
                </div>
              </div>

              {/* Current Configuration */}
              <div className="rounded-md bg-gray-50 p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-700">
                  Current Configuration
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tone:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {form.tone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Realism:</span>
                    <span className="font-medium text-gray-900">{form.realism} / 10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">World:</span>
                    <span className="font-medium text-gray-900">
                      {form.world_setting || "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Character:</span>
                    <span className="font-medium text-gray-900">
                      {form.character_protagonist || "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plot:</span>
                    <span className="font-medium text-gray-900">
                      {form.plot_structure || "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Motifs:</span>
                    <span className="font-medium text-gray-900">
                      {form.motifs_ranked?.length || 0} selected
                    </span>
                  </div>
                </div>
              </div>

              {/* Last Generation */}
              <div className="mt-6 rounded-md border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-700">
                  Last Generation
                </h3>
                <p className="text-sm text-gray-600">No generations yet in this session.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
