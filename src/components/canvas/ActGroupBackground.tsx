/**
 * ActGroupBackground.tsx
 *
 * React Flow 캔버스 배경에 렌더링되는 막(Act) 그룹 컨테이너
 *
 * ReactFlow의 <Background /> 대신 사용하거나 함께 사용합니다.
 * 각 막의 Y 범위를 계산하여 색상이 구분된 배경 패널을 그립니다.
 *
 * 사용처: BlocksCanvas.tsx에서 <svg> 오버레이 또는 absolute 레이어로 렌더링
 */

"use client";

import { memo } from "react";
import { useStore, type ReactFlowState } from "@xyflow/react";
import { useTheme } from "@/lib/theme";

// 막 번호별 색상 — Light
const ACT_COLORS_LIGHT: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: "rgba(239, 246, 255, 0.55)", border: "rgba(147, 197, 253, 0.5)", text: "#3b82f6" },
  2: { bg: "rgba(240, 253, 244, 0.55)", border: "rgba(134, 239, 172, 0.5)", text: "#22c55e" },
  3: { bg: "rgba(254, 249, 195, 0.45)", border: "rgba(253, 224, 71, 0.5)",  text: "#eab308" },
  4: { bg: "rgba(253, 237, 222, 0.50)", border: "rgba(253, 186, 116, 0.5)", text: "#f97316" },
  5: { bg: "rgba(250, 232, 255, 0.50)", border: "rgba(216, 180, 254, 0.5)", text: "#a855f7" },
};

// 막 번호별 색상 — Dark (glassmorphism 계열)
const ACT_COLORS_DARK: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: "rgba(59, 130, 246, 0.08)",  border: "rgba(147, 197, 253, 0.2)", text: "#93c5fd" },
  2: { bg: "rgba(34, 197, 94, 0.08)",   border: "rgba(134, 239, 172, 0.2)", text: "#86efac" },
  3: { bg: "rgba(234, 179, 8, 0.08)",   border: "rgba(253, 224, 71, 0.2)",  text: "#fde047" },
  4: { bg: "rgba(249, 115, 22, 0.08)",  border: "rgba(253, 186, 116, 0.2)", text: "#fdba74" },
  5: { bg: "rgba(168, 85, 247, 0.08)",  border: "rgba(216, 180, 254, 0.2)", text: "#d8b4fe" },
};

const DEFAULT_COLOR_LIGHT = {
  bg: "rgba(241, 245, 249, 0.45)",
  border: "rgba(148, 163, 184, 0.4)",
  text: "#64748b",
};

const DEFAULT_COLOR_DARK = {
  bg: "rgba(255, 255, 255, 0.04)",
  border: "rgba(255, 255, 255, 0.1)",
  text: "rgba(255,255,255,0.4)",
};

function getActColor(actIndex: number, isDark: boolean) {
  if (isDark) return ACT_COLORS_DARK[actIndex] ?? DEFAULT_COLOR_DARK;
  return ACT_COLORS_LIGHT[actIndex] ?? DEFAULT_COLOR_LIGHT;
}

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

export interface ActGroupRect {
  actIndex: number;
  /** 캔버스 좌표 (flow 좌표계) */
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ActGroupBackgroundProps {
  /** 각 막의 캔버스 좌표 사각형 */
  actRects: ActGroupRect[];
  /** 막 이름 (기본: "Act N") */
  actLabels?: Record<number, string>;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

/**
 * ReactFlow의 transform 을 구독하여 뷰포트와 동기화된
 * Act 그룹 배경 컨테이너를 절대 위치로 렌더링합니다.
 *
 * 이 컴포넌트는 ReactFlow provider 내부에서 사용해야 합니다.
 */
function ActGroupBackgroundInner({
  actRects,
  actLabels = {},
}: ActGroupBackgroundProps) {
  // ReactFlow 뷰포트 transform [tx, ty, zoom] 구독
  const transform = useStore((s: ReactFlowState) => s.transform);
  const [tx, ty, zoom] = transform;
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {actRects.map(({ actIndex, x, y, width, height }) => {
        const color = getActColor(actIndex, isDark);
        const label = actLabels[actIndex] ?? `Act ${actIndex}`;

        // flow 좌표 → 스크린 좌표 변환
        const screenX = x * zoom + tx;
        const screenY = y * zoom + ty;
        const screenW = width * zoom;
        const screenH = height * zoom;

        return (
          <div
            key={actIndex}
            style={{
              position: "absolute",
              left: screenX,
              top: screenY,
              width: screenW,
              height: screenH,
              backgroundColor: color.bg,
              border: `1.5px solid ${color.border}`,
              borderRadius: 12,
              boxSizing: "border-box",
            }}
          >
            {/* 막 레이블 — 좌상단 */}
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 14,
                fontSize: Math.max(10, 13 * zoom),
                fontWeight: 700,
                color: color.text,
                letterSpacing: "0.04em",
                opacity: 0.85,
                userSelect: "none",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const ActGroupBackground = memo(ActGroupBackgroundInner);
