'use client';

/**
 * InfiniteGameEditor.tsx — Story Forge: Infinite 메인 오케스트레이터 (Phase 2)
 *
 * 레이아웃 (canvas 모드):
 *   ┌──────────── InfiniteDashboard (top, h-14) ──────────────┐
 *   ├──────────── CanvasToolbar (h-9): + SCENE 추가 버튼 ──────┤
 *   │  ┌──────┬──────────────────────────────┬──────────────┐ │
 *   │  │Prota-│                              │  Oracle      │ │
 *   │  │gonist│   InfiniteCanvas (flex-1)    │  Panel       │ │
 *   │  │Side- │                              │  (overlay)   │ │
 *   │  │bar   │                              │              │ │
 *   │  └──────┴──────────────────────────────┴──────────────┘ │
 *   └──────────────────────────────────────────────────────────┘
 */

import { useState, useCallback } from 'react';
import type { Node } from '@xyflow/react';
import { Plus } from 'lucide-react';

import { PreBuildModal, type CharacterDNA, type SeedItem } from './PreBuildModal';
import { InfiniteCanvas } from './InfiniteCanvas';
import { OraclePanel } from './OraclePanel';
import { InfiniteDashboard } from './InfiniteDashboard';
import { ProtagonistSidebar } from './ProtagonistSidebar';
import { type Character, CHARACTER_PALETTE } from './types';

type EditorView = 'prebuild' | 'canvas';

interface Props {
  onBack: () => void;
}

