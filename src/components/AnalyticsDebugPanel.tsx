/**
 * AnalyticsDebugPanel.tsx
 *
 * 이벤트 추적 디버그 패널
 * - 현재 anonId, sessionId 표시
 * - detailGenCount, policy 값 표시
 * - 최근 추적된 이벤트 표시
 * - 서버 이벤트 가져오기 (개발 환경 전용)
 */

"use client";

import { useState } from "react";
import { getIdentity } from "@/lib/identity";
import { getRecentEvents } from "@/lib/track";
import type { EventRecord } from "@/types/events";
import type { DetailPolicy } from "@/config/policy";

export interface AnalyticsDebugPanelProps {
  policy: DetailPolicy;
  detailGenCount: number;
}

export function AnalyticsDebugPanel({
  policy,
  detailGenCount,
}: AnalyticsDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [serverEvents, setServerEvents] = useState<EventRecord[]>([]);
  const [isLoadingServerEvents, setIsLoadingServerEvents] = useState(false);

  const { anonId, sessionId } = getIdentity();
  const clientEvents = getRecentEvents();

  const handleFetchServerEvents = async () => {
    setIsLoadingServerEvents(true);
    try {
      const response = await fetch("/api/events");
      const data = await response.json();
      if (data.ok) {
        setServerEvents(data.events || []);
      } else {
        alert("서버 이벤트 가져오기 실패");
      }
    } catch (error) {
      console.error("Failed to fetch server events:", error);
      alert("서버 이벤트 가져오기 중 오류 발생");
    } finally {
      setIsLoadingServerEvents(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg hover:bg-gray-700"
      >
        Analytics Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-[600px] max-h-[80vh] bg-white border border-gray-300 rounded-lg shadow-2xl overflow-hidden flex flex-col">
      {/* 헤더 */}
      <div className="px-4 py-2 bg-gray-800 text-white flex items-center justify-between">
        <h3 className="text-sm font-semibold">Analytics Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-gray-300"
        >
          ×
        </button>
      </div>

      {/* 내용 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Identity */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-1">Identity</h4>
          <div className="bg-gray-50 p-2 rounded font-mono text-[10px]">
            <div>
              <span className="text-gray-600">anonId:</span>{" "}
              <span className="text-blue-600">{anonId}</span>
            </div>
            <div>
              <span className="text-gray-600">sessionId:</span>{" "}
              <span className="text-green-600">{sessionId}</span>
            </div>
          </div>
        </div>

        {/* Policy & Quota */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-1">
            Policy & Quota
          </h4>
          <div className="bg-gray-50 p-2 rounded font-mono text-[10px] space-y-1">
            <div>
              <span className="text-gray-600">detailGenCount:</span>{" "}
              <span className="text-orange-600">{detailGenCount}</span>
              <span className="text-gray-400">
                {" "}
                / {policy.maxDetailGenerationsPerSession}
              </span>
            </div>
            <div>
              <span className="text-gray-600">cooldownMs:</span>{" "}
              <span>{policy.actionCooldownMs}</span>
            </div>
            <div>
              <span className="text-gray-600">maxDetailVariants:</span>{" "}
              <span>{policy.maxDetailVariantsPerBlock}</span>
            </div>
            <div>
              <span className="text-gray-600">detailSentenceRange:</span>{" "}
              <span>
                {policy.detailSentenceRange.min}~
                {policy.detailSentenceRange.max}
              </span>
            </div>
            <div>
              <span className="text-gray-600">expandSentenceRange:</span>{" "}
              <span>
                {policy.expandSentenceRange.min}~
                {policy.expandSentenceRange.max}
              </span>
            </div>
          </div>
        </div>

        {/* Client Events */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-1">
            Recent Client Events ({clientEvents.length})
          </h4>
          <div className="bg-gray-50 p-2 rounded max-h-60 overflow-y-auto">
            {clientEvents.length === 0 ? (
              <p className="text-gray-500">No events yet</p>
            ) : (
              <div className="space-y-1 font-mono text-[10px]">
                {clientEvents.slice(-20).reverse().map((event, idx) => (
                  <div key={idx} className="border-b border-gray-200 pb-1">
                    <div>
                      <span className="text-blue-600">{event.name}</span>
                      <span className="text-gray-400 ml-2">
                        {new Date(event.ts).toLocaleTimeString()}
                      </span>
                    </div>
                    {event.meta && (
                      <div className="text-gray-600 pl-2">
                        {JSON.stringify(event.meta)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Server Events (Dev Only) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-gray-700">
              Server Events ({serverEvents.length})
            </h4>
            <button
              onClick={handleFetchServerEvents}
              disabled={isLoadingServerEvents}
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoadingServerEvents ? "Loading..." : "Fetch"}
            </button>
          </div>
          <div className="bg-gray-50 p-2 rounded max-h-60 overflow-y-auto">
            {serverEvents.length === 0 ? (
              <p className="text-gray-500">No events fetched</p>
            ) : (
              <div className="space-y-1 font-mono text-[10px]">
                {serverEvents.slice(-20).reverse().map((event, idx) => (
                  <div key={idx} className="border-b border-gray-200 pb-1">
                    <div>
                      <span className="text-purple-600">{event.name}</span>
                      <span className="text-gray-400 ml-2">
                        {new Date(event.ts).toLocaleTimeString()}
                      </span>
                    </div>
                    {event.meta && (
                      <div className="text-gray-600 pl-2">
                        {JSON.stringify(event.meta)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
