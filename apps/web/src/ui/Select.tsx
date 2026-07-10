import type { SelectHTMLAttributes } from "react";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  options: SelectOption[];
}

export default function Select({
  label,
 placeholder = "Select an option",
  error,
  required = false,
  options,
  className = "",
  ...props
}: SelectProps) {
  return (
    <div className="space-y-2">

      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}

          {required && (
            <span className="ml-1 text-red-500">*</span>
          )}
        </label>
      )}

      <select
        {...props}
        className={`
          w-full
          rounded-xl
          border
          border-slate-300
          bg-white
          px-4
          py-3
          text-sm
          text-slate-700
          shadow-sm
          transition
          focus:border-emerald-600
          focus:outline-none
          focus:ring-2
          focus:ring-emerald-600
          disabled:cursor-not-allowed
          disabled:bg-slate-100
          ${className}
        `}
      >
        <option value="">
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

    </div>
  );
}