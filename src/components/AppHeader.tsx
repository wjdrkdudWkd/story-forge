"use client";

/**
 * AppHeader.tsx
 *
 * 공통 헤더 — story-forge 워드마크 + 스텝 네비게이터 + 테마 토글 + 유저 버튼
 * Light/Dark 두 테마 모두 지원 (레퍼런스 UI 기준)
 */

import React, { useRef, useState, useEffect } from "react";
import { Moon, Sun, LogOut, Zap } from "lucide-react";
import { Stepper, type Step } from "./Stepper";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/authContext";

export interface AppHeaderProps {
  currentStep?: Step;
}

const STEPS: Step[] = [
  { id: "idea",       label: "Idea" },
  { id: "compare",    label: "Compare" },
  { id: "character",  label: "Character" },
  { id: "acts",       label: "Acts" },
  { id: "blocks",     label: "Blocks" },
  { id: "write",      label: "Write" },
];

// TODO: 실제 서비스 토큰 사용량 API로 교체 예정
const MOCK_TOKEN_USAGE = {
  used: 12450,
  total: 50000,
  resetDate: "2026년 3월 1일",
  plan: "Free",
};

function UserDropdown({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initial    = (user.nickname?.[0] ?? user.email[0]).toUpperCase();
  const joinedDate = new Date(user.created_at).toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <div
      className="
        absolute right-0 top-full mt-2 z-50
        w-64 rounded-xl
        bg-white/95 dark:bg-[#0f1e35]/95
        backdrop-blur-xl
        border border-gray-200 dark:border-white/10
        shadow-xl shadow-black/10 dark:shadow-black/40
        overflow-hidden
      "
      onClick={(e) => e.stopPropagation()}
    >
      {/* 유저 정보 섹션 */}
      <div className="px-4 py-3.5 border-b border-gray-100 dark:border-white/8">
        <div className="flex items-center gap-3">
          {/* 아바타 */}
          <div className="
            w-9 h-9 rounded-full flex-shrink-0
            bg-indigo-100 dark:bg-indigo-500/20
            text-indigo-600 dark:text-indigo-300
            flex items-center justify-center text-sm font-bold
          ">
            {initial}
          </div>
          <div className="min-w-0">
            {user.nickname && (
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user.nickname}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-white/50 truncate">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* 토큰 사용량 (TODO: 실제 API 연동 예정) */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-white/8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-amber-500 dark:text-amber-400" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30">
              이번 달 토큰 사용량
            </p>
          </div>
          <span className="text-[10px] font-medium text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded-full">
            {MOCK_TOKEN_USAGE.plan}
          </span>
        </div>
        {/* 프로그레스 바 */}
        <div className="w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden mb-1.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 dark:from-indigo-500 dark:to-violet-500 transition-all"
            style={{ width: `${(MOCK_TOKEN_USAGE.used / MOCK_TOKEN_USAGE.total) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500 dark:text-white/40">
            {MOCK_TOKEN_USAGE.used.toLocaleString()} / {MOCK_TOKEN_USAGE.total.toLocaleString()}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-white/30">
            {MOCK_TOKEN_USAGE.resetDate} 초기화
          </span>
        </div>
      </div>

      {/* 계정 메타 */}
      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-white/8">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-white/30">가입일</span>
          <span className="text-xs text-gray-600 dark:text-white/50">{joinedDate}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-400 dark:text-white/30">계정 상태</span>
          <span className={`text-xs font-medium ${user.is_active ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
            {user.is_active ? "활성" : "비활성"}
          </span>
        </div>
      </div>

      {/* 로그아웃 버튼 */}
      <div className="px-2 py-2">
        <button
          onClick={handleLogout}
          className="
            w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
            text-red-600 dark:text-red-400
            hover:bg-red-50 dark:hover:bg-red-500/10
            transition-colors duration-150 text-sm font-medium
          "
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>
      </div>
    </div>
  );
}

function UserButton() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!isAuthenticated || !user) return null;

  const initial = (user.nickname?.[0] ?? user.email[0]).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        aria-label="계정 메뉴"
        className="
          w-8 h-8 rounded-full flex items-center justify-center
          text-xs font-bold
          bg-indigo-100 text-indigo-600
          dark:bg-indigo-500/20 dark:text-indigo-300
          hover:bg-indigo-200 dark:hover:bg-indigo-500/30
          ring-2 ring-transparent hover:ring-indigo-300 dark:hover:ring-indigo-500/50
          transition-all duration-150
        "
      >
        {initial}
      </button>

      {open && (
        <UserDropdown onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

export function AppHeader({ currentStep }: AppHeaderProps) {
  const { theme, toggle } = useTheme();

  return (
    <header className="
      sticky top-0 z-50
      border-b border-gray-200 bg-white
      dark:border-white/10 dark:bg-black/30 dark:backdrop-blur-xl
      transition-colors duration-200
    ">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Wordmark */}
        <div className="flex-shrink-0 w-32">
          <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white/90">
            story-forge
          </span>
        </div>

        {/* Stepper — center */}
        <div className="flex-1 flex justify-center">
          <Stepper steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Right controls: 테마 토글 + 유저 버튼 */}
        <div className="flex-shrink-0 w-32 flex justify-end items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="
              flex items-center justify-center
              w-8 h-8 rounded-full
              text-gray-500 hover:text-gray-900 hover:bg-gray-100
              dark:text-white/50 dark:hover:text-white dark:hover:bg-white/10
              transition-all duration-150
            "
          >
            {theme === "light"
              ? <Moon className="h-4 w-4" />
              : <Sun  className="h-4 w-4" />
            }
          </button>

          {/* User button */}
          <UserButton />
        </div>
      </div>
    </header>
  );
}
