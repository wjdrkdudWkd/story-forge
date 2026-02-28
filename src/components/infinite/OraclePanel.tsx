'use client';

/**
 * OraclePanel.tsx — 우측 AI 비서 슬라이딩 패널 (Phase 2)
 *
 * • 선택된 노드 맥락 + POV 캐릭터 + Seed Box 키워드로 다음 상황 3가지 제안
 * • 카드 드래그 & 드롭 → 캔버스에 새 노드 생성
 * • 버튼으로도 바로 추가 가능
 */

import { useState } from 'react';
import { ChevronLeft, Sparkles, Loader2, GripVertical, Plus, X } from 'lucide-react';
import type { Node } from '@xyflow/react';
import type { SeedItem } from './PreBuildModal';
import type { Character } from './types';
import type { InfiniteNodeData } from './InfiniteNode';

// ── 타입 ────────────────────────────────────────────────────────
type TensionLevel = 'low' | 'medium' | 'high';

interface OracleSuggestion {
  id: string;
  title: string;
  content: string;
  tension: TensionLevel;
  usedSeed?: string;
}

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  selectedNode: Node | null;
  seeds: SeedItem[];
  characters: Character[];
  onAddToCanvas: (content: string) => void;
}

// ── 스타일 상수 ──────────────────────────────────────────────────
const TENSION_CFG: Record<TensionLevel, {
  label: string;
  dot: string;
  badge: string;
}> = {
  low:    { label: '평온',  dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' },
  medium: { label: '긴장',  dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' },
  high:   { label: '절정',  dot: 'bg-red-400',     badge: 'bg-red-50 text-red-700 border-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' },
};

// ── 목업 AI 제안 생성 ─────────────────────────────────────────
function buildMockSuggestions(
  node: Node | null,
  seeds: SeedItem[],
  povChar?: Character
): OracleSuggestion[] {
  const kws = seeds.map((s) => s.keyword);
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  const seedKw = kws.length > 0 ? pick(kws) : null;

  const nodeContent = (node?.data as { content?: string })?.content?.trim() ?? '';
  const contextSnippet = nodeContent.length > 0
    ? `현재 상황(${nodeContent.slice(0, 20)}...)에서`
    : '현재 장면에서';

  const povName = povChar?.name ?? '주인공';

  return [
    {
      id: crypto.randomUUID(),
      title: '반전과 배신',
      content: `${contextSnippet} ${povName}이(가) 가장 믿었던 인물이 실제로는 적의 편이었음이 밝혀진다.${seedKw ? ` '${seedKw}'의 존재가 그 증거가 된다.` : ''} ${povName}은(는) 모든 계획을 재설계해야 하는 상황에 놓인다.`,
      tension: 'high',
      usedSeed: seedKw ?? undefined,
    },
    {
      id: crypto.randomUUID(),
      title: '복선 회수',
      content: `앞서 무심코 지나쳤던 ${seedKw ?? '작은 단서'}가 사실 핵심 열쇠였다는 것이 드러난다. ${povName}은(는) 과거의 퍼즐 조각을 맞추며 진실에 한 걸음 다가선다.`,
      tension: 'medium',
      usedSeed: seedKw ?? undefined,
    },
    {
      id: crypto.randomUUID(),
      title: '내면의 갈등',
      content: `외부 위협이 잠시 멈춘 사이, ${povName}은(는) 자신의 선택을 되돌아본다. 목표를 이루기 위해 치러야 할 대가가 생각보다 크다는 것을 직감한다.`,
      tension: 'low',
    },
  ];
}

// ── Oracle Card 컴포넌트 ──────────────────────────────────────────
function OracleCard({
  suggestion,
  onAdd,
}: {
  suggestion: OracleSuggestion;
  onAdd: () => void;
}) {
  const cfg = TENSION_CFG[suggestion.tension];
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('oracle/content', suggestion.content);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => setIsDragOver(false)}
      className={`
        group relative rounded-xl overflow-hidden cursor-grab active:cursor-grabbing
        bg-white dark:bg-[#0f1e35]/80
        border transition-all duration-150
        ${isDragOver
          ? 'border-violet-300 dark:border-violet-500/40 ring-2 ring-violet-400/30 dark:ring-violet-500/20'
          : 'border-gray-200 dark:border-white/8'
        }
        shadow-sm hover:shadow-md dark:hover:shadow-black/20
        hover:-translate-y-0.5
      `}
    >
      {/* Card Header */}
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="w-3.5 h-3.5 text-gray-300 dark:text-white/15 flex-shrink-0" />
          <span className="text-xs font-semibold text-gray-800 dark:text-white/80">
            {suggestion.title}
          </span>
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${cfg.badge}`}>
          <span className={`w-1 h-1 rounded-full ${cfg.dot} flex-shrink-0`} />
          {cfg.label}
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pb-2.5">
        <p className="text-xs text-gray-600 dark:text-white/55 leading-relaxed">
          {suggestion.content}
        </p>
        {suggestion.usedSeed && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400 dark:text-white/25">씨앗 사용:</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full
              bg-violet-50 text-violet-600 border border-violet-200/50
              dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20
            ">
              {suggestion.usedSeed}
            </span>
          </div>
        )}
      </div>

      {/* Add Button (hover) */}
      <div className="
        px-3 pb-3 pt-1
        border-t border-gray-100 dark:border-white/5
        opacity-0 group-hover:opacity-100 transition-opacity
      ">
        <button
          onClick={(e) => { e.stopPropagation(); onAdd(); }}
          className="
            w-full py-1.5 text-xs font-medium rounded-lg
            bg-violet-50 hover:bg-violet-100
            dark:bg-violet-500/10 dark:hover:bg-violet-500/20
            text-violet-600 dark:text-violet-400
            border border-violet-200/50 dark:border-violet-500/20
            flex items-center justify-center gap-1.5
            transition-colors
          "
        >
          <Plus className="w-3.5 h-3.5" />
          캔버스에 추가
        </button>
      </div>
    </div>
  );
}

// ── 메인 패널 ─────────────────────────────────────────────────────
export function OraclePanel({ isOpen, onToggle, selectedNode, seeds, characters, onAddToCanvas }: Props) {
  const [suggestions, setSuggestions] = useState<OracleSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const nodeData = selectedNode?.data as InfiniteNodeData | undefined;
  const povChar = characters.find((c) => c.id === nodeData?.povCharacterId);

  const handleGenerate = async () => {
    if (!selectedNode) return;
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setSuggestions(buildMockSuggestions(selectedNode, seeds, povChar));
    setIsLoading(false);
  };

  const nodeContent = selectedNode
    ? ((selectedNode.data as { content?: string })?.content?.trim() ?? '')
    : '';

  return (
    <>
      {/* ── 슬라이드 탭 (항상 노출) ─────────────────────────── */}
      <button
        onClick={onToggle}
        className={`
          fixed top-1/2 -translate-y-1/2 z-40
          w-7 h-20 flex items-center justify-center
          rounded-l-xl
          bg-white/90 dark:bg-[#0f1e35]/90
          backdrop-blur-xl
          border border-r-0 border-gray-200 dark:border-white/10
          shadow-lg
          hover:bg-violet-50 dark:hover:bg-violet-500/10
          transition-all duration-300
          ${isOpen ? 'right-80' : 'right-0'}
        `}
        title={isOpen ? 'Oracle 닫기' : 'Oracle AI 열기'}
        aria-label={isOpen ? 'Oracle 패널 닫기' : 'Oracle AI 열기'}
      >
        <ChevronLeft className={`
          w-4 h-4 text-gray-400 dark:text-white/30
          transition-transform duration-300
          ${isOpen ? 'rotate-180' : ''}
        `} />
      </button>

      {/* ── 패널 본체 ───────────────────────────────────────── */}
      <aside className={`
        fixed right-0 top-0 h-full w-80 z-30
        flex flex-col
        bg-white/98 dark:bg-[#0c1220]/98
        backdrop-blur-xl
        border-l border-gray-200 dark:border-white/10
        shadow-2xl shadow-black/5 dark:shadow-black/40
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>

        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-100 dark:border-white/8 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center
                bg-gradient-to-br from-violet-500 to-indigo-600
                shadow-md shadow-violet-500/30
              ">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-none">
                  The Oracle
                </h2>
                <p className="text-[10px] text-gray-400 dark:text-white/30 leading-none mt-0.5">
                  AI 스토리 어드바이저
                </p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="w-6 h-6 flex items-center justify-center rounded-lg
                text-gray-400 dark:text-white/30
                hover:text-gray-700 dark:hover:text-white/70
                hover:bg-gray-100 dark:hover:bg-white/5
                transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-white/35 leading-relaxed">
            노드를 선택하면 맥락을 분석하여<br />
            다음 상황 후보 3가지를 제안합니다.
          </p>
        </div>

        {/* Selected Node Preview */}
        {selectedNode ? (
          <div className="mx-4 mt-3 px-3 py-2.5 rounded-xl flex-shrink-0
            bg-violet-50/80 dark:bg-violet-500/8
            border border-violet-200/60 dark:border-violet-500/20
          ">
            {/* POV Character Badge */}
            {povChar && (
              <div className="flex items-center gap-1.5 mb-1.5">
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                  style={{ background: povChar.color }}
                >
                  {povChar.name[0]?.toUpperCase()}
                </span>
                <span className="text-[10px] font-semibold" style={{ color: povChar.color }}>
                  {povChar.name} POV
                </span>
              </div>
            )}
            <p className="text-[10px] font-semibold uppercase tracking-wider
              text-violet-600 dark:text-violet-400 mb-1
            ">
              선택된 노드
            </p>
            <p className="text-xs text-gray-600 dark:text-white/55 line-clamp-2 leading-relaxed">
              {nodeContent || '(내용 없음)'}
            </p>
          </div>
        ) : (
          <div className="mx-4 mt-3 px-3 py-2.5 rounded-xl flex-shrink-0
            bg-gray-50 dark:bg-white/3
            border border-dashed border-gray-200 dark:border-white/8
          ">
            <p className="text-xs text-center text-gray-400 dark:text-white/20">
              캔버스에서 노드를 클릭하여 선택하세요
            </p>
          </div>
        )}

        {/* Generate Button */}
        <div className="px-4 mt-3 flex-shrink-0">
          <button
            onClick={handleGenerate}
            disabled={isLoading || !selectedNode}
            className="
              w-full py-2.5 rounded-xl text-sm font-semibold
              bg-gradient-to-r from-violet-500 to-indigo-500
              hover:from-violet-600 hover:to-indigo-600
              disabled:opacity-40 disabled:cursor-not-allowed
              text-white shadow-md shadow-violet-500/20
              flex items-center justify-center gap-2
              transition-all duration-150
            "
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />분석 중...</>
            ) : (
              <><Sparkles className="w-4 h-4" />다음 상황 제안</>
            )}
          </button>
        </div>

        {/* Suggestions List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {suggestions.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center
                bg-gray-50 dark:bg-white/4
                border border-dashed border-gray-200 dark:border-white/8
              ">
                <Sparkles className="w-5 h-5 text-gray-200 dark:text-white/10" />
              </div>
              <p className="text-sm text-gray-400 dark:text-white/25 leading-relaxed">
                노드를 선택하고<br />'다음 상황 제안'을 눌러보세요.
              </p>
              <p className="text-xs text-gray-300 dark:text-white/15 mt-2 leading-relaxed">
                카드를 캔버스로 드래그하거나<br />버튼으로 바로 추가할 수 있습니다.
              </p>
            </div>
          )}

          {suggestions.map((s) => (
            <OracleCard
              key={s.id}
              suggestion={s}
              onAdd={() => onAddToCanvas(s.content)}
            />
          ))}
        </div>

        {/* Seeds Footer */}
        {seeds.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-white/8 flex-shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider
              text-gray-400 dark:text-white/25 mb-2
            ">
              활성 씨앗 ({seeds.length}개)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {seeds.slice(0, 6).map((s) => (
                <span key={s.id} className="
                  text-[10px] px-2 py-0.5 rounded-full
                  bg-violet-50 dark:bg-violet-500/10
                  text-violet-600 dark:text-violet-400
                  border border-violet-200/50 dark:border-violet-500/20
                ">
                  {s.keyword}
                </span>
              ))}
              {seeds.length > 6 && (
                <span className="text-[10px] text-gray-400 dark:text-white/25 self-center">
                  +{seeds.length - 6}
                </span>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
