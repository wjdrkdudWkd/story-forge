'use client';

/**
 * InfiniteCanvas.tsx — 무한 노드 캔버스 (Phase 2 + Ghost + Context Menu + Connect Mode)
 *
 * • Ghost Node: 헤더 "+ SCENE 추가" 버튼 클릭 시 마우스를 따라다니는 반투명 노드 프리뷰
 * • 우클릭 컨텍스트 메뉴: 빈 캔버스 우클릭 → "+ SCENE 추가" 메뉴 노출
 * • 씬 제목 ↔ 선택지 텍스트 자동 연동
 * • connect-choice mode: 기존 블럭을 선택지로 연결
 * • connect-next-scene mode: 기존 블럭을 다음 장면으로 연결 (선택지와 상호 배타)
 */

import {
  useCallback, useMemo, useEffect, useRef, useState,
} from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus } from 'lucide-react';

import {
  InfiniteNodeComponent,
  type InfiniteNodeData,
  type InfiniteNodeType,
} from './InfiniteNode';
import type { CharacterDNA, SeedItem } from './PreBuildModal';
import type { Character, Choice } from './types';

// ── 레이아웃 상수 ────────────────────────────────────────────────
const NODE_W = 288;  // w-72 = 288px
const H_GAP  = 140;
const CHOICE_Y_GAP = 240;

