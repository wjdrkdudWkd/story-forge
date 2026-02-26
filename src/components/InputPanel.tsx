"use client";

/**
 * InputPanel.tsx — Idea 단계
 * Light (레퍼런스 기준) / Dark 양쪽 지원
 */

import { useEffect, useState } from "react";
import type { IdeaFormState } from "@/types/form";
import type { ToneKey } from "@/types/options";
import { OptionSelect } from "./OptionSelect";
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
import { seededRandom, weightedRandom, shuffle, generateSeed } from "@/lib/random";

const STORAGE_KEY = "story-forge:idea-form";
const INITIAL_STATE: IdeaFormState = { tone: "light", realism: 50 };

export interface InputPanelProps {
  onGenerate?: (form: IdeaFormState) => void;
}

export function InputPanel({ onGenerate }: InputPanelProps = {}) {
  const [form, setForm] = useState<IdeaFormState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setForm(JSON.parse(saved)); } catch {}
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form, hydrated]);

  const updateField = <K extends keyof IdeaFormState>(k: K, v: IdeaFormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const randomize = (scope: "all" | "world" | "character" | "plot" | "motifs") => {
    const seed = form.seed ?? generateSeed();
    const rng = seededRandom(seed);
    const upd: Partial<IdeaFormState> = { seed };
    const apply = (groups: typeof WORLD_OPTIONS) =>
      groups.forEach((g) => {
        const sel = weightedRandom(g.options, rng);
        if (sel) upd[g.id as keyof IdeaFormState] = sel.key as any;
      });
    if (scope === "all" || scope === "world") apply(WORLD_OPTIONS);
    if (scope === "all" || scope === "character") apply(CHARACTER_OPTIONS);
    if (scope === "all" || scope === "plot") apply(PLOT_OPTIONS);
    if (scope === "all" || scope === "motifs") {
      upd.motifs_ranked = shuffle(MOTIF_OPTIONS.options, rng).slice(0, 5).map((o) => o.key);
    }
    setForm((p) => ({ ...p, ...upd }));
  };

  if (!hydrated) return null;

  const selectedCount = [
    form.world_setting, form.world_era, form.world_scale,
    form.character_protagonist, form.character_count, form.character_relationship,
    form.plot_structure, form.plot_conflict, form.plot_ending,
    ...(form.motifs_ranked ?? []),
  ].filter(Boolean).length;

  const card = "rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/[0.12] dark:bg-white/[0.06] dark:backdrop-blur-xl dark:shadow-xl dark:shadow-black/25";
  const lb = "text-sm font-medium text-gray-700 dark:text-white/60";
  const mu = "text-sm text-gray-500 dark:text-white/40";

  return (
    <div className="min-h-screen bg-white dark:bg-transparent transition-colors duration-200">
      <AppHeader currentStep={{ id: "idea", label: "Idea" }} />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Generate Story Ideas
          </h1>
          <p className={`mt-2 ${mu}`}>
            Configure your story parameters and generate two unique logline candidates to explore.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* 왼쪽 */}
          <div className="space-y-6">
            <div className={`${card} p-6`}>
              <h2 className="mb-5 text-base font-semibold text-gray-900 dark:text-white">Story Options</h2>

              {/* Tone */}
              <div className="mb-5 space-y-2">
                <p className={lb}>Tone</p>
                <div className="flex gap-2">
                  {(["light", "hard", "bleak"] as ToneKey[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => updateField("tone", t)}
                      className={[
                        "rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-all",
                        form.tone === t
                          ? "bg-green-500 text-white"
                          : "border border-gray-200 text-gray-700 hover:border-gray-300 dark:border-white/12 dark:text-white/60 dark:hover:border-white/25",
                      ].join(" ")}
                    >
                      {t === "light" ? "Light" : t === "hard" ? "Hard" : "Bleak"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Realism */}
              <div className="mb-5 space-y-2">
                <div className="flex items-center justify-between">
                  <p className={lb}>Realism Intensity</p>
                  <span className={mu}>{form.realism} / 100</span>
                </div>
                <Slider
                  value={[form.realism]}
                  onValueChange={(v) => updateField("realism", v[0])}
                  min={0} max={100} step={1} className="py-2"
                />
                <div className="flex justify-between text-xs text-gray-400 dark:text-white/30">
                  <span>Gritty</span><span>Balanced</span>
                </div>
              </div>

              {/* Seed */}
              <div className="mb-5 space-y-2">
                <p className={lb}>Seed Text (Optional)</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter a seed phrase..."
                    value={typeof form.seed === "number" ? String(form.seed) : form.seed ?? ""}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      updateField("seed", v ? Number(v) || undefined : undefined);
                    }}
                    className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-white/12 dark:bg-white/6 dark:text-white/80 dark:placeholder:text-white/30"
                  />
                  <button
                    onClick={() => randomize("all")}
                    className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors dark:border-white/12 dark:text-white/50 dark:hover:border-white/25 dark:hover:text-white"
                  >
                    <Shuffle className="h-3.5 w-3.5" /> Random
                  </button>
                </div>
              </div>

              {/* Option groups */}
              <div className="space-y-4">
                {ALL_OPTION_GROUPS.map((group) => (
                  <OptionSelect
                    key={group.id}
                    group={group}
                    value={form[group.id as keyof IdeaFormState] as string | undefined}
                    onChange={(v) => updateField(group.id as keyof IdeaFormState, v as any)}
                  />
                ))}
              </div>

              {/* Motifs */}
              <div className="mt-5 space-y-2">
                <p className={lb}>{MOTIF_OPTIONS.label}</p>
                {form.motifs_ranked?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {form.motifs_ranked.map((key) => {
                      const opt = MOTIF_OPTIONS.options.find((o) => o.key === key);
                      return opt ? <Chip key={key}>{opt.label}</Chip> : null;
                    })}
                  </div>
                ) : (
                  <p className={mu}>Use random buttons to select motifs</p>
                )}
              </div>

              {/* Advanced */}
              <details className="mt-5">
                <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-white/40 dark:hover:text-white/70 transition-colors">
                  ↓ Advanced Options
                </summary>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["world", "character", "plot", "motifs"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => randomize(s)}
                      className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors dark:border-white/10 dark:text-white/50 dark:hover:border-white/20 dark:hover:text-white"
                    >
                      <Shuffle className="h-3 w-3" />
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </details>
            </div>

            {onGenerate && (
              <button
                onClick={() => onGenerate(form)}
                className="w-full rounded-lg bg-green-500 hover:bg-green-600 py-3.5 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Generate 2 Logline Candidates
              </button>
            )}
          </div>

          {/* 오른쪽 */}
          <div>
            <div className={`sticky top-20 ${card} p-6`}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10">
                    <Sparkles className="h-4 w-4 text-gray-500 dark:text-white/60" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    Generation Preview
                  </h2>
                </div>
                <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-500/15 dark:text-green-300">
                  Ready
                </span>
              </div>

              <p className={`mb-5 ${mu}`}>Based on your selected options, we'll generate:</p>

              <div className="mb-5 space-y-3">
                {[
                  { t: "Two unique story loglines", d: "Distinct narrative hooks to choose from" },
                  { t: "Synopsis for each candidate", d: "Brief narrative summary" },
                  { t: "Genre & theme tags", d: "Auto-detected story elements" },
                ].map((item) => (
                  <div key={item.t} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white/80">{item.t}</p>
                      <p className="text-xs text-gray-500 dark:text-white/40">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-md bg-gray-50 p-4 dark:bg-white/[0.04] dark:border dark:border-white/[0.08]">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/40">
                  Current Configuration
                </h3>
                <div className="space-y-2 text-sm">
                  {[
                    { l: "Tone",      v: form.tone },
                    { l: "Realism",   v: `${form.realism} / 100` },
                    { l: "World",     v: form.world_setting ?? "Not selected" },
                    { l: "Character", v: form.character_protagonist ?? "Not selected" },
                    { l: "Plot",      v: form.plot_structure ?? "Not selected" },
                    { l: "Motifs",    v: `${form.motifs_ranked?.length ?? 0} selected` },
                  ].map((row) => (
                    <div key={row.l} className="flex justify-between">
                      <span className="text-gray-500 dark:text-white/40">{row.l}:</span>
                      <span className="font-medium capitalize text-gray-900 dark:text-white/70">{row.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (selectedCount / 9) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 dark:text-white/40">{selectedCount}/9</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
