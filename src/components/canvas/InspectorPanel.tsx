/**
 * InspectorPanel.tsx
 *
 * BlocksCanvas 우측에 오버레이로 표시되는 인스펙터 패널
 *
 * 기능:
 * - 선택된 노드의 블록 인덱스, 막 번호, 제목, 목적, 헤드라인, 훅 전체를 표시
 * - 헤드라인 / 훅 / 제목 / 목적 인라인 편집 (→ blocksByIndex 즉시 반영)
 * - 재생성(🔄) / 발전(✨) 버튼 (쿨다운 지원)
 * - 닫기 버튼
 */

"use client";

import { useState, useCallback } from "react";
import type { BlockNode, BlockSpec, ExpandPreset } from "@/types/blocks";

// ─────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────

export interface InspectorPanelProps {
  /** 선택된 블록 인덱스 */
  blockIndex: number;
  /** 선택된 블록 스펙 */
  spec: BlockSpec;
  /** 선택된 블록 노드 (overviewVariants 포함) */
  node: BlockNode;
  /** 쿨다운 중 여부 */
  isCoolingDown: boolean;
  /** Inspector 닫기 */
  onClose: () => void;
  /** 헤드라인 변경 저장 */
  onUpdateHeadline: (newHeadline: string) => void;
  /** 훅 변경 저장 */
  onUpdateHooks: (newHooks: string[]) => void;
  /** 제목 변경 저장 */
  onUpdateTitle: (newTitle: string) => void;
  /** 재생성 */
  onRegenerate: () => void;
  /** 발전(확장) */
  onExpand: (preset: ExpandPreset) => void;
}

// ─────────────────────────────────────────────────────────────────
// 편집 가능한 텍스트 필드
// ─────────────────────────────────────────────────────────────────

interface EditableFieldProps {
  label: string;
  value: string;
  multiline?: boolean;
  rows?: number;
  onSave: (v: string) => void;
}

