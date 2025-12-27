/**
 * useAuth.ts
 *
 * Supabase Auth Hook
 * - 사용자 인증 상태 관리
 * - 이메일 매직 링크 로그인
 * - 로그아웃
 * - 익명 이벤트 연결
 */

"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { getIdentity } from "@/lib/identity";
import type { User } from "@supabase/supabase-js";

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  isConfigured: boolean;
}

/**
 * useAuth Hook
 * - 사용자 인증 상태 추적
 * - 로그인 후 자동으로 익명 이벤트 연결
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // 로그인 후 익명 이벤트 연결
      if (session?.user) {
        linkAnonEvents(session.user.id).catch((err) => {
          console.warn("[useAuth] Failed to link anon events:", err);
        });
      }
    });

    // Auth 상태 변화 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      // 로그인 후 익명 이벤트 연결
      if (session?.user) {
        linkAnonEvents(session.user.id).catch((err) => {
          console.warn("[useAuth] Failed to link anon events:", err);
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * 이메일 매직 링크 로그인
   */
  const signInWithEmail = async (email: string) => {
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase가 설정되지 않았습니다.");
      throw new Error("Supabase not configured");
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        throw error;
      }

      // 성공 메시지는 UI에서 처리
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "로그인 중 오류가 발생했습니다.";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 로그아웃
   */
  const signOut = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase가 설정되지 않았습니다.");
      throw new Error("Supabase not configured");
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "로그아웃 중 오류가 발생했습니다.";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signInWithEmail,
    signOut,
    isConfigured: isSupabaseConfigured,
  };
}

/**
 * 익명 이벤트를 사용자 계정에 연결
 */
async function linkAnonEvents(userId: string): Promise<void> {
  const { anonId } = getIdentity();

  try {
    const response = await fetch("/api/events/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonId, userId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to link events: ${response.status}`);
    }

    const data = await response.json();
    console.log("[linkAnonEvents] Successfully linked:", data);
  } catch (error) {
    console.error("[linkAnonEvents] Error:", error);
    throw error;
  }
}
