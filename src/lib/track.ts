/**
 * track.ts
 *
 * 클라이언트 측 이벤트 추적
 *
 * [리팩토링] Next.js API Route(/api/events) 제거됨
 * → FastAPI 백엔드 POST /api/v1/logs/event 로 직접 전송
 *
 * - 최근 이벤트를 메모리 링 버퍼로 저장 (디버그 패널용)
 * - 네트워크 에러 시 1회 재시도
 */

import type { TrackEventInput, EventRecord } from "@/types/events";
import { getIdentity } from "./identity";
import { logEvent } from "./api/storyApi";

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

  // 백엔드로 전송 (best effort with 1 retry)
  try {
    await logEvent(event);
  } catch (error) {
    console.warn("[track] Failed to send event, retrying once...", error);
    setTimeout(async () => {
      try {
        await logEvent(event);
      } catch (retryError) {
        console.warn("[track] Retry failed, event dropped:", retryError);
      }
    }, 1000);
  }
}

/**
 * 최근 이벤트 가져오기 (디버그 패널용)
 */
export function getRecentEvents(): EventRecord[] {
  return [...recentEvents];
}
