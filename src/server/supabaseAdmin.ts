/**
 * supabaseAdmin.ts
 *
 * 서버 사이드 Supabase 클라이언트 (Service Role)
 * - RLS를 우회하여 이벤트/AI 로그 삽입 가능
 * - API Route Handler에서만 사용
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
}

/**
 * 서버 전용 Supabase 클라이언트
 * - Service Role Key 사용
 * - RLS 우회 가능
 * - 절대로 클라이언트로 노출되면 안 됨
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