function EditableField({ label, value, multiline = false, rows = 2, onSave }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = useCallback(() => {
    const t = draft.trim();
    if (t && t !== value) onSave(t);
    else setDraft(value); // 변경 없으면 복원
    setEditing(false);
  }, [draft, value, onSave]);

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      {editing ? (
        multiline ? (
          <textarea
            autoFocus
            rows={rows}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commit(); }
              if (e.key === "Escape") { setDraft(value); setEditing(false); }
            }}
            className="w-full text-xs text-gray-800 border border-blue-400 rounded p-1.5
                       focus:outline-none focus:ring-1 focus:ring-blue-500 bg-blue-50 resize-none"
          />
        ) : (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") { setDraft(value); setEditing(false); }
            }}
            className="w-full text-xs text-gray-800 border border-blue-400 rounded p-1.5
                       focus:outline-none focus:ring-1 focus:ring-blue-500 bg-blue-50"
          />
        )
      ) : (
        <p
          className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap cursor-text
                     hover:bg-gray-100 rounded p-1 -m-1 transition-colors"
          onDoubleClick={() => { setDraft(value); setEditing(true); }}
          title="더블클릭하여 편집"
        >
          {value || <span className="text-gray-400 italic">없음</span>}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 별점 컴포넌트 (정보 표시용)
// ─────────────────────────────────────────────────────────────────

interface StarRatingProps {
  value: number; // 0 ~ 5
  onChange: (v: number) => void;
}

function StarRating({ value, onChange }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          className={[
            "text-lg leading-none transition-colors",
            (hovered || value) >= star ? "text-yellow-400" : "text-gray-300",
          ].join(" ")}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star === value ? 0 : star)}
          title={`${star}점`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 프리셋 옵션
// ─────────────────────────────────────────────────────────────────

const PRESET_OPTIONS: { value: ExpandPreset; label: string; icon: string }[] = [
  { value: "more_specific", label: "구체화", icon: "🎯" },
  { value: "raise_stakes", label: "위험 상승", icon: "⚡" },
  { value: "add_emotion", label: "감정 추가", icon: "💭" },
  { value: "add_twist", label: "반전 추가", icon: "🔀" },
  { value: "add_dialogue", label: "대사 추가", icon: "💬" },
];

// ─────────────────────────────────────────────────────────────────
// InspectorPanel
// ─────────────────────────────────────────────────────────────────

export function InspectorPanel({
  blockIndex,
  spec,
  node,
  isCoolingDown,
  onClose,
  onUpdateHeadline,
  onUpdateHooks,
  onUpdateTitle,
  onRegenerate,
  onExpand,
}: InspectorPanelProps) {
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  // 별점 상태 (로컬, 드래프트에 저장하지 않음 — 향후 확장 가능)
  const [stars, setStars] = useState(0);
  // 훅 편집 상태
  const [editingHookIdx, setEditingHookIdx] = useState<number | null>(null);
  const [hookDraft, setHookDraft] = useState("");

  const selectedVariant = node.overviewVariants.find(
    (v) => v.id === node.selectedOverviewId
  );

  if (!selectedVariant) return null;

  // 막 번호 → 색상 맵핑
  const actColors: Record<number, string> = {
    1: "bg-blue-100 text-blue-700",
    2: "bg-green-100 text-green-700",
    3: "bg-yellow-100 text-yellow-700",
    4: "bg-orange-100 text-orange-700",
    5: "bg-purple-100 text-purple-700",
  };
  const actColor = actColors[spec.actIndex] ?? "bg-gray-100 text-gray-600";

  const commitHook = (idx: number) => {
    const trimmed = hookDraft.trim();
    const newHooks = [...selectedVariant.hooks];
    if (trimmed) {
      newHooks[idx] = trimmed;
    } else {
      newHooks.splice(idx, 1);
    }
    onUpdateHooks(newHooks);
    setEditingHookIdx(null);
  };

  return (
    <div
      className="absolute right-0 top-0 h-full w-72 bg-white border-l border-gray-200
                 shadow-xl z-20 flex flex-col overflow-hidden"
      style={{ backdropFilter: "blur(4px)" }}
    >
      {/* ── 헤더 ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-700">블록 #{blockIndex}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${actColor}`}>
            Act {spec.actIndex}
          </span>
          {node.overviewVariants.length > 1 && (
            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">
              v{node.overviewVariants.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
          title="닫기"
        >
          ✕
        </button>
      </div>

      {/* ── 본문 스크롤 영역 ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

        {/* 별점 */}
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">평가</p>
          <StarRating value={stars} onChange={setStars} />
        </div>

        {/* 제목 (스펙 타이틀 편집) */}
        <EditableField
          label="블록 제목"
          value={spec.title}
          onSave={onUpdateTitle}
        />

        {/* 목적 */}
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">서사적 역할</p>
          <p className="text-xs text-gray-600 leading-relaxed">{spec.purpose}</p>
        </div>

        {/* 헤드라인 (편집 가능) */}
        <EditableField
          label="헤드라인"
          value={selectedVariant.headline}
          multiline
          rows={3}
          onSave={onUpdateHeadline}
        />

        {/* 훅 목록 (편집 가능) */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            후크 포인트 ({selectedVariant.hooks.length}개)
          </p>
          {selectedVariant.hooks.map((hook, idx) => (
            <div key={idx} className="group flex items-start gap-2">
              <span className="text-[10px] text-gray-400 mt-1 flex-shrink-0">→</span>
              {editingHookIdx === idx ? (
                <input
                  autoFocus
                  value={hookDraft}
                  onChange={(e) => setHookDraft(e.target.value)}
                  onBlur={() => commitHook(idx)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitHook(idx);
                    if (e.key === "Escape") setEditingHookIdx(null);
                  }}
                  className="flex-1 text-xs border border-blue-400 rounded px-1.5 py-0.5
                             focus:outline-none focus:ring-1 focus:ring-blue-500 bg-blue-50"
                />
              ) : (
                <p
                  className="flex-1 text-xs text-gray-700 leading-relaxed cursor-text
                             hover:bg-gray-100 rounded px-1 -mx-1 transition-colors"
                  onDoubleClick={() => {
                    setHookDraft(hook);
                    setEditingHookIdx(idx);
                  }}
                  title="더블클릭하여 편집"
                >
                  {hook}
                </p>
              )}
            </div>
          ))}
          {selectedVariant.hooks.length === 0 && (
            <p className="text-xs text-gray-400 italic">훅 없음</p>
          )}
        </div>

        {/* 필수 요소 / 전달 요소 (스펙) */}
        {spec.required && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">필수 요소</p>
            <p className="text-xs text-gray-600 bg-amber-50 rounded p-2 border border-amber-100">{spec.required}</p>
          </div>
        )}
        {spec.deliver && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">다음으로 전달</p>
            <p className="text-xs text-gray-600 bg-green-50 rounded p-2 border border-green-100">{spec.deliver}</p>
          </div>
        )}

        {/* variant 목록 */}
        {node.overviewVariants.length > 1 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
              대안 버전 ({node.overviewVariants.length}개)
            </p>
            {node.overviewVariants.map((v, idx) => (
              <div
                key={v.id}
                className={[
                  "p-2 rounded border text-xs",
                  v.id === node.selectedOverviewId
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-200 bg-gray-50",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-semibold text-gray-600">v{idx + 1}</span>
                  <span className={[
                    "text-[10px] px-1 rounded",
                    v.source === "initial" ? "bg-gray-100 text-gray-500" :
                    v.source === "regenerate" ? "bg-yellow-100 text-yellow-600" :
                    "bg-purple-100 text-purple-600",
                  ].join(" ")}>
                    {v.source === "initial" ? "초기" : v.source === "regenerate" ? "재생성" : "확장"}
                  </span>
                </div>
                <p className="text-gray-700 line-clamp-2">{v.headline}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 액션 버튼 푸터 ────────────────────────────────────── */}
      <div className="border-t border-gray-100 px-4 py-3 space-y-2 bg-gray-50">
        {/* 재생성 */}
        <button
          onClick={onRegenerate}
          disabled={isCoolingDown}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium
                     bg-white border border-gray-300 rounded-lg hover:bg-yellow-50
                     hover:border-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
        >
          🔄 재생성
          {isCoolingDown && <span className="text-[10px] text-gray-400">(쿨다운)</span>}
        </button>

        {/* 발전시키기 (프리셋 메뉴) */}
        <div className="relative">
          <button
            onClick={() => setShowPresetMenu((v) => !v)}
            disabled={isCoolingDown}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium
                       bg-white border border-gray-300 rounded-lg hover:bg-purple-50
                       hover:border-purple-400 disabled:opacity-40 disabled:cursor-not-allowed
                       transition-colors"
          >
            ✨ 발전시키기 ▾
          </button>
          {showPresetMenu && !isCoolingDown && (
            <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-gray-200
                            rounded-lg shadow-lg z-30 py-1">
              {PRESET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onExpand(opt.value);
                    setShowPresetMenu(false);
                  }}
                  className="w-full px-4 py-2 text-xs text-left hover:bg-gray-50 text-gray-700
                             flex items-center gap-2"
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
