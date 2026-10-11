// src/components/ui/Input.js
import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className = '',
  wrapperClassName = '',
  id,
  type = 'text',
  disabled = false,
  required = false,
  ...props
}, ref) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`w-full flex flex-col gap-1.5 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-text-secondary flex items-center justify-between">
          <span>
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          required={required}
          className={`
            w-full rounded-xl text-sm transition-all duration-200 outline-none
            bg-surface-elevated/70 text-text-primary placeholder:text-text-muted
            border ${error ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-surface-border hover:border-surface-hover focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}
            ${leftIcon ? 'pl-10' : 'pl-3.5'}
            ${rightIcon ? 'pr-10' : 'pr-3.5'}
            py-2.5 disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-red-400 mt-0.5 flex items-center gap-1">
          <span>•</span> {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-text-muted mt-0.5">{hint}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
