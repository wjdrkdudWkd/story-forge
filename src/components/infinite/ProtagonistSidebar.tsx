'use client';

/**
 * ProtagonistSidebar.tsx — 좌측 주인공 갤러리 패널
 *
 * • 글래스모피즘 사이드바
 * • 캐릭터 카드: 이름 / 테마색 / 성격 키워드
 * • [+] Add New Character 버튼으로 실시간 추가
 * • 캐릭터 클릭 → 인라인 편집 / 삭제
 */

import { useState } from 'react';
import { Plus, X, Check, UserPlus, Users } from 'lucide-react';
import { type Character, CHARACTER_PALETTE, colorToAlpha } from './types';

// ── Props ────────────────────────────────────────────────────────
interface Props {
  characters: Character[];
  onAdd: (c: Omit<Character, 'id'>) => void;
  onUpdate: (id: string, patch: Partial<Character>) => void;
  onDelete: (id: string) => void;
}

// ── 인라인 편집 폼 ────────────────────────────────────────────────
interface CharacterFormProps {
  initial?: Partial<Character>;
  onConfirm: (data: Omit<Character, 'id'>) => void;
  onCancel: () => void;
  confirmLabel?: string;
}

function CharacterForm({ initial, onConfirm, onCancel, confirmLabel = '추가' }: CharacterFormProps) {
  const [name, setName]           = useState(initial?.name ?? '');
  const [personality, setPersonality] = useState(initial?.personality ?? '');
  const [color, setColor]         = useState(initial?.color ?? CHARACTER_PALETTE[1]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onConfirm({ name: name.trim(), personality: personality.trim(), color, isMain: initial?.isMain });
  };

  return (
    <div className="
      rounded-xl p-3 space-y-2.5
      bg-gray-50/80 dark:bg-white/4
      border border-gray-200 dark:border-white/10
    ">
      {/* Name */}
      <input
        autoFocus
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') onCancel(); }}
        placeholder="캐릭터 이름"
        className="
          w-full px-2.5 py-1.5 text-xs rounded-lg
          bg-white dark:bg-white/5
          border border-gray-200 dark:border-white/10
          text-gray-900 dark:text-white
          placeholder:text-gray-300 dark:placeholder:text-white/20
          focus:outline-none focus:ring-1 focus:ring-violet-400/50
        "
      />
      {/* Personality */}
      <input
        type="text"
        value={personality}
        onChange={e => setPersonality(e.target.value)}
        placeholder="성격 (예: 냉철한, 관찰력 뛰어난)"
        className="
          w-full px-2.5 py-1.5 text-xs rounded-lg
          bg-white dark:bg-white/5
          border border-gray-200 dark:border-white/10
          text-gray-900 dark:text-white
          placeholder:text-gray-300 dark:placeholder:text-white/20
          focus:outline-none focus:ring-1 focus:ring-violet-400/50
        "
      />
      {/* Color picker */}
      <div className="flex gap-1.5 flex-wrap">
        {CHARACTER_PALETTE.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            title={c}
            className={`
              w-5 h-5 rounded-full transition-all duration-100 flex-shrink-0
              ${color === c ? 'ring-2 ring-offset-1 ring-gray-400 dark:ring-white/40 scale-110' : 'hover:scale-110'}
            `}
            style={{ background: c }}
          />
        ))}
      </div>
      {/* Actions */}
      <div className="flex gap-1.5">
        <button
          onClick={onCancel}
          className="
            flex-1 py-1.5 rounded-lg text-xs font-medium
            text-gray-500 dark:text-white/40
            hover:bg-gray-100 dark:hover:bg-white/5
            transition-colors
          "
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="
            flex-1 py-1.5 rounded-lg text-xs font-semibold
            bg-violet-500 hover:bg-violet-600 disabled:opacity-40
            text-white transition-colors
            flex items-center justify-center gap-1
          "
        >
          <Check className="w-3 h-3" />
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

// ── 캐릭터 카드 ───────────────────────────────────────────────────
interface CharacterCardProps {
  character: Character;
  onUpdate: (id: string, patch: Partial<Character>) => void;
  onDelete: (id: string) => void;
}

