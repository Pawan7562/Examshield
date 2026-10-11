// src/components/ui/Switch.js
import React from 'react';

export const Switch = ({
  checked = false,
  onChange,
  disabled = false,
  label,
  description,
  className = '',
}) => {
  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`
            w-11 h-6 rounded-full transition-colors duration-200 border
            ${checked ? 'bg-indigo-600 border-indigo-500 shadow-glow-brand' : 'bg-surface-elevated border-surface-border'}
          `}
        />
        <div
          className={`
            absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-sm
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </div>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-xs font-semibold text-text-primary">{label}</span>}
          {description && <span className="text-[11px] text-text-muted">{description}</span>}
        </div>
      )}
    </label>
  );
};

export default Switch;
