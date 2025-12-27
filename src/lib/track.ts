/**
 * track.ts
 *
 * 클라이언트 측 이벤트 추적
 * - 이벤트를 /api/events로 전송
 * - 최근 이벤트를 메모리에 링 버퍼로 저장 (디버그용)
 * - 네트워크 에러 시 1회 재시도
 */

import type { TrackEventInput, EventRecord } from "@/types/events";
import { getIdentity } from "./identity";

const APP_VERSION = "1.0.0";
const RECENT_EVENTS_LIMIT = 50;

// 최근 이벤트 링 버퍼 (디버그 패널용)
const recentEvents: EventRecord[] = [];

/**
 * 이벤트 추적
 * - UI에 에러를 던지지 않음 (best effort)
 * - 실패 시 1회 재시도
 */
export async function track(input: TrackEventInput): Promise<void> {
  if (typeof window === "undefined") return;

  const { anonId, sessionId } = getIdentity();

  const event: EventRecord = {
    id: crypto.randomUUID(),
    ts: Date.now(),
    name: input.name,
    anonId,
    sessionId,
    projectId: input.projectId,
    meta: input.meta,
    appVersion: APP_VERSION,
    route: window.location.pathname,
  };

  // 링 버퍼에 추가
  recentEvents.push(event);
  if (recentEvents.length > RECENT_EVENTS_LIMIT) {
    recentEvents.shift();
  }

  // 서버로 전송 (best effort with 1 retry)
  try {
    await sendEvent(event);
  } catch (error) {
    console.warn("[track] Failed to send event, retrying once...", error);
    // 1초 후 재시도
    setTimeout(async () => {
      try {
        await sendEvent(event);
      } catch (retryError) {
        console.warn("[track] Retry failed, event dropped:", retryError);
      }
    }, 1000);
  }
}

/**
 * 서버로 이벤트 전송
 */
async function sendEvent(event: EventRecord): Promise<void> {
  const response = await fetch("/api/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error(`Failed to send event: ${response.status}`);
  }
}

/**
 * 최근 이벤트 가져오기 (디버그 패널용)
 */
export function getRecentEvents(): EventRecord[] {
  return [...recentEvents];
}
