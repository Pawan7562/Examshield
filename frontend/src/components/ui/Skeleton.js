// src/components/ui/Skeleton.js
import React from 'react';

export const Skeleton = ({
  className = '',
  variant = 'rounded', // 'rounded' | 'circular' | 'text'
  width,
  height,
}) => {
  const variantStyles = {
    circular: 'rounded-full',
    rounded: 'rounded-xl',
    text: 'rounded-md h-4',
  };

  return (
    <div
      className={`skeleton-shimmer ${variantStyles[variant] || 'rounded-xl'} ${className}`}
      style={{
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
      }}
    />
  );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
