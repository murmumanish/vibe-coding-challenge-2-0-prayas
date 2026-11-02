import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`block w-full rounded-xl border px-3.5 py-2.5 text-slate-900 shadow-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 sm:text-sm transition ${
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
            : "border-slate-200 focus:border-indigo-600 focus:ring-indigo-600/20"
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