function genId() {
  return `char_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function InfiniteGameEditor({ onBack }: Props) {
  // ── 뷰 상태 ─────────────────────────────────────────────────────
  const [view, setView] = useState<EditorView>('prebuild');
  const [isDNAEditOpen, setIsDNAEditOpen] = useState(false);

  // ── 프로젝트 데이터 ───────────────────────────────────────────────
  const [dna, setDna] = useState<CharacterDNA>({ name: '', personality: '', goal: '' });
  const [seeds, setSeeds] = useState<SeedItem[]>([]);

  // ── 캐릭터 상태 ───────────────────────────────────────────────────
  const [characters, setCharacters] = useState<Character[]>([]);

  // ── 캔버스 / Oracle 상태 ─────────────────────────────────────────
  const [isOracleOpen, setIsOracleOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [endingCount, setEndingCount] = useState(0);
  const [pendingCard, setPendingCard] = useState<{ content: string } | null>(null);

  // ── Ghost Node 배치 모드 ──────────────────────────────────────────
  const [isGhostPlacing, setIsGhostPlacing] = useState(false);

  // ── Pre-Build 완료: 캔버스 진입 ───────────────────────────────────
  const handlePreBuildConfirm = useCallback((d: CharacterDNA, s: SeedItem[]) => {
    setDna(d);
    setSeeds(s);
    if (d.name.trim()) {
      const mainChar: Character = {
        id: genId(),
        name: d.name.trim(),
        color: CHARACTER_PALETTE[0],
        personality: d.personality.trim(),
        isMain: true,
      };
      setCharacters([mainChar]);
    }
    setView('canvas');
  }, []);

  // ── DNA 수정 완료 ────────────────────────────────────────────────
  const handleDNAEditConfirm = useCallback((d: CharacterDNA, s: SeedItem[]) => {
    setDna(d);
    setSeeds(s);
    setCharacters((prev) =>
      prev.map((c) =>
        c.isMain ? { ...c, name: d.name.trim() || c.name, personality: d.personality.trim() } : c
      )
    );
    setIsDNAEditOpen(false);
  }, []);

  // ── 캐릭터 CRUD ───────────────────────────────────────────────────
  const handleCharacterAdd = useCallback((data: Omit<Character, 'id'>) => {
    setCharacters((prev) => [...prev, { ...data, id: genId() }]);
  }, []);

  const handleCharacterUpdate = useCallback((id: string, patch: Partial<Character>) => {
    setCharacters((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c));
  }, []);

  const handleCharacterDelete = useCallback((id: string) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // ── Oracle → 캔버스 카드 추가 ─────────────────────────────────────
  const handleAddToCanvas = useCallback((content: string) => {
    setPendingCard({ content });
  }, []);

  const handlePendingCardConsumed = useCallback(() => {
    setPendingCard(null);
  }, []);

  // ── Ghost 종료 ────────────────────────────────────────────────────
  const handleGhostPlacingEnd = useCallback(() => {
    setIsGhostPlacing(false);
  }, []);

  // ── Pre-Build 화면 ────────────────────────────────────────────────
  if (view === 'prebuild') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-transparent flex flex-col">
        <div className="h-14 flex items-center px-6
          border-b border-gray-200 dark:border-white/10
          bg-white/80 dark:bg-black/20 backdrop-blur-xl
        ">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-white/40
              hover:text-gray-800 dark:hover:text-white/70 transition-colors"
          >
            ← 돌아가기
          </button>
        </div>
        <PreBuildModal onConfirm={handlePreBuildConfirm} onCancel={onBack} />
      </div>
    );
  }

  // ── DNA 수정 모달 (캔버스 위에 오버레이) ──────────────────────────
  if (isDNAEditOpen) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <InfiniteDashboard
          dna={dna}
          seeds={seeds}
          endingCount={endingCount}
          onEditDNA={() => {}}
          onBack={onBack}
        />
        <CanvasToolbar
          isGhostPlacing={false}
          onAddScene={() => {}}
        />
        <div className="flex flex-1 overflow-hidden relative">
          <ProtagonistSidebar
            characters={characters}
            onAdd={handleCharacterAdd}
            onUpdate={handleCharacterUpdate}
            onDelete={handleCharacterDelete}
          />
          <div className="flex-1 relative">
            <InfiniteCanvas
              dna={dna}
              seeds={seeds}
              characters={characters}
              onNodeSelect={setSelectedNode}
              onEndingCountChange={setEndingCount}
              pendingCard={pendingCard}
              onPendingCardConsumed={handlePendingCardConsumed}
              isGhostPlacing={false}
              onGhostPlacingEnd={handleGhostPlacingEnd}
            />
            <PreBuildModal
              initialDna={dna}
              initialSeeds={seeds}
              onConfirm={handleDNAEditConfirm}
              onCancel={() => setIsDNAEditOpen(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── 메인 캔버스 화면 ──────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Dashboard */}
      <InfiniteDashboard
        dna={dna}
        seeds={seeds}
        endingCount={endingCount}
        onEditDNA={() => setIsDNAEditOpen(true)}
        onBack={onBack}
      />

      {/* Canvas Toolbar: + SCENE 추가 버튼 */}
      <CanvasToolbar
        isGhostPlacing={isGhostPlacing}
        onAddScene={() => setIsGhostPlacing((v) => !v)}
      />

      {/* Body: Sidebar + Canvas + Oracle */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left: Protagonist Sidebar */}
        <ProtagonistSidebar
          characters={characters}
          onAdd={handleCharacterAdd}
          onUpdate={handleCharacterUpdate}
          onDelete={handleCharacterDelete}
        />

        {/* Center: Infinite Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <InfiniteCanvas
            dna={dna}
            seeds={seeds}
            characters={characters}
            onNodeSelect={setSelectedNode}
            onEndingCountChange={setEndingCount}
            pendingCard={pendingCard}
            onPendingCardConsumed={handlePendingCardConsumed}
            isGhostPlacing={isGhostPlacing}
            onGhostPlacingEnd={handleGhostPlacingEnd}
          />

          {/* Oracle Panel (우측 슬라이딩 오버레이) */}
          <OraclePanel
            isOpen={isOracleOpen}
            onToggle={() => setIsOracleOpen((v) => !v)}
            selectedNode={selectedNode}
            seeds={seeds}
            characters={characters}
            onAddToCanvas={handleAddToCanvas}
          />
        </div>
      </div>
    </div>
  );
}

// ── Canvas Toolbar ──────────────────────────────────────────────────
interface CanvasToolbarProps {
  isGhostPlacing: boolean;
  onAddScene: () => void;
}

function CanvasToolbar({ isGhostPlacing, onAddScene }: CanvasToolbarProps) {
  return (
    <div className="
      h-9 flex-shrink-0 flex items-center
      bg-white/98 dark:bg-[#0c1220]/98
      border-b border-gray-100 dark:border-white/6
      z-10
    ">
      {/* Left spacer */}
      <div className="flex-1" />

      {/* Center: + SCENE 추가 버튼 */}
      <button
        onClick={onAddScene}
        className={`
          flex items-center gap-1.5 text-[11px] font-semibold
          px-2.5 py-1 rounded-lg
          border transition-all duration-150
          ${isGhostPlacing
            ? 'bg-violet-500 text-white border-violet-500 shadow-sm shadow-violet-500/30'
            : 'bg-violet-50 hover:bg-violet-100 dark:bg-violet-500/10 dark:hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/20'
          }
        `}
      >
        <Plus className="w-3 h-3" />
        SCENE 추가
        {isGhostPlacing && (
          <span className="ml-1 text-[9px] opacity-80 font-normal">(ESC로 취소)</span>
        )}
      </button>

      {/* Right: hint text */}
      <div className="flex-1 flex justify-end px-4">
        <p className="text-[10px] text-gray-400 dark:text-white/25 select-none">
          {isGhostPlacing
            ? '캔버스를 클릭하여 씬을 배치하세요'
            : '캔버스 빈 곳에 우클릭하여 씬을 추가할 수도 있습니다'}
        </p>
      </div>
    </div>
  );
}
