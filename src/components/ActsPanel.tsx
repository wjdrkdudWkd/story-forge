/**
 * ActsPanel.tsx
 *
 * 5막 구조 결과 표시 컴포넌트
 */

"use client";

import type { ActsResult } from "@/types/acts";
import { Button } from "./ui/button";

export interface ActsPanelProps {
  actsResult: ActsResult;
  onBack: () => void;
}

export function ActsPanel({ actsResult, onBack }: ActsPanelProps) {
  const { acts, state } = actsResult;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-gray-800">5막 구조</h1>
        <p className="text-sm text-gray-600">
          생성된 아이디어를 기반으로 5막 구조가 만들어졌습니다.
        </p>
      </div>

      {/* 5막 카드들 */}
      <div className="space-y-4">
        {acts.map((act) => (
          <div
            key={act.key}
            className="border border-gray-300 rounded p-4 space-y-2 bg-white"
          >
            <h2 className="text-base font-semibold text-gray-800">
              {act.title}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700">
              {act.summary}
            </p>
          </div>
        ))}
      </div>

      {/* 디버그 정보 (토글) */}
      <details className="text-xs">
        <summary className="cursor-pointer text-gray-600">
          현재 상태 (디버그)
        </summary>
        <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto text-gray-800">
          {JSON.stringify(state, null, 2)}
        </pre>
      </details>

      {/* 액션 버튼들 */}
      <div className="pt-4 border-t border-gray-200 flex gap-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          ← 뒤로
        </Button>
        <Button className="flex-1" disabled>
          24블록으로 진행 (준비 중)
        </Button>
      </div>
    </div>
  );
}
