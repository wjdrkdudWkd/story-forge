/**
 * BlockNodeCard.tsx
 *
 * React Flow 커스텀 노드 - 세로형 캔버스의 단일 블록 카드
 *
 * [경로 선택 시스템]
 * - isActivePath: 현재 확정 경로에 속하는 노드 → 정상 표시
 * - !isActivePath: 대안/비활성 경로 → grayscale + opacity:0.45
 * - isVariantSelected(=이 블록의 선택 variant): 파란 테두리 강조
 * - isNodeSelected(=Inspector 패널 선택): ring-2 blue Outline
 *
 * [4방향 핸들 (Req #2)]
 * - Top    (target)  : 위에서 들어오는 수직 흐름
 * - Bottom (source)  : 아래로 나가는 수직 흐름 + "AI 블록 생성" 버튼
 * - Left   (target)  : 브랜치 / 대안 경로 수신
 * - Right  (source)  : 브랜치 / 대안 경로 발신 (v2 채택 시 다음 블록 Right handle로 연결)
 *
 * [인라인 편집]
 * - 헤드라인/훅 더블클릭 → 즉시 편집 → blocksByIndex 반영
 */

"use client";

import { useState, useRef, memo, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { BlockOverviewVariant, ExpandPreset } from "@/types/blocks";

// ─────────────────────────────────────────────────────────────────
// 노드 데이터 타입
// ─────────────────────────────────────────────────────────────────

export interface BlockNodeData extends Record<string, unknown> {
  /** 블록 인덱스 (1-based) */
  blockIndex: number;
  /** 막 번호 (1-based) */
  actIndex: number;
  /** 블록 스펙 타이틀 */
  specTitle: string;
  /** 블록 목적 */
  specPurpose: string;
  /** 이 노드가 나타내는 개요 variant */
  variant: BlockOverviewVariant;
  /** 현재 이 블록에서 선택된 variant id */
  selectedOverviewId: string;
  /** 총 overview variant 수 (뱃지 표시용) */
  variantCount: number;
  /** 노드 유형: 메인 트렁크 vs 브랜치 */
  isBranch: boolean;
  /** 쿨다운 중 여부 */
  isCoolingDown: boolean;
  /**
   * 현재 확정 경로에 속하는지 여부
   * - true  → 정상 표시
   * - false → grayscale + opacity 처리 (대안/비활성 경로)
   */
  isActivePath: boolean;
  /**
   * Inspector 패널과 연동되는 "이 노드가 Inspector에서 선택된 상태"
   * true → 파란 ring Outline 강조
   */
  isNodeSelected: boolean;
  /**
   * 이 노드 하단에 "새 AI 블록 생성" 버튼 표시 여부
   * - true: 다음 연결이 없거나 사용자가 새 블록 삽입을 원할 수 있는 상태
   */
  canInsertAfter: boolean;
  /**
   * 하단(bottom) sourceHandle 에서 나가는 확정 경로 엣지 수.
   * N=0: 핸들 숨김, N=1: 중앙(50%), N≥2: 1/5 간격 분산 배치
   */
  outgoingBottomCount: number;
  /**
   * 이 노드 다음에 삽입될 행(Row) 번호.
   * computeLayout에서 계산하여 전달. 버튼 문구에 활용됨.
   * (예: 현재 rowIndex=3 → nextRowIndex=4)
   */
  nextRowIndex?: number;
  /** 이 노드를 Inspector 선택 노드로 설정 */
  onNodeSelect: () => void;
  /** 클릭 → Inspector 패널 오픈 */
  onCardClick: () => void;
  /** 이 variant를 현재 블록의 선택 variant로 설정 → 에지 재연결 트리거 */
  onSelectVariant: () => void;
  /** 재생성 요청 */
  onRegenerate: () => void;
  /** 개요 확장 요청 */
  onExpand: (preset: ExpandPreset) => void;
  /** 하단 핸들 "AI 블록 생성" 클릭 */
  onInsertAfter: () => void;
  /** 인라인 편집: 헤드라인 변경 저장 */
  onUpdateHeadline: (newHeadline: string) => void;
  /** 인라인 편집: 훅 변경 저장 */
  onUpdateHooks: (newHooks: string[]) => void;
}

export type BlockNodeType = {
  id: string;
  type: "blockNode";
  position: { x: number; y: number };
  data: BlockNodeData;
};

// ─────────────────────────────────────────────────────────────────
// Preset 옵션
// ─────────────────────────────────────────────────────────────────

const PRESET_OPTIONS: { value: ExpandPreset; label: string }[] = [
  { value: "more_specific", label: "구체화" },
  { value: "raise_stakes", label: "위험 상승" },
  { value: "add_emotion", label: "감정 추가" },
  { value: "add_twist", label: "반전 추가" },
  { value: "add_dialogue", label: "대사 추가" },
];

// ─────────────────────────────────────────────────────────────────
// 핸들 공통 스타일 헬퍼
// ─────────────────────────────────────────────────────────────────

/** 확정 경로 여부에 따른 핸들 색상 반환 */
function handleBg(isActive: boolean): string {
  return isActive ? "#6366f1" : "#9ca3af"; // Indigo-500 vs Gray-400
}

// Top/Bottom 핸들 공통 스타일 (수직 흐름)
const HANDLE_BASE: React.CSSProperties = {
  width: 10,
  height: 10,
  border: "2px solid #fff",
  zIndex: 10,
};

// Left/Right 핸들 공통 스타일 (브랜치 수평 흐름)
const SIDE_HANDLE_BASE: React.CSSProperties = {
  width: 8,
  height: 8,
  border: "2px solid #fff",
  zIndex: 10,
  // 카드 세로 중앙(수직 방향)에서 헤더 아래쪽 정도로 오프셋
  top: "38px",
  transform: "translateY(0)",
};

// ─────────────────────────────────────────────────────────────────
// BlockNodeCard Component
// ─────────────────────────────────────────────────────────────────

function BlockNodeCardInner({ data }: NodeProps) {
  const d = data as unknown as BlockNodeData;

  const [showActions, setShowActions] = useState(false);
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [showInsertBtn, setShowInsertBtn] = useState(false);

  // ── 인라인 헤드라인 편집 ──────────────────────────────────────
  const [isEditingHeadline, setIsEditingHeadline] = useState(false);
  const [headlineDraft, setHeadlineDraft] = useState(d.variant.headline);
  const headlineRef = useRef<HTMLTextAreaElement>(null);

  // ── 인라인 훅 편집 ───────────────────────────────────────────
  const [editingHookIdx, setEditingHookIdx] = useState<number | null>(null);
  const [hookDraft, setHookDraft] = useState("");

  // 이 노드가 확정 경로에 있는지 → isActivePath로 직접 판단
  // (selectedOverviewId 의존 완전 제거 — 위치 교체 버그 근원)

  // ── source 뱃지 ──────────────────────────────────────────────
  const sourceBadgeClass =
    d.variant.source === "initial"
      ? "bg-gray-100 text-gray-600"
      : d.variant.source === "regenerate"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-purple-100 text-purple-700";

  // ── 헤드라인 편집 시작 ─────────────────────────────────────────
  const startEditHeadline = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (d.isBranch && !d.isActivePath) return;
      setHeadlineDraft(d.variant.headline);
      setIsEditingHeadline(true);
      setTimeout(() => {
        headlineRef.current?.focus();
        headlineRef.current?.select();
      }, 20);
    },
    [d.isBranch, d.variant.headline, d.isActivePath]
  );

  const commitHeadline = useCallback(() => {
    const trimmed = headlineDraft.trim();
    if (trimmed && trimmed !== d.variant.headline) {
      d.onUpdateHeadline(trimmed);
    }
    setIsEditingHeadline(false);
  }, [headlineDraft, d]);

  // ── 훅 편집 시작 ─────────────────────────────────────────────
  const startEditHook = useCallback(
    (idx: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (d.isBranch && !d.isActivePath) return;
      setHookDraft(d.variant.hooks[idx] ?? "");
      setEditingHookIdx(idx);
    },
    [d.isBranch, d.variant.hooks, d.isActivePath]
  );

  const commitHook = useCallback(
    (idx: number) => {
      const trimmed = hookDraft.trim();
      const newHooks = [...d.variant.hooks];
      if (trimmed) {
        newHooks[idx] = trimmed;
      } else {
        newHooks.splice(idx, 1);
      }
      d.onUpdateHooks(newHooks);
      setEditingHookIdx(null);
    },
    [hookDraft, d]
  );

  // ── 카드 클릭 → Inspector ────────────────────────────────────
  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isEditingHeadline || editingHookIdx !== null) return;
      d.onNodeSelect();
    },
    [isEditingHeadline, editingHookIdx, d]
  );

  // ── 비활성 경로 시각 처리 ────────────────────────────────────
  // isActivePath=false: grayscale 필터 + opacity 50%
  const inactiveStyle: React.CSSProperties = !d.isActivePath
    ? { filter: "grayscale(0.85)", opacity: 0.45 }
    : {};

  // ── Inspector ring outline ────────────────────────────────────
  const nodeOutlineClass = d.isNodeSelected
    ? "ring-2 ring-indigo-500 ring-offset-1 shadow-indigo-300 shadow-lg"
    : "";

  // ── 카드 테두리 색 ────────────────────────────────────────────
  // isActivePath=true → Indigo 실선 (확정 경로)
  // isActivePath=false & branch → 점선 회색
  // isActivePath=false & main   → 회색 테두리
  const cardBorderClass = d.isActivePath
    ? "border-indigo-500 shadow-indigo-200 shadow-md"
    : d.isBranch
      ? "border-dashed border-gray-300 hover:border-gray-400"
      : "border-gray-200 hover:border-gray-400 hover:shadow-md";

  return (
    <div style={inactiveStyle} className="relative">

      {/* ── Top Handle (target) — 엣지 앵커용, 비가시 ────────────── */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ width: 0, height: 0, opacity: 0, pointerEvents: 'none', border: 'none', background: 'transparent' }}
      />

      {/* ── Left Handle (target) — 엣지 앵커용, 비가시 ──────────── */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ width: 0, height: 0, opacity: 0, pointerEvents: 'none', border: 'none', background: 'transparent' }}
      />

      {/* 카드 본체 */}
      <div
        className={[
          "relative w-[220px] rounded-lg border-2 bg-white shadow-sm cursor-pointer transition-all duration-150",
          nodeOutlineClass,
          cardBorderClass,
        ].join(" ")}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => {
          setShowActions(false);
          setShowPresetMenu(false);
        }}
        onClick={handleCardClick}
      >
        {/* 헤더 */}
        <div
          className={[
            "px-3 py-2 rounded-t-lg border-b",
            d.isBranch ? "bg-gray-50 border-gray-200" : "bg-slate-50 border-gray-200",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-1">
            <span className="text-xs font-semibold text-gray-700 truncate leading-tight">
              {d.blockIndex}. {d.specTitle}
            </span>
            <div className="flex gap-1 flex-shrink-0">
              {!d.isBranch && d.variantCount > 1 && (
                <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 rounded font-medium">
                  v{d.variantCount}
                </span>
              )}
              <span className={`text-[10px] px-1.5 rounded font-medium ${sourceBadgeClass}`}>
                {d.variant.source === "initial" ? "초기" : d.variant.source === "regenerate" ? "재생성" : "확장"}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 truncate mt-0.5">{d.specPurpose}</p>
        </div>

        {/* 콘텐츠 */}
        <div className="px-3 py-2.5 space-y-1.5">
          {/* Headline */}
          {isEditingHeadline ? (
            <textarea
              ref={headlineRef}
              value={headlineDraft}
              rows={3}
              onChange={(e) => setHeadlineDraft(e.target.value)}
              onBlur={commitHeadline}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitHeadline(); }
                if (e.key === "Escape") setIsEditingHeadline(false);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-xs text-gray-800 leading-relaxed font-medium resize-none
                         border border-indigo-400 rounded p-1 focus:outline-none focus:ring-1
                         focus:ring-indigo-500 bg-indigo-50"
            />
          ) : (
            <p
              className="text-xs text-gray-800 leading-relaxed line-clamp-3 font-medium
                         cursor-text hover:bg-gray-50 rounded px-0.5 -mx-0.5 transition-colors"
              onDoubleClick={startEditHeadline}
              title="더블클릭하여 편집"
            >
              {d.variant.headline}
            </p>
          )}

          {/* Hooks */}
          {d.variant.hooks.length > 0 && (
            <div className="space-y-0.5 pt-1 border-t border-gray-100">
              {d.variant.hooks.slice(0, 2).map((hook, idx) =>
                editingHookIdx === idx ? (
                  <input
                    key={idx}
                    autoFocus
                    value={hookDraft}
                    onChange={(e) => setHookDraft(e.target.value)}
                    onBlur={() => commitHook(idx)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitHook(idx);
                      if (e.key === "Escape") setEditingHookIdx(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-[10px] text-gray-700 border border-indigo-400 rounded
                               px-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-indigo-50"
                  />
                ) : (
                  <p
                    key={idx}
                    className="text-[10px] text-gray-500 truncate cursor-text
                               hover:bg-gray-50 rounded px-0.5 -mx-0.5"
                    onDoubleClick={(e) => startEditHook(idx, e)}
                    title="더블클릭하여 편집"
                  >
                    → {hook}
                  </p>
                )
              )}
              {d.variant.hooks.length > 2 && (
                <p className="text-[10px] text-gray-400">+{d.variant.hooks.length - 2}개 더...</p>
              )}
            </div>
          )}
        </div>

        {/* "이 경로 선택" 버튼 — 비활성 경로인 모든 노드(main 포함)에 표시 */}
        {!d.isActivePath && (
          <div className="px-3 pb-2.5">
            <button
              className="w-full text-[10px] py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600
                         rounded border border-indigo-200 transition-colors font-medium"
              onClick={(e) => {
                e.stopPropagation();
                d.onSelectVariant();
              }}
            >
              ✓ 이 경로 선택
            </button>
          </div>
        )}

        {/* 확정 경로 인디케이터 — isActivePath 기준 */}
        {d.isActivePath && (
          <div className="px-3 pb-2 flex items-center gap-1">
            <span className="text-[10px] text-indigo-600 font-semibold">✓ 확정 경로</span>
            {d.isBranch && (
              <span className="text-[10px] bg-violet-100 text-violet-500 px-1 rounded">v2+</span>
            )}
          </div>
        )}

        {/* Hover 액션 버튼 */}
        {showActions && !isEditingHeadline && editingHookIdx === null && (
          <div
            className="absolute top-2 right-2 flex gap-1 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 재생성 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!d.isCoolingDown) d.onRegenerate();
              }}
              className="px-2 py-1 text-[11px] bg-white border border-gray-300 rounded shadow-sm
                         hover:bg-yellow-50 hover:border-yellow-400 disabled:opacity-40
                         disabled:cursor-not-allowed transition-colors"
              disabled={d.isCoolingDown}
              title={d.isCoolingDown ? "잠시 후 다시 시도" : "재생성 → 새 대안 경로 생성"}
            >
              🔄
            </button>

            {/* 발전 */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!d.isCoolingDown) setShowPresetMenu((v) => !v);
                }}
                className="px-2 py-1 text-[11px] bg-white border border-gray-300 rounded shadow-sm
                           hover:bg-purple-50 hover:border-purple-400 disabled:opacity-40
                           disabled:cursor-not-allowed transition-colors"
                disabled={d.isCoolingDown}
                title={d.isCoolingDown ? "잠시 후 다시 시도" : "발전시키기"}
              >
                ✨
              </button>
              {showPresetMenu && !d.isCoolingDown && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200
                               rounded-lg shadow-lg z-20 min-w-[110px] py-1">
                  {PRESET_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        d.onExpand(opt.value);
                        setShowPresetMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-[11px] text-left hover:bg-gray-50 text-gray-700"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Inspector */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                d.onNodeSelect();
              }}
              className="px-2 py-1 text-[11px] bg-white border border-gray-300 rounded shadow-sm
                         hover:bg-indigo-50 hover:border-indigo-400 transition-colors"
              title="상세 정보"
            >
              📋
            </button>
          </div>
        )}
      </div>

      {/* ── Right Handle (source) — 엣지 앵커용, 비가시 ──────────── */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ width: 0, height: 0, opacity: 0, pointerEvents: 'none', border: 'none', background: 'transparent' }}
      />

      {/* ── 하단 핸들 + AI생성 버튼 영역 ────────────────────────── */}
      {/*
       * N = outgoingBottomCount
       *  N=0 → 핸들 비가시(엣지 앵커용으로 유지), 버튼 표시 가능
       *  N=1 → 중앙(50%) 단일 핸들
       *  N≥2 → 중앙 기준 1/5(20%) 간격 분산 배치
       *
       * id='bottom' 핸들은 항상 렌더링(엣지 sourceHandle='bottom' 앵커용)
       * 추가 핸들: id='bottom-1', 'bottom-2' ...
       */}
      <div
        className="relative flex justify-center pb-6"
        onMouseEnter={() => setShowInsertBtn(true)}
        onMouseLeave={() => setShowInsertBtn(false)}
      >
        {/* 주 bottom 핸들 — 항상 존재(엣지 앵커), outgoingBottomCount≥1 일 때만 가시 */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          style={{
            ...HANDLE_BASE,
            background: handleBg(d.isActivePath),
            position: "absolute",
            bottom: 0,
            left: d.outgoingBottomCount >= 2
              ? `${50 + (0 - (d.outgoingBottomCount - 1) / 2) * 20}%`
              : "50%",
            top: "auto",
            transform: "translateX(-50%)",
            pointerEvents: "none",
            ...(d.outgoingBottomCount === 0
              ? { width: 0, height: 0, opacity: 0, border: "none" }
              : {}),
          }}
        />

        {/* N≥2 추가 핸들 분산 배치 */}
        {d.outgoingBottomCount >= 2 &&
          Array.from({ length: d.outgoingBottomCount - 1 }, (_, i) => {
            const N = d.outgoingBottomCount;
            const leftPct = 50 + ((i + 1) - (N - 1) / 2) * 20;
            return (
              <Handle
                key={`bottom-${i + 1}`}
                type="source"
                position={Position.Bottom}
                id={`bottom-${i + 1}`}
                style={{
                  ...HANDLE_BASE,
                  background: handleBg(d.isActivePath),
                  position: "absolute",
                  bottom: 0,
                  left: `${leftPct}%`,
                  top: "auto",
                  transform: "translateX(-50%)",
                  pointerEvents: "none",
                }}
              />
            );
          })}

        {/* "+ 이어지는 N장면 블록 생성" 버튼 — 핸들 위 hover 영역 겹치게 배치 */}
        {d.canInsertAfter && (
          <button
            className={[
              "absolute left-1/2 -translate-x-1/2",
              "flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold",
              "bg-violet-600 text-white rounded-full shadow-md",
              "hover:bg-violet-700 whitespace-nowrap",
              "pointer-events-auto",
              "transition-opacity transition-transform duration-[120ms]",
              showInsertBtn
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-1 pointer-events-none",
            ].join(" ")}
            style={{ bottom: "4px" }}
            onClick={(e) => {
              e.stopPropagation();
              d.onInsertAfter();
            }}
            title="이어지는 다음 장면 블록 생성"
          >
            + 이어지는 {d.nextRowIndex != null ? `${d.nextRowIndex}장면 ` : ""}블록 생성
          </button>
        )}
      </div>
    </div>
  );
}

export const BlockNodeCard = memo(BlockNodeCardInner);
