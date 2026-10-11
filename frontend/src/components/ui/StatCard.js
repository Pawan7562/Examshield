// src/components/ui/StatCard.js
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  color = 'indigo', // 'indigo' | 'cyan' | 'emerald' | 'amber' | 'violet'
  className = '',
}) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      glow: 'group-hover:border-indigo-500/40',
      dot: 'bg-indigo-500',
    },
    cyan: {
      bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      glow: 'group-hover:border-cyan-500/40',
      dot: 'bg-cyan-500',
    },
    emerald: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      glow: 'group-hover:border-emerald-500/40',
      dot: 'bg-emerald-500',
    },
    amber: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      glow: 'group-hover:border-amber-500/40',
      dot: 'bg-amber-500',
    },
    violet: {
      bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      glow: 'group-hover:border-purple-500/40',
      dot: 'bg-purple-500',
    },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div
      className={`
        group relative rounded-2xl p-6 transition-all duration-300
        glass-card glass-card-hover ${scheme.glow} ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-text-secondary tracking-wide uppercase">
            {label}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight mt-1 font-heading">
            {value ?? '—'}
          </div>
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl border ${scheme.bg} transition-transform group-hover:scale-110 duration-200`}>
            <Icon className="w-5 h-5 shrink-0" />
          </div>
        )}
      </div>

      {(sub || trend !== undefined) && (
        <div className="mt-4 pt-3 border-t border-surface-border/50 flex items-center justify-between text-xs">
          {sub && <span className="text-text-muted">{sub}</span>}
          {trend !== undefined && (
            <span
              className={`inline-flex items-center gap-1 font-semibold ml-auto ${
                trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-text-muted'
              }`}
            >
              {trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : trend < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : null}
              {trend > 0 ? `+${trend}%` : `${trend}%`}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
