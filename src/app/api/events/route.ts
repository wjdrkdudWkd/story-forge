/**
 * /api/events
 *
 * 이벤트 기록 및 조회 API
 */

import { NextRequest, NextResponse } from "next/server";
import { eventStore } from "@/server/eventStore";
import type { EventRecord } from "@/types/events";

const MAX_META_SIZE = 20_000; // meta 필드 최대 크기 (JSON 문자열 길이)

/**
 * POST /api/events
 * 이벤트 기록
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 필수 필드 검증
    const { id, ts, name, anonId, sessionId } = body;
    if (!id || !ts || !name || !anonId || !sessionId) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // meta 크기 제한 (너무 큰 payload 방지)
    let meta = body.meta;
    if (meta) {
      const metaStr = JSON.stringify(meta);
      if (metaStr.length > MAX_META_SIZE) {
        console.warn(
          `[POST /api/events] Meta too large (${metaStr.length} bytes), truncating`
        );
        meta = { _truncated: true, _originalSize: metaStr.length };
      }
    }

    const event: EventRecord = {
      id,
      ts,
      name,
      anonId,
      sessionId,
      userId: body.userId || null,
      projectId: body.projectId || null,
      meta,
      appVersion: body.appVersion,
      route: body.route,
    };

    await eventStore.write(event);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/events] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/events
 * 최근 이벤트 조회 (개발 환경 전용)
 */
export async function GET(request: NextRequest) {
  // 프로덕션 환경에서는 접근 차단
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: "Not available in production" },
      { status: 403 }
    );
  }

  try {
    const events = await eventStore.listRecent(100);
    return NextResponse.json({ ok: true, events });
  } catch (error) {
    console.error("[GET /api/events] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
