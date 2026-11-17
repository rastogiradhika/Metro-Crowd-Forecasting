import React from 'react';
import LoadingSkeleton from '../common/LoadingSkeleton';

export default function PassengerSkeleton() {
  return (
    <div className="w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 mb-6">
        <LoadingSkeleton width="200px" height="24px" className="rounded-md" />
        <LoadingSkeleton width="120px" height="24px" className="rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Side: Source */}
        <div className="flex flex-col gap-4">
          <LoadingSkeleton width="140px" height="18px" className="rounded-md" />
          <LoadingSkeleton width="220px" height="32px" className="rounded-md" />
          <LoadingSkeleton width="100%" height="90px" className="rounded-lg" />
          <LoadingSkeleton width="100%" height="60px" className="rounded-lg" />
        </div>

        {/* Right Side: Destination & Advisory */}
        <div className="flex flex-col gap-4">
          <LoadingSkeleton width="140px" height="18px" className="rounded-md" />
          <LoadingSkeleton width="220px" height="32px" className="rounded-md" />
          <LoadingSkeleton width="100%" height="90px" className="rounded-lg" />
          <LoadingSkeleton width="100%" height="60px" className="rounded-lg" />
        </div>
      </div>
    </div>
  );
}
