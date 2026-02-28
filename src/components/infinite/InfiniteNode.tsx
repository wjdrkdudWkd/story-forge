'use client';

/**
 * InfiniteNode.tsx — Infinite Canvas 커스텀 노드 (Phase 2 + 연결 모드)
 *
 * • 씬 제목 (더블클릭 인라인 편집)
 * • 선택지 텍스트 ↔ 연결된 씬 제목 자동 연동
 * • 호버 옵션: 선택지 블럭 연결 / 다음 장면 연결 (connect mode 진입)
 * • 선택지 vs 다음 장면: 하나의 씬은 둘 중 하나만 연결 가능
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Plus, X, Star, ChevronDown, User, Link2, ArrowRight } from 'lucide-react';
import { type Character, type Choice, colorToAlpha } from './types';

// ── 타입 ────────────────────────────────────────────────────────
export type InfiniteNodeType = 'start' | 'scene' | 'ending';

export interface InfiniteNodeData extends Record<string, unknown> {
  title: string;
  content: string;
  nodeType: InfiniteNodeType;
  povCharacterId?: string;
  choices: Choice[];
  characters: Character[];
  /** choiceId → 연결된 대상 씬의 제목 (선택지 텍스트 자동 연동에 사용) */
  connectedChoices: Record<string, string>;
  isOnActivePath: boolean;
  /** 다음 장면 연결이 이미 있는지 여부 */
  hasNextScene: boolean;
  /**
   * 하단(bottom) sourceHandle 에서 나가는 엣지 수.
   * N=0: 핸들 비가시, N=1: 중앙(50%), N≥2: 1/5 간격 분산 배치
   */
  outgoingBottomCount: number;
  /** connect-choice 모드 정보 (Canvas에서 주입) */
  connectChoiceMode?: {
    active: boolean;
    isConnectable: boolean;
    isSource: boolean;
  };
  /** connect-next-scene 모드 정보 (Canvas에서 주입) */
  connectNextSceneMode?: {
    active: boolean;
    isConnectable: boolean;
    isSource: boolean;
  };
  onUpdateTitle: (id: string, title: string) => void;
  onUpdateContent: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  onUpdatePOV: (id: string, characterId: string | undefined) => void;
  onAddChoice: (id: string) => void;
  onUpdateChoice: (nodeId: string, choiceId: string, text: string) => void;
  onDeleteChoice: (nodeId: string, choiceId: string) => void;
  onAddNodeFromChoice: (sourceId: string, choiceId: string) => void;
  onStartConnectChoiceMode: (nodeId: string) => void;
  onStartConnectNextSceneMode: (nodeId: string) => void;
  onInsertAfter: (nodeId: string) => void;
  /** choiceId → 연결된 대상 씬의 nodeId (클릭 이동용) */
  connectedNodeIds: Record<string, string>;
  /** 연결된 씬 블럭을 선택/하이라이트 */
  onSelectConnected: (targetNodeId: string) => void;
  /** 호버 시작 → z-index 최상위 */
  onHoverEnter: (nodeId: string) => void;
  /** 호버 종료 */
  onHoverLeave: () => void;
}

// ── POV Selector ──────────────────────────────────────────────────
interface POVSelectorProps {
  characters: Character[];
  povCharacterId?: string;
  accentColor: string;
  onUpdatePOV: (characterId: string | undefined) => void;
}

