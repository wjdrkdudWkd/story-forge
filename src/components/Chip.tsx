/**
 * Chip.tsx
 *
 * Tag/badge component with optional icon
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
  const variantClasses = {
    default: "bg-gray-100 text-gray-700 border-gray-200",
    success: "bg-green-50 text-green-700 border-green-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
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
