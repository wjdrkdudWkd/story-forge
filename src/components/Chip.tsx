"use client";

/**
 * Chip.tsx — Light / Dark 테마 지원
 */

import React from "react";
import { LucideIcon } from "lucide-react";

export interface ChipProps {
  icon?: LucideIcon;
  children: React.ReactNode;
  variant?: "default" | "success" | "info" | "warning";
  className?: string;
}

export function Chip({
  icon: Icon,
  children,
  variant = "default",
  className = "",
}: ChipProps) {
  const variantClasses: Record<string, string> = {
    default:
      "bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/8 dark:text-white/60 dark:border-white/12",
    success:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30",
    info:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",
    warning:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  };

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      <span>{children}</span>
    </div>
  );
}
