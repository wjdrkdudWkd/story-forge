'use client';

/**
 * PreBuildModal.tsx — Infinite 모드 Pre-Build 단계
 *
 * 캔버스 진입 전 캐릭터 DNA + Seed Box 설정
 * • DNA: 이름 / 성격 / 핵심 목표 (AI 자동 생성 포함)
 * • Seed Box: 복선·핵심 아이템·사건 키워드 리스트
 */

import { useState } from 'react';
import { X, Plus, Tag, Sparkles, Loader2 } from 'lucide-react';

// ── 타입 ────────────────────────────────────────────────────────
export interface CharacterDNA {
  name: string;
  personality: string;
  goal: string;
}

export interface SeedItem {
  id: string;
  keyword: string;
  type: 'foreshadowing' | 'item' | 'event';
}

interface Props {
  onConfirm: (dna: CharacterDNA, seeds: SeedItem[]) => void;
  onCancel?: () => void;
  initialDna?: CharacterDNA;
  initialSeeds?: SeedItem[];
}

// ── 상수 ────────────────────────────────────────────────────────
const SEED_TYPE_LABELS: Record<SeedItem['type'], string> = {
  foreshadowing: '복선',
  item: '핵심 아이템',
  event: '사건',
};

const SEED_TYPE_COLORS: Record<SeedItem['type'], string> = {
  foreshadowing: 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  item: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  event: 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
};

// ── 목업 AI 자동 생성 ─────────────────────────────────────────
const DNA_PRESETS: CharacterDNA[] = [
  { name: '카렌',  personality: '냉철하고 계산적이지만 내면에 깊은 따뜻함을 감추고 있는', goal: '진실을 밝혀 과거의 죄를 속죄하고, 잃어버린 동생을 찾는 것' },
  { name: '루시아', personality: '충동적이고 직관적이며, 상처를 유머로 숨기는', goal: '무너진 세계에서 새로운 질서를 세우고 가족을 지키는 것' },
  { name: '타인',  personality: '차분하지만 날카로운 관찰력을 가진 외로운', goal: '자신이 만든 재앙의 결과물을 되돌리기 위해 시간을 거스르는 것' },
  { name: '노아',  personality: '원칙주의자이면서도 옳은 일을 위해선 규칙을 어기는', goal: '사라진 도시의 비밀을 밝혀 억울하게 희생된 사람들의 명예를 회복하는 것' },
];

