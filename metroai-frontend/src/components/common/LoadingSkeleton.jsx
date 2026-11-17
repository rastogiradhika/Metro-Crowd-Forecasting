import React from 'react';

export default function LoadingSkeleton({
  width = '100%',
  height = '20px',
  borderRadius = '8px',
  className = '',
}) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-800 ${className}`}
      style={{ width, height, borderRadius }}
    />
  );
}
