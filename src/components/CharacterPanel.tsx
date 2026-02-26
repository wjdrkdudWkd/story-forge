"use client";

/**
 * CharacterPanel.tsx — 캐릭터 페르소나 설정 단계
 * Light / Dark 양쪽 지원 + 공통 AppHeader 사용
 */

import { useState, useEffect } from "react";
import type { IdeaCandidate } from "@/types/idea";
import type {
  CharacterProfile,
  CharacterState,
  CharacterSuggestion,
  CharacterTrait,
} from "@/types/character";
import { AppHeader } from "./AppHeader";

export interface CharacterPanelProps {
  candidate: IdeaCandidate;
  suggestions: CharacterSuggestion[];
  onConfirm: (state: CharacterState) => void;
  onBack: () => void;
}

/* ── 역할별 스타일 (light / dark) ── */
const ROLE_CONFIG: Record<string, {
  label: string; icon: string;
  headerBg: string; badgeCls: string;
  selBorder: string; selBg: string;
  cardBorder: string;
}> = {
  protagonist: {
    label: "주인공", icon: "🌟",
    headerBg:  "bg-blue-50 dark:bg-blue-500/10",
    badgeCls:  "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30",
    selBorder: "border-blue-500",
    selBg:     "bg-blue-50 dark:bg-blue-500/10",
    cardBorder:"border-blue-200 dark:border-blue-500/25",
  },
  antagonist: {
    label: "반동인물", icon: "🌑",
    headerBg:  "bg-red-50 dark:bg-red-500/10",
    badgeCls:  "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30",
    selBorder: "border-red-500",
    selBg:     "bg-red-50 dark:bg-red-500/10",
    cardBorder:"border-red-200 dark:border-red-500/25",
  },
  supporter: {
    label: "조력자", icon: "🤝",
    headerBg:  "bg-green-50 dark:bg-green-500/10",
    badgeCls:  "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30",
    selBorder: "border-green-500",
    selBg:     "bg-green-50 dark:bg-green-500/10",
    cardBorder:"border-green-200 dark:border-green-500/25",
  },
  other: {
    label: "기타", icon: "👤",
    headerBg:  "bg-gray-50 dark:bg-white/5",
    badgeCls:  "bg-gray-100 text-gray-700 border-gray-200 dark:bg-white/8 dark:text-white/60 dark:border-white/12",
    selBorder: "border-gray-400",
    selBg:     "bg-gray-50 dark:bg-white/5",
    cardBorder:"border-gray-200 dark:border-white/12",
  },
};
const getRoleCfg = (r: string) => ROLE_CONFIG[r] ?? ROLE_CONFIG.other;

/* ── 단일 캐릭터 카드 ── */
function CharacterCard({
  suggestion,
  profile,
  onChange,
}: {
  suggestion: CharacterSuggestion;
  profile: CharacterProfile;
  onChange: (p: CharacterProfile) => void;
}) {
  const cfg = getRoleCfg(suggestion.role);
  const isSel = (t: CharacterTrait) =>
    profile.selectedFlaw === t.flaw && profile.selectedDesire === t.desire;

  const inputCls = "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-white/12 dark:bg-white/6 dark:text-white/80 dark:placeholder:text-white/30";

  return (
    <div className={`rounded-lg border bg-white shadow-sm overflow-hidden dark:bg-white/[0.06] dark:backdrop-blur-xl dark:shadow-xl dark:shadow-black/25 ${cfg.cardBorder}`}>
      {/* 헤더 */}
      <div className={`flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-white/8 ${cfg.headerBg}`}>
        <span className="text-xl">{cfg.icon}</span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.badgeCls}`}>
          {cfg.label}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* 기본 정보 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-white/50 mb-1.5">이름</label>
            <input type="text" value={profile.name} placeholder={suggestion.defaultName}
              onChange={(e) => onChange({ ...profile, name: e.target.value })}
              className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-white/50 mb-1.5">나이</label>
            <input type="text" value={profile.age ?? ""} placeholder="예: 32세"
              onChange={(e) => onChange({ ...profile, age: e.target.value })}
              className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-white/50 mb-1.5">한 줄 성격 묘사</label>
          <input type="text" value={profile.description} placeholder={suggestion.defaultDescription}
            onChange={(e) => onChange({ ...profile, description: e.target.value })}
            className={inputCls} />
        </div>

        {/* AI 추천 trait */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-gray-700 dark:text-white/70">✨ AI 추천 — 핵심결함 &amp; 욕망</span>
            <span className="text-xs text-gray-400 dark:text-white/40">하나를 선택하세요</span>
          </div>
          <div className="space-y-2">
            {suggestion.traits.map((trait) => {
              const selected = isSel(trait);
              return (
                <button
                  key={trait.id}
                  onClick={() => onChange({ ...profile, selectedFlaw: trait.flaw, selectedDesire: trait.desire })}
                  className={[
                    "w-full text-left rounded-lg border px-4 py-3 transition-all duration-150",
                    selected
                      ? `${cfg.selBorder} ${cfg.selBg}`
                      : "border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-white/3 dark:hover:border-white/20 dark:hover:bg-white/6",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${cfg.badgeCls}`}>
                          {trait.label}
                        </span>
                        {selected && <span className="text-xs text-green-600 dark:text-green-400 font-semibold">✓ 선택됨</span>}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-white/55">
                        <span className="font-semibold text-gray-800 dark:text-white/75">결함</span> {trait.flaw}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-white/55">
                        <span className="font-semibold text-gray-800 dark:text-white/75">욕망</span> {trait.desire}
                      </p>
                    </div>
                    <div className={[
                      "w-4 h-4 rounded-full border-2 flex-shrink-0 mt-1 transition-colors",
                      selected ? "border-green-500 bg-green-500" : "border-gray-300 dark:border-white/25",
                    ].join(" ")} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 메인 컴포넌트 ── */
