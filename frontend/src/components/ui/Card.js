// src/components/ui/Card.js
import React from 'react';

export const Card = ({
  children,
  className = '',
  hover = false,
  glass = true,
  ...props
}) => {
  return (
    <div
      className={`
        rounded-2xl border transition-all duration-200
        ${glass ? 'glass-card' : 'bg-surface border-surface-border'}
        ${hover ? 'glass-card-hover cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`p-6 pb-3 flex flex-col gap-1.5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', as = 'h3', ...props }) => {
  const Component = as;
  return (
    <Component className={`text-lg font-bold text-text-primary tracking-tight ${className}`} {...props}>
      {children}
    </Component>
  );
};

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`text-xs text-text-secondary leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={`p-6 pt-3 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`p-6 pt-0 border-t border-surface-border/50 flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
