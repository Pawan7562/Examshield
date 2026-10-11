// src/components/ui/EmptyState.js
import React from 'react';
import { FileQuestion } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = FileQuestion,
  title = 'No items found',
  description = 'There are no records matching your criteria or currently available.',
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-12 rounded-2xl border border-dashed border-surface-border glass-card ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-base font-bold text-text-primary tracking-tight font-heading mb-1.5">
        {title}
      </h4>
      <p className="text-xs text-text-secondary max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
