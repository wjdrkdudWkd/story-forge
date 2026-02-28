'use client';

/**
 * ModeSelectionScreen.tsx
 *
 * 앱 진입점 — Standard Mode vs Story Forge: Infinite 선택 화면
 * Glassmorphism + Dark/Light 모드 지원
 */

import { useState } from 'react';
import { Moon, Sun, Sparkles, GitBranch, Layers, ChevronRight, Zap, Network, Shuffle } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/authContext';

type AppMode = 'home' | 'standard' | 'infinite';

interface Props {
  onSelect: (mode: AppMode) => void;
}

const STANDARD_FEATURES = [
  { icon: Layers, text: '아이디어 → 막 구조 → 장면 블록으로 이어지는 선형 마법사' },
  { icon: Sparkles, text: 'AI가 로그라인, 시놉시스, 캐릭터를 자동 제안' },
  { icon: Shuffle, text: '최대 30개 장면 블록 + 다중 브랜치 관리' },
];

const INFINITE_FEATURES = [
  { icon: Network, text: '방향 제한 없는 무한 노드 캔버스 (줌/패닝)' },
  { icon: Zap, text: 'The Oracle AI가 현재 노드 맥락으로 다음 장면 3가지 즉시 제안' },
  { icon: GitBranch, text: '비선형 분기 설계 · 멀티 엔딩 트래커 (n / 30)' },
];

