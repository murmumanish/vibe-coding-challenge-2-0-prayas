// src/components/EmptyState.tsx
import React from "react";
import { InboxIcon } from "./Icons";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-[#18202c]/60 px-6 py-12 text-center backdrop-blur-sm transition-colors">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#ADD8E6]/30 dark:bg-[#ADD8E6]/10 text-slate-800 dark:text-[#ADD8E6] mb-2">
        {icon || <InboxIcon className="w-7 h-7" />}
      </div>
      <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
