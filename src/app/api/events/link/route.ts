/**
 * /api/events/link
 *
 * 익명 ID를 사용자 ID에 연결 (나중에 구현)
 * 현재는 스텁만 제공
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/events/link
 * anonId를 userId/projectId에 연결
 *
 * 나중에 Supabase 또는 DB를 사용하여:
 * 1. anonId로 기록된 모든 이벤트를 조회
 * 2. userId/projectId 필드 업데이트
 * 3. 연결 기록을 별도 테이블에 저장
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { anonId, userId, projectId } = body;

    if (!anonId || !userId) {
      return NextResponse.json(
        { ok: false, error: "Missing anonId or userId" },
        { status: 400 }
      );
    }

    // TODO: DB에 연결 정보 저장 및 기존 이벤트 업데이트
    console.log("[POST /api/events/link] Linking requested but not enabled:", {
      anonId,
      userId,
      projectId,
    });

    return NextResponse.json({
      ok: true,
      note: "linking not enabled without DB",
    });
  } catch (error) {
    console.error("[POST /api/events/link] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