export function ModeSelectionScreen({ onSelect }: Props) {
  const { theme, toggle } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const [hoveredCard, setHoveredCard] = useState<'standard' | 'infinite' | null>(null);

  const userInitial = user ? (user.nickname?.[0] ?? user.email[0]).toUpperCase() : null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-transparent">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="
        sticky top-0 z-50
        border-b border-gray-200 bg-white
        dark:border-white/10 dark:bg-black/30 dark:backdrop-blur-xl
        transition-colors duration-200
      ">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Wordmark */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white/90">
              story-forge
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="
                flex items-center justify-center w-8 h-8 rounded-full
                text-gray-500 hover:text-gray-900 hover:bg-gray-100
                dark:text-white/50 dark:hover:text-white dark:hover:bg-white/10
                transition-all duration-150
              "
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {isAuthenticated && userInitial && (
              <div className="
                w-8 h-8 rounded-full flex items-center justify-center
                text-xs font-bold
                bg-indigo-100 text-indigo-600
                dark:bg-indigo-500/20 dark:text-indigo-300
              ">
                {userInitial}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        {/* Badge */}
        <div className="mb-6 flex items-center gap-2 px-4 py-1.5 rounded-full
          bg-white dark:bg-white/5
          border border-gray-200 dark:border-white/10
          shadow-sm
        ">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-gray-500 dark:text-white/40">
            어떤 모드로 시작할까요?
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-bold text-center leading-tight mb-4
          text-gray-900 dark:text-white
        ">
          이야기를 만드는
          <br />
          <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
            두 가지 방법
          </span>
        </h1>
        <p className="text-base text-center text-gray-500 dark:text-white/40 max-w-lg mb-14">
          단계별 시나리오 마법사부터 게임 개발자용 무한 캔버스까지.
          <br />당신의 이야기 스타일에 맞는 모드를 선택하세요.
        </p>

        {/* ── Mode Cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-3xl">

          {/* Card A: Standard Mode */}
          <button
            onClick={() => onSelect('standard')}
            onMouseEnter={() => setHoveredCard('standard')}
            onMouseLeave={() => setHoveredCard(null)}
            className={`
              group relative text-left rounded-2xl overflow-hidden cursor-pointer
              bg-white dark:bg-white/[0.04]
              backdrop-blur-xl
              border transition-all duration-300
              shadow-lg
              ${hoveredCard === 'standard'
                ? 'border-indigo-300 dark:border-indigo-500/40 shadow-indigo-100/80 dark:shadow-indigo-500/10 -translate-y-1'
                : 'border-gray-200 dark:border-white/10 shadow-black/5 dark:shadow-black/20'
              }
            `}
          >
            {/* Glow effect */}
            <div className={`
              absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-indigo-50/0
              dark:from-indigo-500/0 dark:to-indigo-500/0
              transition-all duration-300
              ${hoveredCard === 'standard' ? 'dark:from-indigo-500/5 dark:to-blue-500/5' : ''}
            `} />

            <div className="relative p-6">
              {/* Icon + Badge */}
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-xl
                  bg-gradient-to-br from-indigo-500 to-blue-600
                  flex items-center justify-center shadow-lg shadow-indigo-500/30
                ">
                  <Layers className="w-6 h-6 text-white" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider
                  bg-indigo-50 text-indigo-600 border border-indigo-100
                  dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20
                ">
                  Standard
                </span>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                Standard Mode
              </h2>
              <p className="text-sm text-gray-500 dark:text-white/40 mb-5 leading-relaxed">
                아이디어부터 블록 구조까지 단계별로 안내하는 <br className="hidden sm:block" />
                시나리오 생성 마법사.
              </p>

              {/* Features */}
              <ul className="space-y-2.5 mb-6">
                {STANDARD_FEATURES.map(({ icon: Icon, text }, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="mt-0.5 w-4 h-4 rounded-md bg-indigo-100 dark:bg-indigo-500/15
                      flex items-center justify-center flex-shrink-0
                    ">
                      <Icon className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-white/50 leading-relaxed">
                      {text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className={`
                flex items-center justify-between pt-4
                border-t border-gray-100 dark:border-white/8
              `}>
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  시작하기
                </span>
                <ChevronRight className={`
                  w-4 h-4 text-indigo-500 dark:text-indigo-400
                  transition-transform duration-200
                  ${hoveredCard === 'standard' ? 'translate-x-1' : ''}
                `} />
              </div>
            </div>
          </button>

          {/* Card B: Story Forge: Infinite */}
          <button
            onClick={() => onSelect('infinite')}
            onMouseEnter={() => setHoveredCard('infinite')}
            onMouseLeave={() => setHoveredCard(null)}
            className={`
              group relative text-left rounded-2xl overflow-hidden cursor-pointer
              bg-white dark:bg-white/[0.04]
              backdrop-blur-xl
              border transition-all duration-300
              shadow-lg
              ${hoveredCard === 'infinite'
                ? 'border-violet-300 dark:border-violet-500/40 shadow-violet-100/80 dark:shadow-violet-500/10 -translate-y-1'
                : 'border-gray-200 dark:border-white/10 shadow-black/5 dark:shadow-black/20'
              }
            `}
          >
            {/* Glow */}
            <div className={`
              absolute inset-0
              transition-all duration-300
              ${hoveredCard === 'infinite' ? 'dark:from-violet-500/5 dark:to-indigo-500/5 bg-gradient-to-br' : ''}
            `} />

            {/* "New" ribbon */}
            <div className="
              absolute top-4 right-[-28px] rotate-45
              bg-gradient-to-r from-violet-500 to-indigo-500
              text-white text-[9px] font-bold uppercase tracking-wider
              px-8 py-1 shadow-md
            ">
              NEW
            </div>

            <div className="relative p-6">
              {/* Icon + Badge */}
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-xl
                  bg-gradient-to-br from-violet-500 to-indigo-600
                  flex items-center justify-center shadow-lg shadow-violet-500/30
                ">
                  <GitBranch className="w-6 h-6 text-white" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider
                  bg-violet-50 text-violet-600 border border-violet-100
                  dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20
                ">
                  Infinite
                </span>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                Story Forge: Infinite
              </h2>
              <p className="text-sm text-gray-500 dark:text-white/40 mb-5 leading-relaxed">
                게임 개발자를 위한 비선형 스토리 설계 <br className="hidden sm:block" />
                무한 캔버스. Unreal Blueprint 감성.
              </p>

              {/* Features */}
              <ul className="space-y-2.5 mb-6">
                {INFINITE_FEATURES.map(({ icon: Icon, text }, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="mt-0.5 w-4 h-4 rounded-md bg-violet-100 dark:bg-violet-500/15
                      flex items-center justify-center flex-shrink-0
                    ">
                      <Icon className="w-2.5 h-2.5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-white/50 leading-relaxed">
                      {text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/8">
                <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                  캔버스 열기
                </span>
                <ChevronRight className={`
                  w-4 h-4 text-violet-500 dark:text-violet-400
                  transition-transform duration-200
                  ${hoveredCard === 'infinite' ? 'translate-x-1' : ''}
                `} />
              </div>
            </div>
          </button>
        </div>

        {/* Footer note */}
        <p className="mt-10 text-xs text-gray-400 dark:text-white/20">
          모드는 언제든지 전환할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
