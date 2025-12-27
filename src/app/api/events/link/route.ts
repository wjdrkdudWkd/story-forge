/**
 * /api/events/link
 *
 * 익명 ID를 사용자 ID에 연결
 * - Supabase의 link_anon_events_to_user 함수 호출
 * - 로그인 후 호출하여 익명 이벤트를 사용자 계정에 연결
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/server/supabaseAdmin";

/**
 * POST /api/events/link
 * anonId를 userId/projectId에 연결
 *
 * Supabase를 사용하여:
 * 1. link_anon_events_to_user 함수 호출
 * 2. events 및 ai_calls 테이블의 anon_id → user_id 업데이트
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

    // Supabase 함수 호출
    const { data, error } = await supabaseAdmin.rpc(
      "link_anon_events_to_user",
      {
        p_anon_id: anonId,
        p_user_id: userId,
        p_project_id: projectId || null,
      }
    );

    if (error) {
      console.error("[POST /api/events/link] Supabase RPC error:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to link events" },
        { status: 500 }
      );
    }

    console.log("[POST /api/events/link] Successfully linked:", {
      anonId,
      userId,
      projectId,
      result: data,
    });

    return NextResponse.json({
      ok: true,
      eventsUpdated: data?.events_updated || 0,
      aiCallsUpdated: data?.ai_calls_updated || 0,
    });
  } catch (error) {
    console.error("[POST /api/events/link] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
