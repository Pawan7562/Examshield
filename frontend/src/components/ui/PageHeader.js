// src/components/ui/PageHeader.js
import React from 'react';

export const PageHeader = ({
  title,
  subtitle,
  badge,
  actions,
  breadcrumbs,
  className = '',
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-6 border-b border-surface-border ${className}`}>
      <div className="flex flex-col gap-1.5">
        {breadcrumbs && (
          <div className="text-xs text-text-muted flex items-center gap-1.5 mb-1 font-medium">
            {breadcrumbs}
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight font-heading">
            {title}
          </h1>
          {badge && <div>{badge}</div>}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-text-secondary max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-center shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
