import React, { useState } from 'react';
import { ShieldAlert, Send, Check } from 'lucide-react';

export default function OperationalSuggestion({
  riskLevel = 'LOW',
  stationName = 'Station',
  recommendation = null,
}) {
  const [alertSent, setAlertSent] = useState(false);

  const defaultAction =
    recommendation?.action ||
    (riskLevel === 'CRITICAL'
      ? `Deploy 3 additional RPF staff at Platform 2. Divert incoming passengers to Gate 5.`
      : riskLevel === 'HIGH'
      ? `High inflow expected at ${stationName}. Ensure ticketing gates are functioning at full capacity and maintain crowd clearance.`
      : riskLevel === 'MODERATE'
      ? `Expect steady commuter influx. Standard peak monitoring protocol advised.`
      : `Standard platform monitoring and regular headway management are sufficient.`);

  const isHighRisk = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';

  return (
    <div className={`w-full p-4 rounded-xl border ${
      isHighRisk
        ? 'border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20'
        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B]'
    }`}>
      <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        <ShieldAlert size={15} strokeWidth={1.75} className={isHighRisk ? 'text-red-600' : 'text-slate-500'} />
        <span>Action & Resource Allocation</span>
      </div>

      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed mb-4">
        {defaultAction}
      </p>

      {isHighRisk && (
        <div>
          {alertSent ? (
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-medium">
              <Check size={14} strokeWidth={2} />
              <span>Staff Alert Dispatched! Action Logged in DMRC Dispatch System.</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAlertSent(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors duration-150 cursor-pointer shadow-xs"
            >
              <Send size={13} strokeWidth={1.75} />
              <span>Dispatch Staff Alert</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
