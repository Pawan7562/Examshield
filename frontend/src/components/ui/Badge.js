// src/components/ui/Badge.js
import React from 'react';

const badgeVariants = {
  brand: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
  cyan: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
  success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  danger: 'bg-red-500/15 text-red-400 border border-red-500/30',
  neutral: 'bg-white/5 text-text-secondary border border-surface-border',
  live: 'bg-red-500/20 text-red-400 border border-red-500/40 badge-live-pulse font-semibold',
};

const badgeSizes = {
  xs: 'text-[10px] px-2 py-0.5 rounded-md gap-1',
  sm: 'text-xs px-2.5 py-0.5 rounded-full gap-1.5',
  md: 'text-xs px-3 py-1 rounded-full gap-1.5 font-medium',
  lg: 'text-sm px-3.5 py-1.5 rounded-full gap-2 font-semibold',
};

export const Badge = ({
  children,
  variant = 'brand',
  size = 'sm',
  dot = false,
  className = '',
  ...props
}) => {
  const variantCls = badgeVariants[variant] || badgeVariants.brand;
  const sizeCls = badgeSizes[size] || badgeSizes.sm;

  return (
    <span
      className={`inline-flex items-center font-medium select-none tracking-wide transition-colors ${variantCls} ${sizeCls} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            variant === 'live'
              ? 'bg-red-400 animate-ping'
              : variant === 'success'
              ? 'bg-emerald-400'
              : variant === 'warning'
              ? 'bg-amber-400'
              : variant === 'danger'
              ? 'bg-red-400'
              : variant === 'cyan'
              ? 'bg-cyan-400'
              : 'bg-indigo-400'
          }`}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