function POVSelector({ characters, povCharacterId, accentColor, onUpdatePOV }: POVSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pov = characters.find((c) => c.id === povCharacterId);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold transition-colors"
        style={{
          background: colorToAlpha(accentColor, 0.12),
          color: accentColor,
          border: `1px solid ${colorToAlpha(accentColor, 0.25)}`,
        }}
      >
        {pov ? (
          <>
            <span
              className="w-3 h-3 rounded-full flex-shrink-0 flex items-center justify-center text-[7px] font-bold text-white"
              style={{ background: pov.color }}
            >
              {pov.name[0]?.toUpperCase()}
            </span>
            {pov.name}
          </>
        ) : (
          <>
            <User className="w-2.5 h-2.5" />
            POV
          </>
        )}
        <ChevronDown className="w-2.5 h-2.5" />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 w-36 rounded-xl overflow-hidden shadow-xl
            bg-white dark:bg-[#0c1220]
            border border-gray-200 dark:border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { onUpdatePOV(undefined); setOpen(false); }}
            className="w-full px-2.5 py-1.5 text-left flex items-center gap-2 text-[10px]
              text-gray-500 dark:text-white/40
              hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <span className="w-3 h-3 rounded-full border border-gray-300 dark:border-white/20 flex-shrink-0" />
            없음
          </button>
          {characters.map((c) => (
            <button
              key={c.id}
              onClick={() => { onUpdatePOV(c.id); setOpen(false); }}
              className="w-full px-2.5 py-1.5 text-left flex items-center gap-2 text-[10px]
                text-gray-700 dark:text-white/70
                hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0 flex items-center justify-center text-[7px] font-bold text-white"
                style={{ background: c.color }}
              >
                {c.name[0]?.toUpperCase()}
              </span>
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Choice Row ────────────────────────────────────────────────────
interface ChoiceRowProps {
  choice: Choice;
  connectedTitle?: string;
  connectedNodeId?: string;   // 연결된 씬 nodeId
  accentColor: string;
  onUpdate: (text: string) => void;
  onDelete: () => void;
  onAddNode: () => void;
  onSelectConnected: (targetId: string) => void;
}

function ChoiceRow({
  choice,
  connectedTitle,
  connectedNodeId,
  accentColor,
  onUpdate,
  onDelete,
  onAddNode,
  onSelectConnected,
}: ChoiceRowProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(choice.text);

  useEffect(() => {
    if (!editing) setValue(choice.text);
  }, [choice.text, editing]);

  return (
    <div className="relative flex items-center gap-1.5 group/choice py-0.5">
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accentColor }} />

      {/* 연결된 씬이 있으면: 씬 제목을 클릭 가능 링크로 표시 */}
      {connectedNodeId ? (
        <button
          className="flex-1 min-w-0 text-left text-[10px] font-semibold truncate
            transition-colors hover:underline"
          style={{ color: accentColor }}
          onClick={(e) => { e.stopPropagation(); onSelectConnected(connectedNodeId); }}
          title={`→ ${connectedTitle ?? '(제목 없음)'}\n클릭하여 해당 씬 선택`}
        >
          → {connectedTitle || <span className="italic opacity-60">제목 없음</span>}
        </button>
      ) : editing ? (
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => { onUpdate(value); setEditing(false); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { onUpdate(value); setEditing(false); }
            if (e.key === 'Escape') { setValue(choice.text); setEditing(false); }
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 min-w-0 text-[10px] bg-transparent
            text-gray-700 dark:text-white/70
            border-b border-gray-300 dark:border-white/20
            focus:outline-none focus:border-violet-400"
        />
      ) : (
        <span
          className="flex-1 min-w-0 text-[10px] truncate cursor-text"
          onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
          title="더블클릭으로 편집"
        >
          {choice.text
            ? <span className="text-gray-600 dark:text-white/55">{choice.text}</span>
            : <span className="text-gray-300 dark:text-white/20 italic">선택지 입력...</span>
          }
        </span>
      )}

      <div className="flex items-center gap-0.5 opacity-0 group-hover/choice:opacity-100 transition-opacity flex-shrink-0">
        {!connectedNodeId && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddNode(); }}
            title="이 선택지에서 새 씬 추가"
            className="w-3.5 h-3.5 rounded flex items-center justify-center
              text-gray-300 hover:text-violet-500 dark:text-white/20 dark:hover:text-violet-400
              transition-colors"
          >
            <Plus className="w-2.5 h-2.5" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="선택지 삭제"
          className="w-3.5 h-3.5 rounded flex items-center justify-center
            text-gray-300 hover:text-red-500 dark:text-white/20 dark:hover:text-red-400
            transition-colors"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
      {/* Handle은 부모 컴포넌트에서 통합 렌더링 */}
    </div>
  );
}

// ── 메인 노드 컴포넌트 ────────────────────────────────────────────
export function InfiniteNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as InfiniteNodeData;
  const {
    title = '',
    nodeType,
    povCharacterId,
    choices = [],
    characters = [],
    connectedChoices = {},
    connectedNodeIds = {},
    isOnActivePath = false,
    hasNextScene = false,
    connectChoiceMode: ccm,
    connectNextSceneMode: cnm,
  } = nodeData;

  const povChar = characters.find((c) => c.id === povCharacterId);
  const accentColor = povChar?.color ?? (
    nodeType === 'start'  ? '#059669' :
    nodeType === 'ending' ? '#d97706' :
    '#7c3aed'
  );

  // ── 통합 연결 모드 상태 ───────────────────────────────────────
  const anyActive    = ccm?.active    || cnm?.active;
  const isConnectable = ccm?.isConnectable || cnm?.isConnectable;
  const isSource     = ccm?.isSource  || cnm?.isSource;

  // ── 제목 편집 ─────────────────────────────────────────────────
  const [editingTitle, setEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!editingTitle) setLocalTitle(title); }, [title, editingTitle]);
  useEffect(() => { if (editingTitle) titleInputRef.current?.focus(); }, [editingTitle]);

  const commitTitle = useCallback(() => {
    setEditingTitle(false);
    nodeData.onUpdateTitle(id, localTitle);
  }, [id, localTitle, nodeData]);

  // ── 본문 편집 ─────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [localContent, setLocalContent] = useState(nodeData.content);
  const [isHovered, setIsHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (!editing) setLocalContent(nodeData.content); }, [nodeData.content, editing]);
  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editing]);

  const handleBlur = useCallback(() => {
    setEditing(false);
    nodeData.onUpdateContent(id, localContent);
  }, [id, localContent, nodeData]);

  const showControls = (isHovered || selected) && !anyActive;

  // ── 버튼 노출 조건 (상호 배타성) ─────────────────────────────
  // 선택지 관련: next-scene 없을 때만 (start 포함 모든 씬)
  const showChoiceButtons = showControls && !hasNextScene;
  // 다음 장면 연결: 선택지 없고, next-scene 없을 때만 (start 포함)
  const showNextSceneButton = showControls && choices.length === 0 && !hasNextScene;

  // ── glow / 연결 모드 스타일 ────────────────────────────────────
  const glowStyle: React.CSSProperties = isConnectable
    ? { boxShadow: `0 0 0 3px #7c3aed, 0 0 24px 6px #7c3aed55` }
    : isOnActivePath
    ? { boxShadow: `0 0 0 2px ${accentColor}60, 0 0 20px 4px ${accentColor}28` }
    : {};

  const cursorClass = anyActive
    ? (isConnectable ? 'cursor-pointer' : 'cursor-default')
    : 'cursor-pointer';

  return (
    <div
      className={`relative w-72 rounded-xl overflow-visible bg-white/95 dark:bg-[#0f1e35]/90
        backdrop-blur-xl border-2 transition-shadow duration-150 ${cursorClass}`}
      style={{
        borderColor: isConnectable
          ? '#7c3aed'
          : `${accentColor}${selected ? 'cc' : '55'}`,
        ...glowStyle,
      }}
      onMouseEnter={() => { setIsHovered(true); nodeData.onHoverEnter(id); }}
      onMouseLeave={() => { setIsHovered(false); nodeData.onHoverLeave(); }}
      onClick={() => nodeData.onSelect(id)}
    >
      {/* ── 연결 가능 노드: 펄스 오버레이 ─────────────────────── */}
      {isConnectable && (
        <div className="absolute inset-0 rounded-xl border-2 border-violet-400 dark:border-violet-400 animate-pulse pointer-events-none z-10" />
      )}

      {/* ── 연결 가능 노드: "클릭하여 연결" 뱃지 ──────────────── */}
      {isConnectable && (
        <div className="absolute -bottom-7 left-0 right-0 flex justify-center pointer-events-none z-10">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold
            bg-violet-500 text-white shadow-lg shadow-violet-500/40">
            클릭하여 연결
          </span>
        </div>
      )}

      {/* ── 연결 출발점 뱃지 ────────────────────────────────── */}
      {isSource && (
        <div className="absolute -top-6 left-0 right-0 flex justify-center pointer-events-none z-10">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold
            bg-emerald-500/80 text-white shadow-sm">
            연결 출발점
          </span>
        </div>
      )}

      {/* ── React Flow Handles ─────────────────────────────── */}
      {/* Top/Left/Right: 엣지 라우팅 앵커용, 비가시적 */}
      <Handle type="target" position={Position.Top} id="top"
        style={{ width: 0, height: 0, opacity: 0, pointerEvents: 'none', border: 'none', background: 'transparent' }} />
      <Handle type="target" position={Position.Left} id="left"
        style={{ width: 0, height: 0, opacity: 0, pointerEvents: 'none', border: 'none', background: 'transparent' }} />
      <Handle type="source" position={Position.Right} id="right"
        style={{ width: 0, height: 0, opacity: 0, pointerEvents: 'none', border: 'none', background: 'transparent' }} />

      {/* ── 통합 하단 핸들: 선택지(choice-*) + 다음장면(bottom) 모두 Bottom으로
           N=1 → 중앙 50%, N≥2 → 1/5(20%) 간격 분산 배치 */}
      {(() => {
        const outgoing: Array<{ id: string }> = [
          ...choices.map((c) => ({ id: `choice-${c.id}` })),
          ...(hasNextScene ? [{ id: 'bottom' }] : []),
        ];
        const N = outgoing.length;
        if (N === 0) return null;
        return outgoing.map(({ id: hId }, i) => {
          const leftPct = N === 1 ? 50 : 50 + (i - (N - 1) / 2) * 20;
          return (
            <Handle
              key={hId}
              type="source"
              position={Position.Bottom}
              id={hId}
              style={{
                width: 8, height: 8,
                background: accentColor, border: '2px solid white',
                zIndex: 5, pointerEvents: 'none',
                position: 'absolute',
                bottom: 0, top: 'auto',
                left: `${leftPct}%`,
                transform: 'translateX(-50%)',
              }}
            />
          );
        });
      })()}

      {/* ── 헤더 ───────────────────────────────────────────── */}
      <div className="px-3 py-2 flex items-center justify-between border-b"
        style={{ background: colorToAlpha(accentColor, 0.07), borderColor: `${accentColor}20` }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accentColor }} />
          <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded-full"
            style={{ background: colorToAlpha(accentColor, 0.15), color: accentColor }}>
            {nodeType === 'start' ? 'START' : nodeType === 'ending' ? 'ENDING' : 'SCENE'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <POVSelector
            characters={characters}
            povCharacterId={povCharacterId}
            accentColor={accentColor}
            onUpdatePOV={(cid) => nodeData.onUpdatePOV(id, cid)}
          />
          {nodeType === 'ending' && <Star className="w-3 h-3 fill-current" style={{ color: accentColor }} />}
          {nodeType !== 'start' && showControls && (
            <button
              onClick={(e) => { e.stopPropagation(); nodeData.onDelete(id); }}
              className="w-4 h-4 flex items-center justify-center rounded
                text-gray-300 hover:text-red-500 dark:text-white/20 dark:hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── 씬 제목 ─────────────────────────────────────────── */}
      <div className="px-3 pt-2 pb-0" onClick={(e) => e.stopPropagation()}>
        {editingTitle ? (
          <input
            ref={titleInputRef}
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle();
              if (e.key === 'Escape') { setEditingTitle(false); setLocalTitle(title); }
            }}
            className="w-full text-xs font-semibold bg-transparent pb-0.5 focus:outline-none
              text-gray-800 dark:text-white/85 border-b"
            style={{ borderColor: `${accentColor}70` }}
            placeholder="씬 제목..."
          />
        ) : (
          <p
            className={`text-xs font-semibold truncate cursor-text leading-snug
              ${title ? 'text-gray-800 dark:text-white/85' : 'text-gray-300 dark:text-white/20 italic'}`}
            onDoubleClick={() => setEditingTitle(true)}
            title="더블클릭으로 제목 편집"
          >
            {title || '제목 없음 (더블클릭)'}
          </p>
        )}
      </div>

      {/* ── 본문 ────────────────────────────────────────────── */}
      <div className="px-3 py-2 min-h-[48px]">
        {editing ? (
          <textarea
            ref={textareaRef}
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            onBlur={handleBlur}
            onClick={(e) => e.stopPropagation()}
            rows={3}
            className="w-full text-xs resize-none bg-transparent
              text-gray-800 dark:text-white/80 focus:outline-none
              placeholder:text-gray-300 dark:placeholder:text-white/20 leading-relaxed"
            placeholder="장면을 묘사하세요..."
          />
        ) : (
          <p className="text-xs text-gray-700 dark:text-white/70 leading-relaxed cursor-text"
            onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
            title="더블클릭으로 편집">
            {localContent || (
              <span className="text-gray-300 dark:text-white/20 italic">더블클릭으로 편집...</span>
            )}
          </p>
        )}
      </div>

      {/* ── 선택지 + 호버 옵션 ──────────────────────────────── */}
      {(choices.length > 0 || showChoiceButtons || showNextSceneButton) && (
        <div className="px-3 pb-2.5 space-y-1 border-t" style={{ borderColor: `${accentColor}18` }}>
          {choices.length > 0 && (
            <p className="text-[9px] font-semibold uppercase tracking-wider mt-2"
              style={{ color: `${accentColor}90` }}>
              선택지
            </p>
          )}
          {choices.map((choice) => (
            <ChoiceRow
              key={choice.id}
              choice={choice}
              connectedTitle={connectedChoices[choice.id]}
              connectedNodeId={connectedNodeIds[choice.id]}
              accentColor={accentColor}
              onUpdate={(text) => nodeData.onUpdateChoice(id, choice.id, text)}
              onDelete={() => nodeData.onDeleteChoice(id, choice.id)}
              onAddNode={() => nodeData.onAddNodeFromChoice(id, choice.id)}
              onSelectConnected={(tid) => nodeData.onSelectConnected(tid)}
            />
          ))}

          {/* ── 호버 버튼들 ─────────────────────────────────── */}
          {(showChoiceButtons || showNextSceneButton) && (
            <div className="flex flex-col gap-1 mt-1.5">
              {/* 선택지 관련 버튼 (next-scene 없을 때만) */}
              {showChoiceButtons && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); nodeData.onAddChoice(id); }}
                    className="flex items-center gap-1 text-[10px] font-medium transition-colors opacity-60 hover:opacity-100"
                    style={{ color: accentColor }}
                  >
                    <Plus className="w-2.5 h-2.5" />
                    선택지 추가
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); nodeData.onStartConnectChoiceMode(id); }}
                    className="flex items-center gap-1 text-[10px] font-medium transition-colors opacity-60 hover:opacity-100"
                    style={{ color: '#059669' }}
                    title="연결되지 않은 블럭을 선택하여 선택지로 연결"
                  >
                    <Link2 className="w-2.5 h-2.5" />
                    선택지 블럭 연결
                  </button>
                </>
              )}

              {/* 다음 장면 추가 + 연결 (선택지 없고 next-scene 없을 때만) */}
              {showNextSceneButton && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); nodeData.onInsertAfter(id); }}
                    className="flex items-center gap-1 text-[10px] font-medium transition-colors opacity-60 hover:opacity-100"
                    style={{ color: '#059669' }}
                    title="아래에 새 장면을 자동으로 생성하여 연결"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    다음 장면 추가
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); nodeData.onStartConnectNextSceneMode(id); }}
                    className="flex items-center gap-1 text-[10px] font-medium transition-colors opacity-60 hover:opacity-100"
                    style={{ color: '#0891b2' }}
                    title="선택지 없는 블럭을 선택하여 다음 장면으로 연결"
                  >
                    <ArrowRight className="w-2.5 h-2.5" />
                    다음 장면 연결
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