export function CharacterPanel({ candidate, suggestions, onConfirm, onBack }: CharacterPanelProps) {
  const [profiles, setProfiles] = useState<CharacterProfile[]>(() =>
    suggestions.map((s, i) => ({
      id: `char-${i}-${s.role}`, role: s.role,
      name: s.defaultName, age: "",
      description: s.defaultDescription,
      selectedFlaw: s.traits[0]?.flaw ?? "",
      selectedDesire: s.traits[0]?.desire ?? "",
    }))
  );

  useEffect(() => {
    setProfiles(suggestions.map((s, i) => ({
      id: `char-${i}-${s.role}`, role: s.role,
      name: s.defaultName, age: "",
      description: s.defaultDescription,
      selectedFlaw: s.traits[0]?.flaw ?? "",
      selectedDesire: s.traits[0]?.desire ?? "",
    })));
  }, [suggestions]);

  const updateProfile = (i: number, p: CharacterProfile) =>
    setProfiles((prev) => prev.map((x, j) => (j === i ? p : x)));

  const allSelected = profiles.every((p) => p.selectedFlaw);

  return (
    <div className="min-h-screen bg-white dark:bg-transparent transition-colors duration-200">
      <AppHeader currentStep={{ id: "character", label: "Character" }} />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* 확정된 로그라인 */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/30 dark:bg-blue-500/10">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">
            ✓ 확정된 아이디어
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white/90 leading-relaxed">
            {candidate.logline}
          </p>
          {candidate.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {candidate.tags.slice(0, 5).map((tag) => (
                <span key={tag} className="text-xs bg-white/80 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/25">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 제목 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">등장인물의 내면을 설정하세요</h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-white/50">
            캐릭터의 핵심 결함과 욕망을 설정하면 서사의 개연성이 높아집니다.
          </p>
        </div>

        {/* 캐릭터 카드 */}
        <div className="space-y-5">
          {suggestions.map((s, i) => (
            <CharacterCard
              key={s.role}
              suggestion={s}
              profile={profiles[i] ?? {
                id: `char-${i}`, role: s.role,
                name: s.defaultName, age: "",
                description: s.defaultDescription,
                selectedFlaw: "", selectedDesire: "",
              }}
              onChange={(p) => updateProfile(i, p)}
            />
          ))}
        </div>

        {/* 경고 */}
        {!allSelected && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            모든 캐릭터에 대해 핵심결함 &amp; 욕망 조합을 선택해 주세요.
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3 pb-8">
          <button
            onClick={onBack}
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors dark:border-white/12 dark:text-white/60 dark:hover:border-white/25 dark:hover:text-white"
          >
            ← 아이디어로 돌아가기
          </button>
          <button
            onClick={() => onConfirm({ characters: profiles })}
            disabled={!allSelected}
            className="flex-1 rounded-lg bg-green-500 hover:bg-green-600 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            캐릭터 설정 완료 — 구조 선택하기 →
          </button>
        </div>
      </div>
    </div>
  );
}