// ── 유틸 ────────────────────────────────────────────────────────
function genId() {
  return `inf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function makeEdge(
  sourceId: string,
  targetId: string,
  sourceHandle: string,
  targetHandle: string,
  accentColor = '#7c3aed',
  label?: string,
): Edge {
  return {
    id: `e_${sourceId}_${targetId}_${sourceHandle}`,
    source: sourceId,
    target: targetId,
    sourceHandle,
    targetHandle,
    type: 'smoothstep',
    label: label || undefined,
    labelStyle: { fontSize: 10, fill: accentColor },
    labelBgStyle: { fillOpacity: 0.85 },
    style: {
      stroke: accentColor,
      strokeWidth: 2,
      opacity: 0.7,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: accentColor,
    },
    data: { accentColor },
  };
}

// ── Ghost 위치 타입 ──────────────────────────────────────────────
interface GhostPos {
  clientX: number;
  clientY: number;
  containerX: number;
  containerY: number;
}

// ── Context Menu 위치 타입 ───────────────────────────────────────
interface ContextMenuState {
  containerX: number;
  containerY: number;
  flowX: number;
  flowY: number;
}

// ── Connect Mode 타입 ────────────────────────────────────────────
type ConnectMode = { sourceNodeId: string; type: 'choice' | 'next' } | null;

// ── Props ────────────────────────────────────────────────────────
export interface InfiniteCanvasProps {
  dna: CharacterDNA;
  seeds: SeedItem[];
  characters: Character[];
  onNodeSelect: (node: Node | null) => void;
  onEndingCountChange: (count: number) => void;
  pendingCard: { content: string } | null;
  onPendingCardConsumed: () => void;
  isGhostPlacing: boolean;
  onGhostPlacingEnd: () => void;
}

// ── nodeTypes 외부 선언 (리렌더 방지) ────────────────────────────
const nodeTypes = { infiniteNode: InfiniteNodeComponent };

// ── Inner Flow (ReactFlowProvider 내부) ──────────────────────────
function FlowInner({
  dna,
  characters,
  onNodeSelect,
  onEndingCountChange,
  pendingCard,
  onPendingCardConsumed,
  isGhostPlacing,
  onGhostPlacingEnd,
}: InfiniteCanvasProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const [ghostPos, setGhostPos] = useState<GhostPos | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // 통합 connect 모드 (choice | next)
  const [connectMode, setConnectMode] = useState<ConnectMode>(null);
  const connectModeRef = useRef<ConnectMode>(null);

  // 호버 중인 노드 ID (z-index 최상위 제어)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const { screenToFlowPosition, fitView, getNode } = useReactFlow();

  // 초기 시작 노드
  const initNode: Node = useMemo(() => ({
    id: 'start',
    type: 'infiniteNode',
    position: { x: 0, y: 0 },
    data: {
      title: '',
      content: `${dna.name}의 이야기 시작\n목표: ${dna.goal}`,
      nodeType: 'start' as InfiniteNodeType,
      choices: [] as Choice[],
      characters: [] as Character[],
    },
    deletable: false,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState([initNode]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // refs 동기화
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);
  useEffect(() => { connectModeRef.current = connectMode; }, [connectMode]);

  // ── 부모 상태 동기화 ─────────────────────────────────────────
  useEffect(() => {
    const found = nodesRef.current.find((n) => n.id === selectedNodeId) ?? null;
    onNodeSelect(found);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId]);

  const endingCount = useMemo(
    () => nodes.filter((n) => (n.data as { nodeType: string }).nodeType === 'ending').length,
    [nodes]
  );
  useEffect(() => {
    onEndingCountChange(endingCount);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endingCount]);

  useEffect(() => {
    if (!isGhostPlacing) setGhostPos(null);
  }, [isGhostPlacing]);

  // ── ESC 키 ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isGhostPlacing && !contextMenu && !connectMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isGhostPlacing) { onGhostPlacingEnd(); setGhostPos(null); }
        if (contextMenu) setContextMenu(null);
        if (connectMode) setConnectMode(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isGhostPlacing, contextMenu, connectMode, onGhostPlacingEnd]);

  // ── 활성 경로 BFS ─────────────────────────────────────────────
  const { activeNodeIds, activeEdgeIds } = useMemo(() => {
    if (!selectedNodeId) return { activeNodeIds: new Set<string>(), activeEdgeIds: new Set<string>() };
    const edgesByTarget = new Map<string, Edge[]>();
    edges.forEach((e) => {
      const list = edgesByTarget.get(e.target) ?? [];
      list.push(e);
      edgesByTarget.set(e.target, list);
    });
    const visited = new Set<string>();
    const activeEdges = new Set<string>();
    const queue = [selectedNodeId];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      (edgesByTarget.get(cur) ?? []).forEach((e) => {
        activeEdges.add(e.id);
        if (!visited.has(e.source)) queue.push(e.source);
      });
    }
    return { activeNodeIds: visited, activeEdgeIds: activeEdges };
  }, [selectedNodeId, edges]);

  // ── displayEdges: 활성 경로 glow ─────────────────────────────
  const displayEdges = useMemo(() => {
    if (!selectedNodeId || activeEdgeIds.size === 0) return edges;
    return edges.map((e) => {
      const isActive = activeEdgeIds.has(e.id);
      const ac = (e.data as { accentColor?: string })?.accentColor ?? '#7c3aed';
      return {
        ...e,
        style: {
          ...e.style,
          opacity: isActive ? 1 : 0.12,
          strokeWidth: isActive ? 3 : 1.5,
          filter: isActive ? `drop-shadow(0 0 5px ${ac}90)` : undefined,
        },
      };
    });
  }, [edges, selectedNodeId, activeEdgeIds]);

  // ── 새 씬 배치 ────────────────────────────────────────────────
  const handleCreateSceneAtPosition = useCallback((x: number, y: number) => {
    const newId = genId();
    setNodes((prev) => [...prev, {
      id: newId,
      type: 'infiniteNode',
      position: { x, y },
      data: {
        title: '', content: '',
        nodeType: 'scene' as InfiniteNodeType,
        choices: [] as Choice[], characters: [] as Character[],
      },
    }]);
  }, [setNodes]);

  // ── 제목 업데이트 + 선택지 텍스트 자동 연동 ────────────────────
  const handleUpdateTitle = useCallback((nodeId: string, title: string) => {
    // 이 씬으로 들어오는 choice 엣지들 수집 (setNodes 전에 ref에서 읽음)
    const incomingChoiceEdges = edgesRef.current.filter(
      (e) => e.target === nodeId && e.sourceHandle?.startsWith('choice-')
    );
    setNodes((nds) => nds.map((n) => {
      // 제목 업데이트
      if (n.id === nodeId) return { ...n, data: { ...n.data, title } };
      // 연결된 선택지 텍스트 자동 sync
      if (incomingChoiceEdges.length > 0) {
        const relevant = incomingChoiceEdges.filter((e) => e.source === n.id);
        if (relevant.length > 0) {
          const choiceIds = new Set(relevant.map((e) => e.sourceHandle!.replace('choice-', '')));
          const choices = ((n.data as InfiniteNodeData).choices ?? []).map((c) =>
            choiceIds.has(c.id) ? { ...c, text: title } : c
          );
          return { ...n, data: { ...n.data, choices } };
        }
      }
      return n;
    }));
  }, [setNodes]);

  // ── Connect-Choice: 대상 노드에 새 선택지로 연결 ────────────────
  const handleConnectChoiceToNode = useCallback((sourceNodeId: string, targetNodeId: string) => {
    const src = nodesRef.current.find((n) => n.id === sourceNodeId);
    const target = nodesRef.current.find((n) => n.id === targetNodeId);
    if (!src) return;
    const targetTitle = (target?.data as Partial<InfiniteNodeData>)?.title ?? '';
    const newChoice: Choice = { id: genId(), text: targetTitle };
    const srcData = src.data as InfiniteNodeData;
    const srcChar = characters.find((c) => c.id === srcData.povCharacterId);
    const accentColor = srcChar?.color ?? '#7c3aed';
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== sourceNodeId) return n;
        return { ...n, data: { ...n.data, choices: [...((n.data as InfiniteNodeData).choices ?? []), newChoice] } };
      })
    );
    setEdges((eds) => [...eds, makeEdge(sourceNodeId, targetNodeId, `choice-${newChoice.id}`, 'top', accentColor)]);
    setConnectMode(null);
  }, [setNodes, setEdges, characters]);

  // ── Connect-Next-Scene: 대상 노드를 다음 장면으로 연결 ──────────
  const handleConnectNextSceneToNode = useCallback((sourceNodeId: string, targetNodeId: string) => {
    const src = nodesRef.current.find((n) => n.id === sourceNodeId);
    if (!src) return;
    const srcData = src.data as InfiniteNodeData;
    const srcChar = characters.find((c) => c.id === srcData.povCharacterId);
    const accentColor = srcChar?.color ?? '#7c3aed';
    setEdges((eds) => [...eds, makeEdge(sourceNodeId, targetNodeId, 'bottom', 'top', accentColor)]);
    setConnectMode(null);
  }, [setEdges, characters]);

  // ── 선택 핸들러 (connect mode 인식) ────────────────────────────
  const handleSelect = useCallback((id: string) => {
    const mode = connectModeRef.current;
    if (mode) {
      const nodesWithIncoming = new Set(edgesRef.current.map((e) => e.target));
      if (mode.type === 'choice') {
        if (id !== mode.sourceNodeId && !nodesWithIncoming.has(id)) {
          handleConnectChoiceToNode(mode.sourceNodeId, id);
        }
      } else {
        // next: 선택지가 없는 루트 노드만 연결 가능
        const nodesWithChoiceEdges = new Set(
          edgesRef.current.filter((e) => e.sourceHandle?.startsWith('choice-')).map((e) => e.source)
        );
        const nodesWithChoiceData = new Set(
          nodesRef.current
            .filter((n) => ((n.data as InfiniteNodeData).choices ?? []).length > 0)
            .map((n) => n.id)
        );
        const hasChoices = nodesWithChoiceEdges.has(id) || nodesWithChoiceData.has(id);
        if (id !== mode.sourceNodeId && !nodesWithIncoming.has(id) && !hasChoices) {
          handleConnectNextSceneToNode(mode.sourceNodeId, id);
        }
      }
      return;
    }
    setSelectedNodeId(id);
    setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === id })));
    setContextMenu(null);
  }, [setNodes, handleConnectChoiceToNode, handleConnectNextSceneToNode]);

  const handleUpdateContent = useCallback((id: string, content: string) => {
    setNodes((nds) =>
      nds.map((n) => n.id === id ? { ...n, data: { ...n.data, content } } : n)
    );
  }, [setNodes]);

  const handleDelete = useCallback((id: string) => {
    if (id === selectedNodeId) setSelectedNodeId(null);
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  }, [setNodes, setEdges, selectedNodeId]);

  const handleUpdatePOV = useCallback((nodeId: string, characterId: string | undefined) => {
    setNodes((nds) =>
      nds.map((n) => n.id === nodeId
        ? { ...n, data: { ...n.data, povCharacterId: characterId } }
        : n
      )
    );
  }, [setNodes]);

  // ── 선택지 추가 + 씬 자동 생성 ────────────────────────────────
  const handleAddChoiceAndScene = useCallback((nodeId: string) => {
    const src = nodesRef.current.find((n) => n.id === nodeId);
    if (!src) return;
    const newChoice: Choice = { id: genId(), text: '' };
    const srcData = src.data as InfiniteNodeData;
    const existingCount = (srcData.choices ?? []).length;
    const srcChar = characters.find((c) => c.id === srcData.povCharacterId);
    const accentColor = srcChar?.color ?? '#7c3aed';
    const newNodeId = genId();
    // 부모 카드 실측 높이 기반 Y 간격 (미측정 시 220px 기본값)
    const parentH = getNode(nodeId)?.measured?.height ?? 220;
    const yGap = parentH + 80;
    const newNode: Node = {
      id: newNodeId,
      type: 'infiniteNode',
      position: {
        x: src.position.x + existingCount * (NODE_W + H_GAP),
        y: src.position.y + yGap,
      },
      data: {
        title: '', content: '',
        nodeType: 'scene' as InfiniteNodeType,
        choices: [] as Choice[], characters: [] as Character[],
        povCharacterId: srcData.povCharacterId,
      },
    };
    setNodes((nds) => [
      ...nds.map((n) => {
        if (n.id !== nodeId) return n;
        return { ...n, data: { ...n.data, choices: [...((n.data as InfiniteNodeData).choices ?? []), newChoice] } };
      }),
      newNode,
    ]);
    setEdges((eds) => [...eds, makeEdge(nodeId, newNodeId, `choice-${newChoice.id}`, 'top', accentColor)]);
  }, [setNodes, setEdges, characters, getNode]);

  const handleUpdateChoice = useCallback((nodeId: string, choiceId: string, text: string) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== nodeId) return n;
        const choices = ((n.data as InfiniteNodeData).choices ?? []).map((c) =>
          c.id === choiceId ? { ...c, text } : c
        );
        return { ...n, data: { ...n.data, choices } };
      })
    );
  }, [setNodes]);

  const handleDeleteChoice = useCallback((nodeId: string, choiceId: string) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== nodeId) return n;
        const choices = ((n.data as InfiniteNodeData).choices ?? []).filter((c) => c.id !== choiceId);
        return { ...n, data: { ...n.data, choices } };
      })
    );
    setEdges((eds) => eds.filter((e) => e.sourceHandle !== `choice-${choiceId}`));
  }, [setNodes, setEdges]);

  const handleAddNodeFromChoice = useCallback((sourceId: string, choiceId: string) => {
    const src = nodesRef.current.find((n) => n.id === sourceId);
    if (!src) return;
    const srcData = src.data as InfiniteNodeData;
    const choices = srcData.choices ?? [];
    const choice = choices.find((c) => c.id === choiceId);
    const choiceText = choice?.text || '';
    const choiceIdx = choices.findIndex((c) => c.id === choiceId);
    const newId = genId();
    const srcChar = characters.find((c) => c.id === srcData.povCharacterId);
    const accentColor = srcChar?.color ?? '#7c3aed';
    // 부모 카드 실측 높이 기반 Y 간격
    const parentH = getNode(sourceId)?.measured?.height ?? 220;
    const yGap = parentH + 80;
    setNodes((prev) => [...prev, {
      id: newId,
      type: 'infiniteNode',
      position: {
        x: src.position.x + choiceIdx * (NODE_W + H_GAP),
        y: src.position.y + yGap,
      },
      data: {
        title: '', content: '',
        nodeType: 'scene' as InfiniteNodeType,
        choices: [] as Choice[], characters: [] as Character[],
        povCharacterId: srcData.povCharacterId,
      },
    }]);
    setEdges((eds) => [
      ...eds,
      makeEdge(sourceId, newId, `choice-${choiceId}`, 'top', accentColor, choiceText || undefined),
    ]);
  }, [setNodes, setEdges, characters, getNode]);

  // ── Connect 모드 진입 ─────────────────────────────────────────
  const handleStartConnectChoiceMode = useCallback((nodeId: string) => {
    setConnectMode({ sourceNodeId: nodeId, type: 'choice' });
    setSelectedNodeId(null);
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
  }, [setNodes]);

  const handleStartConnectNextSceneMode = useCallback((nodeId: string) => {
    setConnectMode({ sourceNodeId: nodeId, type: 'next' });
    setSelectedNodeId(null);
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
  }, [setNodes]);

  // ── Oracle Panel pendingCard ──────────────────────────────────
  useEffect(() => {
    if (!pendingCard) return;
    const target =
      nodesRef.current.find((n) => n.selected) ??
      nodesRef.current[nodesRef.current.length - 1];
    if (!target) { onPendingCardConsumed(); return; }
    const newId = genId();
    setNodes((nds) => [...nds, {
      id: newId, type: 'infiniteNode',
      position: { x: target.position.x + NODE_W + H_GAP, y: target.position.y },
      data: {
        title: '', content: pendingCard.content,
        nodeType: 'scene' as InfiniteNodeType,
        choices: [] as Choice[], characters: [] as Character[],
      },
    }]);
    setEdges((eds) => [...eds, makeEdge(target.id, newId, 'right', 'left')]);
    onPendingCardConsumed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCard]);

  // ── 다음 장면 자동 삽입 ───────────────────────────────────────
  const handleInsertAfter = useCallback((nodeId: string) => {
    const src = nodesRef.current.find((n) => n.id === nodeId);
    if (!src) return;
    const srcData = src.data as InfiniteNodeData;
    const srcChar = characters.find((c) => c.id === srcData.povCharacterId);
    const accentColor = srcChar?.color ?? '#7c3aed';
    const newId = genId();
    // 부모 카드 실측 높이 기반 Y 간격
    const parentH = getNode(nodeId)?.measured?.height ?? 220;
    const yGap = parentH + 80;
    setNodes((prev) => [...prev, {
      id: newId,
      type: 'infiniteNode',
      position: { x: src.position.x, y: src.position.y + yGap },
      data: {
        title: '', content: '',
        nodeType: 'scene' as InfiniteNodeType,
        choices: [] as Choice[], characters: [] as Character[],
        povCharacterId: srcData.povCharacterId,
      },
    }]);
    setEdges((eds) => [...eds, makeEdge(nodeId, newId, 'bottom', 'top', accentColor)]);
  }, [setNodes, setEdges, characters, getNode]);

  // ── 자동 정렬: BFS 트리 레이아웃으로 모든 노드 재배치 ───────────
  const handleAutoSort = useCallback(() => {
    const ns = nodesRef.current;
    const es = edgesRef.current;
    if (ns.length === 0) return;

    // 각 노드의 outgoing 엣지 맵 구성
    const outEdges = new Map<string, Edge[]>();
    ns.forEach((n) => outEdges.set(n.id, []));
    es.forEach((e) => {
      const list = outEdges.get(e.source) ?? [];
      list.push(e);
      outEdges.set(e.source, list);
    });

    // 루트 노드 결정: 'start' 타입 → 없으면 incoming 없는 노드 → 없으면 첫 번째
    const hasIncoming = new Set(es.map((e) => e.target));
    const root =
      ns.find((n) => (n.data as InfiniteNodeData).nodeType === 'start') ??
      ns.find((n) => !hasIncoming.has(n.id)) ??
      ns[0];
    if (!root) return;

    // BFS 레이아웃
    const positions = new Map<string, { x: number; y: number }>();
    const queue: Array<{ id: string; x: number; y: number }> = [
      { id: root.id, x: 0, y: 0 },
    ];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { id, x, y } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      positions.set(id, { x, y });

      const outs = outEdges.get(id) ?? [];
      const bottomOuts = outs.filter((e) => e.sourceHandle === 'bottom');
      const choiceOuts = outs.filter((e) => e.sourceHandle?.startsWith('choice-'));
      const rightOuts  = outs.filter((e) => e.sourceHandle === 'right');

      // 부모 카드 실측 높이 기반 Y 간격
      const parentH = getNode(id)?.measured?.height ?? 220;
      const yGap = parentH + 80;

      // bottom → 바로 아래
      bottomOuts.forEach((e) => {
        if (!positions.has(e.target))
          queue.push({ id: e.target, x, y: y + yGap });
      });

      // choice → 부모 중앙 기준 수평 분산, 아래
      const cLen = choiceOuts.length;
      choiceOuts.forEach((e, i) => {
        if (!positions.has(e.target)) {
          const offsetX =
            cLen === 1 ? 0 : (i - (cLen - 1) / 2) * (NODE_W + H_GAP);
          queue.push({ id: e.target, x: x + offsetX, y: y + yGap });
        }
      });

      // right → 오른쪽으로
      rightOuts.forEach((e, i) => {
        if (!positions.has(e.target))
          queue.push({ id: e.target, x: x + (i + 1) * (NODE_W + H_GAP), y });
      });
    }

    // 연결 끊긴 고아 노드: 좌측 상단에 일렬 배치
    let orphanX = -(NODE_W + H_GAP);
    ns.forEach((n) => {
      if (!positions.has(n.id)) {
        positions.set(n.id, { x: orphanX, y: -320 });
        orphanX -= NODE_W + H_GAP;
      }
    });

    setNodes((nds) =>
      nds.map((n) => ({ ...n, position: positions.get(n.id) ?? n.position }))
    );
    // 정렬 후 전체 뷰 맞춤
    setTimeout(() => fitView({ duration: 400, padding: 0.2 }), 50);
  }, [setNodes, fitView, getNode]);

  // ── 호버 z-index 핸들러 ───────────────────────────────────────
  const handleNodeHoverEnter = useCallback((nodeId: string) => {
    setHoveredNodeId(nodeId);
  }, []);

  const handleNodeHoverLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  // ── wiredNodes: 모든 데이터 + 콜백 주입 ──────────────────────
  const wiredNodes = useMemo(
    () => {
      // 선택지 핸들 → 대상 씬 제목 맵
      const choiceTitleMap = new Map<string, string>();
      edges.forEach((e) => {
        if (e.sourceHandle?.startsWith('choice-')) {
          const targetTitle =
            (nodes.find((n) => n.id === e.target)?.data as Partial<InfiniteNodeData>)?.title ?? '';
          choiceTitleMap.set(`${e.source}:${e.sourceHandle}`, targetTitle);
        }
      });

      // connect 모드 공통 연산
      const nodesWithIncoming = connectMode
        ? new Set(edges.map((e) => e.target))
        : null;

      // next 모드: 선택지 있는 노드 집합
      const nodesWithChoices = connectMode?.type === 'next'
        ? new Set([
            ...edges.filter((e) => e.sourceHandle?.startsWith('choice-')).map((e) => e.source),
            ...nodes.filter((n) => ((n.data as InfiniteNodeData).choices ?? []).length > 0).map((n) => n.id),
          ])
        : null;

      return nodes.map((n) => {
        const nodeData = n.data as InfiniteNodeData;

        // connectedChoices 계산 (choiceId → 연결된 씬 제목)
        const connectedChoices: Record<string, string> = {};
        (nodeData.choices ?? []).forEach((c) => {
          const key = `${n.id}:choice-${c.id}`;
          if (choiceTitleMap.has(key)) connectedChoices[c.id] = choiceTitleMap.get(key)!;
        });

        // connectedNodeIds 계산 (choiceId → 연결된 씬 nodeId, 클릭 이동용)
        const connectedNodeIds: Record<string, string> = {};
        (nodeData.choices ?? []).forEach((c) => {
          const edge = edges.find((e) => e.source === n.id && e.sourceHandle === `choice-${c.id}`);
          if (edge) connectedNodeIds[c.id] = edge.target;
        });

        // 다음 장면 연결 여부 + 하단 핸들 수 (bottom 핸들로 나가는 엣지)
        const outgoingBottomCount = edges.filter(
          (e) => e.source === n.id && e.sourceHandle === 'bottom'
        ).length;
        const hasNextScene = outgoingBottomCount > 0;

        // connect 모드별 노드 상태
        const isSource = connectMode ? n.id === connectMode.sourceNodeId : false;
        let isConnectable = false;
        if (connectMode && !isSource) {
          const noIncoming = !nodesWithIncoming?.has(n.id);
          const notStart = nodeData.nodeType !== 'start';
          if (connectMode.type === 'choice') {
            isConnectable = noIncoming && notStart;
          } else {
            // next: 상위 블럭 없고, 선택지도 없는 씬만
            isConnectable = noIncoming && notStart && !nodesWithChoices?.has(n.id);
          }
        }
        const nodeStyle = connectMode && !isConnectable && !isSource
          ? { opacity: 0.08, pointerEvents: 'none' as const }
          : undefined;

        return {
          ...n,
          style: nodeStyle ?? n.style,
          data: {
            ...n.data,
            characters,
            connectedChoices,
            connectedNodeIds,
            isOnActivePath: activeNodeIds.has(n.id),
            hasNextScene,
            outgoingBottomCount,
            connectChoiceMode: connectMode?.type === 'choice'
              ? { active: true, isConnectable, isSource }
              : undefined,
            connectNextSceneMode: connectMode?.type === 'next'
              ? { active: true, isConnectable, isSource }
              : undefined,
            onUpdateTitle: handleUpdateTitle,
            onUpdateContent: handleUpdateContent,
            onDelete: handleDelete,
            onSelect: handleSelect,
            onUpdatePOV: handleUpdatePOV,
            onAddChoice: handleAddChoiceAndScene,
            onUpdateChoice: handleUpdateChoice,
            onDeleteChoice: handleDeleteChoice,
            onAddNodeFromChoice: handleAddNodeFromChoice,
            onStartConnectChoiceMode: handleStartConnectChoiceMode,
            onStartConnectNextSceneMode: handleStartConnectNextSceneMode,
            onInsertAfter: handleInsertAfter,
            onSelectConnected: handleSelect,
            onHoverEnter: handleNodeHoverEnter,
            onHoverLeave: handleNodeHoverLeave,
          } as InfiniteNodeData,
        };
      });
    },
    [
      nodes, edges, characters, activeNodeIds, connectMode,
      handleUpdateTitle, handleUpdateContent, handleDelete, handleSelect,
      handleUpdatePOV, handleAddChoiceAndScene, handleUpdateChoice, handleDeleteChoice,
      handleAddNodeFromChoice, handleStartConnectChoiceMode, handleStartConnectNextSceneMode,
      handleInsertAfter, handleNodeHoverEnter, handleNodeHoverLeave,
    ]
  );

  // ── displayNodes: 호버 노드 z-index 최상위 ────────────────────
  const displayNodes = useMemo(
    () => wiredNodes.map((n) => ({
      ...n,
      zIndex: n.id === hoveredNodeId ? 9999 : 0,
    })),
    [wiredNodes, hoveredNodeId]
  );

  // ── 우클릭 컨텍스트 메뉴 ─────────────────────────────────────
  const onPaneContextMenu = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setContextMenu({
        containerX: e.clientX - rect.left,
        containerY: e.clientY - rect.top,
        flowX: flowPos.x,
        flowY: flowPos.y,
      });
    },
    [screenToFlowPosition]
  );

  // ── 토스트 텍스트 ─────────────────────────────────────────────
  const toastText = connectMode?.type === 'next'
    ? '다음 장면으로 연결할 블럭을 선택하세요'
    : '연결할 블럭을 선택하세요';

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        nodesConnectable={false}
        nodesDraggable={true}
        fitView
        fitViewOptions={{ padding: 0.35, maxZoom: 1.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        onPaneClick={() => {
          if (connectMode) { setConnectMode(null); return; }
          if (contextMenu) { setContextMenu(null); return; }
          setSelectedNodeId(null);
          setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
        }}
        onPaneContextMenu={onPaneContextMenu}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1.2}
          color={connectMode ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.12)'}
        />

        {/* ── 자동 정렬 버튼 ─────────────────────────────────── */}
        <Panel position="top-right">
          <button
            onClick={handleAutoSort}
            className="
              flex items-center gap-1.5 px-3 py-1.5
              text-xs font-medium
              bg-white/90 dark:bg-[#0f1e35]/90
              border border-gray-200 dark:border-white/10
              rounded-full shadow-md hover:shadow-lg
              hover:bg-gray-50 dark:hover:bg-white/10
              transition-all backdrop-blur-sm cursor-pointer
              text-gray-700 dark:text-white/70
            "
            title="모든 노드를 트리 구조 기반으로 재정렬"
          >
            <span>⚡</span>
            자동 정렬
          </button>
        </Panel>

        <Controls
          showInteractive={false}
          style={{ bottom: 20, left: 20 }}
          className="
            [&>button]:rounded-lg [&>button]:border
            [&>button]:bg-white/90 [&>button]:dark:bg-[#0f1e35]/90
            [&>button]:border-gray-200 [&>button]:dark:border-white/10
            [&>button]:text-gray-600 [&>button]:dark:text-white/60
            [&>button]:shadow-md [&>button]:transition-all
            [&>button:hover]:bg-gray-50 [&>button:hover]:dark:bg-white/10
            !gap-1
          "
        />

        <MiniMap
          nodeColor={(n) => {
            const d = n.data as InfiniteNodeData;
            const povChar = characters.find((c) => c.id === d.povCharacterId);
            if (povChar) return povChar.color;
            const t = d.nodeType;
            if (t === 'ending') return '#f59e0b';
            if (t === 'start') return '#10b981';
            return '#7c3aed';
          }}
          maskColor="rgba(0, 0, 20, 0.15)"
          style={{ bottom: 20, right: 20, borderRadius: 12 }}
          className="
            !bg-white/80 !dark:bg-[#0c1220]/80
            !border !border-gray-200 !dark:border-white/10
            !shadow-lg !shadow-black/5
          "
        />
      </ReactFlow>

      {/* ── Connect 모드 토스트 ──────────────────────────────── */}
      {connectMode && (
        <div className="
          absolute top-3 left-1/2 -translate-x-1/2 z-30
          px-4 py-2 rounded-xl shadow-xl
          bg-indigo-600/95 text-white
          text-xs font-semibold backdrop-blur-sm pointer-events-none
          flex items-center gap-2
        ">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          {toastText}
          <span className="opacity-60 font-normal ml-1">ESC로 취소</span>
        </div>
      )}

      {/* ── Ghost Node Overlay ───────────────────────────────── */}
      {isGhostPlacing && (
        <>
          <div
            className="absolute inset-0 z-40"
            style={{ cursor: 'crosshair' }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setGhostPos({
                clientX: e.clientX, clientY: e.clientY,
                containerX: e.clientX - rect.left,
                containerY: e.clientY - rect.top,
              });
            }}
            onMouseLeave={() => setGhostPos(null)}
            onClick={(e) => {
              e.stopPropagation();
              if (!ghostPos) return;
              const flowPos = screenToFlowPosition({ x: ghostPos.clientX, y: ghostPos.clientY });
              handleCreateSceneAtPosition(flowPos.x - NODE_W / 2, flowPos.y - 55);
              onGhostPlacingEnd();
              setGhostPos(null);
            }}
          />
          {ghostPos && (
            <div
              className="absolute z-50 pointer-events-none"
              style={{ left: ghostPos.containerX - NODE_W / 2, top: ghostPos.containerY - 55, width: NODE_W }}
            >
              <div className="rounded-xl border-2 border-dashed opacity-65
                bg-white/60 dark:bg-[#0f1e35]/60 backdrop-blur-sm shadow-lg shadow-violet-500/10"
                style={{ borderColor: '#7c3aed88' }}
              >
                <div className="px-3 py-2 flex items-center gap-1.5 border-b"
                  style={{ borderColor: '#7c3aed20', background: 'rgba(124,58,237,0.07)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded-full
                    bg-violet-100/60 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400">
                    SCENE
                  </span>
                </div>
                <div className="px-3 pt-2 pb-0">
                  <p className="text-xs font-semibold text-gray-300 dark:text-white/20 italic">제목 없음</p>
                </div>
                <div className="px-3 py-2 min-h-[48px] flex items-center">
                  <p className="text-xs text-gray-300 dark:text-white/20 italic">클릭하여 여기에 배치</p>
                </div>
              </div>
              <p className="text-center text-[10px] text-gray-400 dark:text-white/30 mt-1.5">ESC로 취소</p>
            </div>
          )}
        </>
      )}

      {/* ── 우클릭 Context Menu ──────────────────────────────── */}
      {contextMenu && (
        <>
          <div className="absolute inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="absolute z-50 rounded-xl shadow-2xl overflow-hidden
              bg-white dark:bg-[#0c1220]
              border border-gray-200 dark:border-white/10
              py-1 min-w-[140px]"
            style={{ left: contextMenu.containerX, top: contextMenu.containerY }}
          >
            <button
              className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-sm
                text-gray-700 dark:text-white/70
                hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
              onClick={() => {
                handleCreateSceneAtPosition(contextMenu.flowX, contextMenu.flowY);
                setContextMenu(null);
              }}
            >
              <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0
                bg-violet-100 dark:bg-violet-500/20">
                <Plus className="w-3 h-3 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="font-semibold text-violet-600 dark:text-violet-400 text-xs">SCENE 추가</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── 외부 export: ReactFlowProvider 래핑 ──────────────────────────
export function InfiniteCanvas(props: InfiniteCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowInner {...props} />
    </ReactFlowProvider>
  );
}
