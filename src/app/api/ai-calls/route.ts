/**
 * /api/ai-calls
 *
 * AI 호출 로그 기록 API
 * - prompt, response, metadata 저장
 * - 서버 전용 (Service Role Key 사용)
 * - prompt/response SHA-256 해시 계산
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/server/supabaseAdmin";

const MAX_PROMPT_CHARS = 100_000; // prompt 최대 길이
const MAX_RESPONSE_CHARS = 100_000; // response 최대 길이

/**
 * SHA-256 해시 계산
 */
function computeHash(text: string): string {
  return createHash("sha256").update(text, "utf-8").digest("hex");
}

/**
 * POST /api/ai-calls
 * AI 호출 로그 기록
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 필수 필드 검증
    const { anonId, sessionId, stage, mode, prompt, response } = body;
    if (!anonId || !sessionId || !stage || !mode || !prompt || !response) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // prompt/response 크기 제한
    let truncatedPrompt = prompt;
    let truncatedResponse = response;

    if (prompt.length > MAX_PROMPT_CHARS) {
      console.warn(
        `[POST /api/ai-calls] Prompt too large (${prompt.length} chars), truncating`
      );
      truncatedPrompt =
        prompt.substring(0, MAX_PROMPT_CHARS) +
        "\n\n[...truncated due to size limit]";
    }

    if (response.length > MAX_RESPONSE_CHARS) {
      console.warn(
        `[POST /api/ai-calls] Response too large (${response.length} chars), truncating`
      );
      truncatedResponse =
        response.substring(0, MAX_RESPONSE_CHARS) +
        "\n\n[...truncated due to size limit]";
    }

    const promptChars = truncatedPrompt.length;
    const responseChars = truncatedResponse.length;

    // 해시 계산 (truncated 된 문자열을 해시)
    const promptHash = computeHash(truncatedPrompt);
    const responseHash = computeHash(truncatedResponse);

    // meta에 해시 추가
    const meta = {
      ...(body.meta || {}),
      promptHash,
      responseHash,
    };

    // Supabase에 삽입
    const { error } = await supabaseAdmin.from("ai_calls").insert({
      ts: new Date().toISOString(),
      anon_id: anonId,
      session_id: sessionId,
      user_id: body.userId || null,
      project_id: body.projectId || null,
      stage,
      mode,
      model: body.model || null,
      prompt: truncatedPrompt,
      response: truncatedResponse,
      prompt_chars: promptChars,
      response_chars: responseChars,
      latency_ms: body.latencyMs || null,
      ok: body.ok !== undefined ? body.ok : true,
      error: body.error || null,
      meta,
    });

    if (error) {
      console.error("[POST /api/ai-calls] Supabase error:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to log AI call" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/ai-calls] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai-calls
 * 최근 AI 호출 조회 (개발 환경 전용)
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
    const { data, error } = await supabaseAdmin
      .from("ai_calls")
      .select("*")
      .order("ts", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[GET /api/ai-calls] Supabase error:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch AI calls" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, aiCalls: data });
  } catch (error) {
    console.error("[GET /api/ai-calls] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