// ── 컴포넌트 ────────────────────────────────────────────────────
export function PreBuildModal({ onConfirm, onCancel, initialDna, initialSeeds }: Props) {
  const [dna, setDna] = useState<CharacterDNA>(
    initialDna ?? { name: '', personality: '', goal: '' }
  );
  const [seeds, setSeeds] = useState<SeedItem[]>(initialSeeds ?? []);
  const [newKeyword, setNewKeyword] = useState('');
  const [seedType, setSeedType] = useState<SeedItem['type']>('foreshadowing');
  const [isGenerating, setIsGenerating] = useState(false);

  // ── AI 자동 생성 (목업) ───────────────────────────────────────
  const handleAutoGenDNA = async () => {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 1100));
    const preset = DNA_PRESETS[Math.floor(Math.random() * DNA_PRESETS.length)];
    setDna(preset);
    setIsGenerating(false);
  };

  // ── 씨앗 추가 ────────────────────────────────────────────────
  const handleAddSeed = () => {
    const kw = newKeyword.trim();
    if (!kw) return;
    setSeeds((prev) => [
      ...prev,
      { id: crypto.randomUUID(), keyword: kw, type: seedType },
    ]);
    setNewKeyword('');
  };

  const handleRemoveSeed = (id: string) =>
    setSeeds((prev) => prev.filter((s) => s.id !== id));

  const canConfirm = dna.name.trim().length > 0 && dna.goal.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="
        relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden
        bg-white dark:bg-[#0c1220]
        border border-gray-200 dark:border-white/10
        shadow-2xl shadow-black/20 dark:shadow-black/50
      ">
        {/* ── Header ────────────────────────────────────────── */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-white/8 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  Story Forge: Infinite
                </span>
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold
                  bg-violet-50 text-violet-600 border border-violet-200/60
                  dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20
                ">
                  <span className="w-1 h-1 rounded-full bg-violet-500 animate-pulse" />
                  Pre-Build
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-white/40">
                캔버스 진입 전, 캐릭터 DNA와 씨앗을 설정하세요.
              </p>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="w-7 h-7 flex items-center justify-center rounded-lg
                  text-gray-400 hover:text-gray-700 dark:text-white/30 dark:hover:text-white/70
                  hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">

          {/* DNA Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-gray-500 dark:text-white/50 uppercase tracking-widest">
                캐릭터 DNA
              </h3>
              <button
                onClick={handleAutoGenDNA}
                disabled={isGenerating}
                className="
                  flex items-center gap-1.5 text-xs font-medium
                  px-3 py-1.5 rounded-lg
                  bg-violet-50 text-violet-600 border border-violet-200/60
                  dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20
                  hover:bg-violet-100 dark:hover:bg-violet-500/20
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-150
                "
              >
                {isGenerating
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />생성 중...</>
                  : <><Sparkles className="w-3.5 h-3.5" />AI 자동 생성</>
                }
              </button>
            </div>

            <div className="space-y-3">
              {/* Name */}
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-white/40 mb-1.5">
                  캐릭터 이름 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={dna.name}
                  onChange={(e) => setDna((d) => ({ ...d, name: e.target.value }))}
                  placeholder="예: 카렌"
                  className="
                    w-full px-3 py-2.5 text-sm rounded-xl
                    bg-gray-50 dark:bg-white/5
                    border border-gray-200 dark:border-white/10
                    text-gray-900 dark:text-white
                    placeholder:text-gray-300 dark:placeholder:text-white/20
                    focus:outline-none focus:ring-2 focus:ring-violet-400/40 dark:focus:ring-violet-500/30
                    transition-all
                  "
                />
              </div>

              {/* Personality */}
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-white/40 mb-1.5">
                  성격
                </label>
                <input
                  type="text"
                  value={dna.personality}
                  onChange={(e) => setDna((d) => ({ ...d, personality: e.target.value }))}
                  placeholder="예: 냉철하지만 내면에 따뜻함이 있는"
                  className="
                    w-full px-3 py-2.5 text-sm rounded-xl
                    bg-gray-50 dark:bg-white/5
                    border border-gray-200 dark:border-white/10
                    text-gray-900 dark:text-white
                    placeholder:text-gray-300 dark:placeholder:text-white/20
                    focus:outline-none focus:ring-2 focus:ring-violet-400/40 dark:focus:ring-violet-500/30
                    transition-all
                  "
                />
              </div>

              {/* Goal */}
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-white/40 mb-1.5">
                  핵심 목표 <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={dna.goal}
                  onChange={(e) => setDna((d) => ({ ...d, goal: e.target.value }))}
                  placeholder="예: 진실을 밝혀 과거의 죄를 속죄하는 것"
                  rows={2}
                  className="
                    w-full px-3 py-2.5 text-sm rounded-xl resize-none
                    bg-gray-50 dark:bg-white/5
                    border border-gray-200 dark:border-white/10
                    text-gray-900 dark:text-white
                    placeholder:text-gray-300 dark:placeholder:text-white/20
                    focus:outline-none focus:ring-2 focus:ring-violet-400/40 dark:focus:ring-violet-500/30
                    transition-all
                  "
                />
              </div>
            </div>
          </section>

          {/* Seed Box Section */}
          <section>
            <div className="mb-3">
              <h3 className="text-xs font-bold text-gray-500 dark:text-white/50 uppercase tracking-widest mb-0.5">
                Seed Box
              </h3>
              <p className="text-[11px] text-gray-400 dark:text-white/25">
                복선, 핵심 아이템, 사건 키워드를 추가하면 Oracle AI가 제안에 활용합니다.
              </p>
            </div>

            {/* Add input */}
            <div className="flex gap-2 mb-3">
              <select
                value={seedType}
                onChange={(e) => setSeedType(e.target.value as SeedItem['type'])}
                className="
                  text-xs px-2.5 py-2 rounded-lg
                  bg-gray-50 dark:bg-white/5
                  border border-gray-200 dark:border-white/10
                  text-gray-600 dark:text-white/60
                  focus:outline-none cursor-pointer
                "
              >
                {Object.entries(SEED_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSeed()}
                placeholder="키워드 입력 후 Enter"
                className="
                  flex-1 px-3 py-2 text-sm rounded-lg
                  bg-gray-50 dark:bg-white/5
                  border border-gray-200 dark:border-white/10
                  text-gray-900 dark:text-white
                  placeholder:text-gray-300 dark:placeholder:text-white/20
                  focus:outline-none focus:ring-2 focus:ring-violet-400/40 dark:focus:ring-violet-500/30
                "
              />
              <button
                onClick={handleAddSeed}
                disabled={!newKeyword.trim()}
                className="
                  px-3 py-2 rounded-lg
                  bg-violet-500 hover:bg-violet-600 active:bg-violet-700
                  disabled:opacity-40 disabled:cursor-not-allowed
                  text-white transition-colors
                "
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Seed list */}
            {seeds.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {seeds.map((seed) => (
                  <div
                    key={seed.id}
                    className={`
                      flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs
                      border ${SEED_TYPE_COLORS[seed.type]}
                    `}
                  >
                    <Tag className="w-3 h-3 opacity-60 flex-shrink-0" />
                    <span className="opacity-60">{SEED_TYPE_LABELS[seed.type]}</span>
                    <span className="font-medium">{seed.keyword}</span>
                    <button
                      onClick={() => handleRemoveSeed(seed.id)}
                      className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="
                py-5 text-center rounded-xl
                border border-dashed border-gray-200 dark:border-white/10
              ">
                <p className="text-xs text-gray-400 dark:text-white/20">
                  아직 씨앗이 없습니다. 키워드를 추가해보세요.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* ── Footer ───────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/8 flex-shrink-0
          flex items-center justify-between gap-3
        ">
          <p className="text-xs text-gray-400 dark:text-white/25">
            * 이름과 핵심 목표는 필수입니다.
          </p>
          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                onClick={onCancel}
                className="
                  px-4 py-2.5 rounded-xl text-sm font-medium
                  text-gray-500 dark:text-white/40
                  hover:bg-gray-100 dark:hover:bg-white/5
                  transition-all
                "
              >
                취소
              </button>
            )}
            <button
              onClick={() => onConfirm(dna, seeds)}
              disabled={!canConfirm}
              className="
                px-5 py-2.5 rounded-xl text-sm font-semibold
                bg-gradient-to-r from-violet-500 to-indigo-500
                hover:from-violet-600 hover:to-indigo-600
                disabled:opacity-40 disabled:cursor-not-allowed
                text-white shadow-lg shadow-violet-500/25
                transition-all duration-150
              "
            >
              캔버스 언락 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
