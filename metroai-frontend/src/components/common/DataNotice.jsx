import React from 'react';
import { Info } from 'lucide-react';

export default function DataNotice({ meta, className = '' }) {
  if (!meta) return null;

  const disclaimer = meta.disclaimer || 'Predictions are machine learning forecasts based on historical ridership patterns and seasonal timetables.';
  const modelMode = meta.model_mode || 'heuristic';

  return (
    <div
      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 text-xs transition-colors ${className}`}
    >
      <Info size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
      <span className="italic leading-normal">
        *{disclaimer} (Mode: {modelMode})*
      </span>
    </div>
  );
}
