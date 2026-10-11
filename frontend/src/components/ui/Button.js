// src/components/ui/Button.js
import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const variantStyles = {
  primary: 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-glow-brand hover:brightness-110 active:scale-[0.98] border border-indigo-400/30',
  secondary: 'bg-surface hover:bg-surface-hover text-text-primary border border-surface-border active:scale-[0.98]',
  outline: 'bg-transparent text-text-primary border border-surface-border hover:border-indigo-500/50 hover:bg-indigo-500/10 active:scale-[0.98]',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5 active:scale-[0.98]',
  danger: 'bg-red-600 hover:bg-red-500 text-white shadow-glow-danger border border-red-500/30 active:scale-[0.98]',
  cyan: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-glow-cyan hover:brightness-110 active:scale-[0.98] border border-cyan-400/30',
  success: 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/30 active:scale-[0.98]',
};

const sizeStyles = {
  xs: 'text-xs px-2.5 py-1 rounded-md gap-1.5 font-medium',
  sm: 'text-xs px-3.5 py-1.5 rounded-lg gap-2 font-medium',
  md: 'text-sm px-4 py-2 rounded-xl gap-2 font-semibold',
  lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5 font-semibold',
  xl: 'text-lg px-6 py-3.5 rounded-2xl gap-3 font-bold',
};

export const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  type = 'button',
  onClick,
  ...props
}, ref) => {
  const base = 'inline-flex items-center justify-center transition-all duration-200 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer';
  const variantCls = variantStyles[variant] || variantStyles.primary;
  const sizeCls = sizeStyles[size] || sizeStyles.md;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${base} ${variantCls} ${sizeCls} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
