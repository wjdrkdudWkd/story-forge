'use client';

/**
 * InfiniteDashboard.tsx — Infinite 모드 상단 대시보드
 *
 * • Ending Tracker: n / 30 형태로 진행률 표시
 * • 캐릭터 DNA 요약 + 씨앗 개수
 * • DNA 수정 / 홈으로 돌아가기 버튼
 */

import { Trophy, Settings, ArrowLeft, GitBranch } from 'lucide-react';
import type { CharacterDNA, SeedItem } from './PreBuildModal';

const MAX_ENDINGS = 30;

interface Props {
  dna: CharacterDNA;
  seeds: SeedItem[];
  endingCount: number;
  onEditDNA: () => void;
  onBack: () => void;
}

export function InfiniteDashboard({ dna, seeds, endingCount, onEditDNA, onBack }: Props) {
  const pct = Math.min((endingCount / MAX_ENDINGS) * 100, 100);

  return (
    <header className="
      h-14 flex-shrink-0 flex items-center justify-between px-4 gap-4
      bg-white/98 dark:bg-[#0c1220]/98
      backdrop-blur-xl
      border-b border-gray-200 dark:border-white/10
      shadow-sm z-20
    ">
      {/* ── Left: Back + Logo ──────────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBack}
          className="
            flex items-center gap-1.5 text-xs font-medium
            text-gray-500 hover:text-gray-800
            dark:text-white/40 dark:hover:text-white/80
            hover:bg-gray-100 dark:hover:bg-white/5
            px-2.5 py-1.5 rounded-lg
            transition-all duration-150 flex-shrink-0
          "
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          홈으로
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-white/10 flex-shrink-0" />

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="
            w-6 h-6 rounded-lg flex items-center justify-center
            bg-gradient-to-br from-violet-500 to-indigo-600
            shadow-sm shadow-violet-500/30
          ">
            <GitBranch className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="leading-none">
            <p className="text-[11px] font-bold text-gray-900 dark:text-white leading-none">
              Story Forge: Infinite
            </p>
            <p className="text-[9px] text-gray-400 dark:text-white/30 leading-none mt-0.5">
              Non-linear Story Editor
            </p>
          </div>
        </div>
      </div>

      {/* ── Center: DNA Summary ────────────────────────────── */}
      <div className="flex items-center gap-3 flex-1 justify-center min-w-0">
        <div className="
          flex items-center gap-2.5 px-3 py-1.5 rounded-xl
          bg-gray-50 dark:bg-white/4
          border border-gray-200 dark:border-white/8
          max-w-[260px] min-w-0
        ">
          {/* Avatar */}
          <div className="
            w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
            bg-indigo-100 text-indigo-700 text-[10px] font-bold
            dark:bg-indigo-500/20 dark:text-indigo-300
          ">
            {dna.name[0]?.toUpperCase() || '?'}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-800 dark:text-white/80 truncate leading-none">
              {dna.name || '이름 없음'}
            </p>
            {dna.personality && (
              <p className="text-[10px] text-gray-400 dark:text-white/30 truncate leading-none mt-0.5 max-w-[180px]">
                {dna.personality}
              </p>
            )}
          </div>
        </div>

        {seeds.length > 0 && (
          <div className="
            flex items-center gap-1 text-[11px]
            text-gray-400 dark:text-white/30 flex-shrink-0
          ">
            <span>씨앗</span>
            <span className="font-bold text-violet-600 dark:text-violet-400">{seeds.length}</span>
            <span>개</span>
          </div>
        )}
      </div>

      {/* ── Right: Ending Tracker + Settings ──────────────── */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Ending tracker */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span className="text-xs font-semibold text-gray-600 dark:text-white/60">
              엔딩
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Progress bar */}
            <div className="w-20 h-1.5 rounded-full bg-gray-100 dark:bg-white/8 overflow-hidden">
              <div
                className="
                  h-full rounded-full
                  bg-gradient-to-r from-amber-400 to-orange-400
                  transition-all duration-500
                "
                style={{ width: `${pct}%` }}
              />
            </div>
            {/* Count */}
            <span className="text-xs font-mono font-semibold">
              <span className={endingCount > 0
                ? 'text-amber-500 dark:text-amber-400'
                : 'text-gray-400 dark:text-white/30'
              }>
                {endingCount}
              </span>
              <span className="text-gray-300 dark:text-white/20"> / {MAX_ENDINGS}</span>
            </span>
          </div>
        </div>

        <div className="w-px h-5 bg-gray-200 dark:bg-white/10" />

        {/* DNA Settings */}
        <button
          onClick={onEditDNA}
          className="
            flex items-center gap-1.5 text-xs font-medium
            text-gray-500 hover:text-gray-800
            dark:text-white/40 dark:hover:text-white/80
            hover:bg-gray-100 dark:hover:bg-white/5
            px-2.5 py-1.5 rounded-lg
            transition-all duration-150
          "
        >
          <Settings className="w-3.5 h-3.5" />
          DNA 수정
        </button>
      </div>
    </header>
  );
}
