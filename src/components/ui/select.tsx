"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export interface SelectTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export interface SelectContentProps {
  children: React.ReactNode;
}

export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

export function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  SelectTriggerProps
>(({ className, children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(SelectContext);

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex h-9 w-full items-center justify-between rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
      <span className="ml-1 flex h-4 w-4 shrink-0 items-center justify-center">
        <svg
          className="h-3.5 w-3.5 opacity-40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M6 8l4 4 4-4"
          />
        </svg>
      </span>
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = React.useContext(SelectContext);
  return <span className="text-gray-800">{value || placeholder}</span>;
}

export function SelectContent({ children }: SelectContentProps) {
  const { open, setOpen } = React.useContext(SelectContext);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => setOpen(false)}
      />
      <div className="absolute z-50 mt-1 w-full rounded border border-gray-300 bg-white shadow-md">
        <div className="max-h-60 overflow-auto p-1">{children}</div>
      </div>
    </>
  );
}

export function SelectItem({ value, children }: SelectItemProps) {
  const ctx = React.useContext(SelectContext);

  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded px-2 py-1.5 text-sm text-gray-800 outline-none hover:bg-gray-100 focus:bg-gray-100",
        ctx.value === value && "bg-gray-200"
      )}
      onClick={() => {
        ctx.onValueChange?.(value);
        ctx.setOpen(false);
      }}
    >
      {children}
    </div>
  );
}
