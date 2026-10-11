// src/components/ui/Select.js
import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = forwardRef(({
  label,
  error,
  hint,
  options = [],
  children,
  className = '',
  wrapperClassName = '',
  id,
  disabled = false,
  required = false,
  ...props
}, ref) => {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`w-full flex flex-col gap-1.5 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-text-secondary flex items-center justify-between">
          <span>
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center w-full">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          required={required}
          className={`
            w-full appearance-none rounded-xl text-sm transition-all duration-200 outline-none
            bg-surface-elevated/70 text-text-primary border
            ${error ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-surface-border hover:border-surface-hover focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}
            pl-3.5 pr-10 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        >
          {children || options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface text-text-primary">
              {opt.label || opt.value}
            </option>
          ))}
        </select>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p className="text-xs text-red-400 mt-0.5">• {error}</p>
      ) : hint ? (
        <p className="text-xs text-text-muted mt-0.5">{hint}</p>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
