/**
 * supabaseClient.ts
 *
 * 브라우저 사이드 Supabase 클라이언트
 * - 사용자 인증(Auth) 전용
 * - Public Anon Key 사용 (안전하게 노출 가능)
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * 브라우저 전용 Supabase 클라이언트
 * - 사용자 인증에만 사용
 * - RLS 정책 적용됨
 * - 이벤트/AI 로그 삽입 권한 없음 (서버에서만 가능)
 *
 * 환경 변수가 없으면 null 반환
 */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createBrowserClient(supabaseUrl, supabaseAnonKey)
    : null;

/**
 * Supabase가 설정되어 있는지 확인
 */
export const isSupabaseConfigured = !!supabase;
