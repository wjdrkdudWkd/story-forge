/**
 * InputPanel.tsx
 *
 * 스토리 아이디어 입력 폼
 * - OptionGroup 기반 자동 렌더링
 * - localStorage 자동 저장/복원
 * - Seed 기반 랜덤 생성
 */

"use client";

import { useEffect, useState } from "react";
import type { IdeaFormState } from "@/types/form";
import type { ToneKey } from "@/types/options";
import { OptionSelect } from "./OptionSelect";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
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

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">스토리 아이디어 생성</h1>

      {/* 톤 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-800">톤</label>
        <div className="flex gap-2">
          {(["light", "hard", "bleak"] as ToneKey[]).map((tone) => (
            <Button
              key={tone}
              variant={form.tone === tone ? "default" : "outline"}
              onClick={() => setTone(tone)}
              size="sm"
            >
              {tone === "light"
                ? "밝음"
                : tone === "hard"
                ? "무거움"
                : "암울함"}
            </Button>
          ))}
        </div>
      </div>

      {/* 리얼리즘 슬라이더 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-800">리얼리즘</label>
        <Slider
          value={[form.realism]}
          onValueChange={setRealism}
          min={0}
          max={100}
          step={1}
        />
      </div>

      {/* 랜덤 버튼들 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-800">랜덤 생성</label>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => randomize("all")} size="sm">
            전체 랜덤
          </Button>
          <Button variant="ghost" onClick={() => randomize("world")} size="sm">
            세계관
          </Button>
          <Button variant="ghost" onClick={() => randomize("character")} size="sm">
            캐릭터
          </Button>
          <Button variant="ghost" onClick={() => randomize("plot")} size="sm">
            플롯
          </Button>
          <Button variant="ghost" onClick={() => randomize("motifs")} size="sm">
            모티프
          </Button>
        </div>
        {form.seed && (
          <p className="text-xs text-gray-600">Seed: {form.seed}</p>
        )}
      </div>

      {/* 자동 생성된 옵션 선택 필드들 */}
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

      {/* 모티프 우선순위 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-800">{MOTIF_OPTIONS.label}</label>
        <div className="text-sm text-gray-600">
          {form.motifs_ranked && form.motifs_ranked.length > 0 ? (
            <ol className="list-decimal list-inside space-y-1">
              {form.motifs_ranked.map((key) => {
                const option = MOTIF_OPTIONS.options.find(
                  (opt) => opt.key === key
                );
                return <li key={key} className="text-gray-700">{option?.label ?? key}</li>;
              })}
            </ol>
          ) : (
            <p className="text-gray-500">랜덤 생성 버튼을 눌러 모티프를 선택하세요</p>
          )}
        </div>
      </div>

      {/* 생성 버튼 */}
      {onGenerate && (
        <div className="pt-4 border-t border-gray-200">
          <Button
            className="w-full"
            onClick={() => onGenerate(form)}
          >
            아이디어 생성하기 →
          </Button>
        </div>
      )}

      {/* 디버그 정보 */}
      <details className="text-xs">
        <summary className="cursor-pointer text-foreground/60">
          현재 폼 상태 (디버그)
        </summary>
        <pre className="mt-2 p-2 bg-foreground/5 rounded overflow-auto">
          {JSON.stringify(form, null, 2)}
        </pre>
      </details>
    </div>
  );
}
