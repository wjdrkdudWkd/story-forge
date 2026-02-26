"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // 초기 마운트: localStorage → 시스템 다크모드 → light 순 우선순위
  useEffect(() => {
    const stored = localStorage.getItem("sf-theme") as Theme | null;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ?? (systemDark ? "dark" : "light");
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next: Theme = prev === "light" ? "dark" : "light";
      applyTheme(next);
      localStorage.setItem("sf-theme", next);
      return next;
    });
  };

  // 마운트 전에는 children을 숨겨 flicker 방지
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function useTheme() {
  return useContext(ThemeContext);
}
