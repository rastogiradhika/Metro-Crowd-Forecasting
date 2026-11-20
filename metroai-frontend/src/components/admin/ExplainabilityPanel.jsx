import React from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function ExplainabilityPanel({ explanation = null }) {
  const isAvailable = explanation && explanation.available && explanation.factors && explanation.factors.length > 0;

  return (
    <div className="w-full p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={15} strokeWidth={1.75} className="text-emerald-600 dark:text-emerald-400" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Why This Prediction?
          </h4>
        </div>
        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          Reason for Prediction (AI)
        </span>
      </div>

      {isAvailable ? (
        <div className="space-y-2.5">
          {explanation.factors.map((factor, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 transition-colors"
            >
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-slate-800 dark:text-slate-200">{factor.label}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">+{factor.impact}% impact</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {factor.description}
              </p>
            </div>
          ))}
          {explanation.method && (
            <div className="pt-1 text-[10px] font-mono text-slate-400 dark:text-slate-500 text-right">
              Powered by {explanation.method}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-xs text-slate-500">
          <AlertCircle size={14} strokeWidth={1.75} className="shrink-0 text-slate-400" />
          <span>
            {explanation?.message || 'Analyzing model feature attributions for this station...'}
          </span>
        </div>
      )}
    </div>
  );
}
