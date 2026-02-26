"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/authContext";
import { ApiError } from "@/lib/api/apiClient";

type Tab = "login" | "signup";

export function AuthPanel() {
  const { login, signup } = useAuth();

  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (tab === "login") {
        await login(email, password);
      } else {
        await signup(email, password, nickname || undefined);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleTabChange = (next: Tab) => {
    setTab(next);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-transparent px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Story Forge
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            블록 기반 스토리 기획 도구
          </p>
        </div>

        <div className="bg-white dark:bg-white/[0.06] dark:backdrop-blur-xl dark:shadow-2xl dark:shadow-black/30 rounded-2xl shadow-sm border border-gray-200 dark:border-white/[0.12] overflow-hidden">
          {/* Tab */}
          <div className="flex border-b border-gray-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={() => handleTabChange("login")}
              className={[
                "flex-1 py-3 text-sm font-medium transition-colors",
                tab === "login"
                  ? "text-green-600 dark:text-green-400 border-b-2 border-green-500"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
              ].join(" ")}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("signup")}
              className={[
                "flex-1 py-3 text-sm font-medium transition-colors",
                tab === "signup"
                  ? "text-green-600 dark:text-green-400 border-b-2 border-green-500"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
              ].join(" ")}
            >
              회원가입
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                이메일
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                비밀번호
              </label>
              <input
                type="password"
                required
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8자 이상"
                minLength={8}
                className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>

            {tab === "signup" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  닉네임 <span className="text-gray-400">(선택)</span>
                </label>
                <input
                  type="text"
                  autoComplete="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="표시될 이름"
                  className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>
            )}

            {error && (
              <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting
                ? "처리 중..."
                : tab === "login"
                ? "로그인"
                : "회원가입"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
