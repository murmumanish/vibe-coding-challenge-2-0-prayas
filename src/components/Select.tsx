import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  id,
  options,
  placeholder,
  className = "",
  ...props
}: SelectProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`block w-full rounded-xl border px-3.5 py-2.5 text-slate-900 shadow-xs focus:outline-none focus:ring-2 sm:text-sm transition bg-white ${
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
            : "border-slate-200 focus:border-indigo-600 focus:ring-indigo-600/20"
        } ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