function CharacterCard({ character, onUpdate, onDelete }: CharacterCardProps) {
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);

  const personalityTags = character.personality
    .split(/[,，、]/)
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (editing) {
    return (
      <CharacterForm
        initial={character}
        confirmLabel="저장"
        onConfirm={(data) => { onUpdate(character.id, data); setEditing(false); }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div
      className="
        group relative rounded-xl overflow-hidden cursor-pointer
        border border-gray-200 dark:border-white/8
        hover:border-gray-300 dark:hover:border-white/15
        shadow-sm hover:shadow-md dark:hover:shadow-black/20
        transition-all duration-150
      "
      style={{ borderLeftWidth: 3, borderLeftColor: character.color }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setEditing(true)}
    >
      {/* Tinted header */}
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ background: colorToAlpha(character.color, 0.07) }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Avatar */}
          <div
            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center
              text-xs font-bold text-white shadow-sm"
            style={{ background: character.color }}
          >
            {character.name[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate leading-none">
              {character.name}
            </p>
            {character.isMain && (
              <span className="text-[9px] font-medium text-gray-400 dark:text-white/30 leading-none">
                주인공
              </span>
            )}
          </div>
        </div>

        {/* Delete (non-main only) */}
        {!character.isMain && hovered && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(character.id); }}
            className="
              w-5 h-5 flex items-center justify-center rounded-lg
              text-gray-300 hover:text-red-500 dark:text-white/20 dark:hover:text-red-400
              transition-colors flex-shrink-0
            "
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Personality tags */}
      {personalityTags.length > 0 && (
        <div className="px-3 py-2 bg-white dark:bg-transparent flex flex-wrap gap-1">
          {personalityTags.map((tag, i) => (
            <span
              key={i}
              className="text-[9px] px-1.5 py-0.5 rounded-full
                bg-gray-100 dark:bg-white/6
                text-gray-500 dark:text-white/40
                border border-gray-200/60 dark:border-white/8"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 메인 사이드바 ─────────────────────────────────────────────────
export function ProtagonistSidebar({ characters, onAdd, onUpdate, onDelete }: Props) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <aside className="
      w-56 flex-shrink-0 flex flex-col
      bg-white/95 dark:bg-[#0c1220]/95
      backdrop-blur-xl
      border-r border-gray-200 dark:border-white/10
      overflow-hidden
    ">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 dark:border-white/8 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center
              bg-indigo-50 dark:bg-indigo-500/15
            ">
              <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-[11px] font-bold text-gray-800 dark:text-white/80 leading-none">
                Protagonists
              </h2>
              <p className="text-[9px] text-gray-400 dark:text-white/25 leading-none mt-0.5">
                {characters.length}명 등록됨
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Character list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {characters.map(c => (
          <CharacterCard
            key={c.id}
            character={c}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}

        {/* Add form */}
        {showAddForm && (
          <CharacterForm
            onConfirm={(data) => { onAdd(data); setShowAddForm(false); }}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {characters.length === 0 && !showAddForm && (
          <div className="text-center py-8">
            <p className="text-xs text-gray-300 dark:text-white/15">
              캐릭터를 추가해보세요
            </p>
          </div>
        )}
      </div>

      {/* Add button */}
      {!showAddForm && (
        <div className="px-3 pb-3 pt-2 flex-shrink-0 border-t border-gray-100 dark:border-white/8">
          <button
            onClick={() => setShowAddForm(true)}
            className="
              w-full py-2 rounded-xl text-xs font-semibold
              border-2 border-dashed border-gray-200 dark:border-white/10
              text-gray-400 dark:text-white/30
              hover:border-violet-300 dark:hover:border-violet-500/30
              hover:text-violet-600 dark:hover:text-violet-400
              hover:bg-violet-50/50 dark:hover:bg-violet-500/5
              flex items-center justify-center gap-1.5
              transition-all duration-150
            "
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add New Character
          </button>
        </div>
      )}
    </aside>
  );
}
