/**
 * AuthPanel.tsx
 *
 * 인증 패널
 * - 이메일 매직 링크 로그인
 * - 로그아웃
 * - 사용자 정보 표시
 */

"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function AuthPanel() {
  const { user, loading, signInWithEmail, signOut, isConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailSent(false);
    setIsSubmitting(true);

    try {
      await signInWithEmail(email);
      setEmailSent(true);
      setEmail("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "로그인 요청 중 오류가 발생했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await signOut();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "로그아웃 중 오류가 발생했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          Supabase가 설정되지 않았습니다. .env.local 파일에 환경 변수를
          추가해주세요.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">로딩 중...</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">로그인됨</p>
            <p className="text-xs text-gray-600">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={isSubmitting}
            className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
          >
            {isSubmitting ? "로그아웃 중..." : "로그아웃"}
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
      <h4 className="text-sm font-semibold text-gray-800">로그인</h4>

      {emailSent ? (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-sm text-green-800">
            이메일을 확인해주세요!
          </p>
          <p className="text-xs text-green-600 mt-1">
            로그인 링크가 전송되었습니다. 이메일의 링크를 클릭하여 로그인하세요.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSignIn} className="space-y-2">
          <input
            type="email"
            placeholder="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            required
          />
          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="w-full px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isSubmitting ? "전송 중..." : "매직 링크 전송"}
          </button>
        </form>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-2">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <p className="text-xs text-gray-500">
        이메일로 로그인 링크를 받으세요. 비밀번호는 필요 없습니다.
      </p>
    </div>
  );
}
