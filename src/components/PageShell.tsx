/**
 * PageShell.tsx
 *
 * Standard page container with title, subtitle, and centered max-width layout
 */

import React from "react";

export interface PageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  maxWidth?: "6xl" | "7xl";
}

export function PageShell({
  title,
  subtitle,
  children,
  action,
  maxWidth = "6xl",
}: PageShellProps) {
  const maxWidthClass = maxWidth === "6xl" ? "max-w-6xl" : "max-w-7xl";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="border-b border-gray-200 bg-white">
        <div className={`mx-auto ${maxWidthClass} px-4 py-8 sm:px-6 lg:px-8`}>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-base text-gray-600">{subtitle}</p>
              )}
            </div>
            {action && <div className="ml-4 flex-shrink-0">{action}</div>}
          </div>
        </div>
      </div>

      {/* Page content */}
      <main className={`mx-auto ${maxWidthClass} px-4 py-8 sm:px-6 lg:px-8`}>
        {children}
      </main>
    </div>
  );
}
