import React from 'react';
import LoadingSkeleton from '../common/LoadingSkeleton';

export default function PassengerSkeleton() {
  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-6 transition-colors duration-200">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <LoadingSkeleton width="180px" height="20px" className="rounded-md" />
        <LoadingSkeleton width="100px" height="20px" className="rounded-md" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
        <div className="p-4 space-y-4">
          <LoadingSkeleton width="120px" height="16px" className="rounded-md" />
          <LoadingSkeleton width="200px" height="28px" className="rounded-md" />
          <LoadingSkeleton width="100%" height="80px" className="rounded-lg" />
        </div>

        <div className="p-4 space-y-4">
          <LoadingSkeleton width="120px" height="16px" className="rounded-md" />
          <LoadingSkeleton width="200px" height="28px" className="rounded-md" />
          <LoadingSkeleton width="100%" height="80px" className="rounded-lg" />
        </div>
      </div>
    </div>
  );
}
