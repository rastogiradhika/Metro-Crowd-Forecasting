import React from 'react';
import { Activity, AlertTriangle, ShieldCheck, CheckCircle2, TrendingUp } from 'lucide-react';

export default function NetworkSummary({ summary, totalStations = 262, horizon = 20 }) {
  if (!summary) return null;

  const kpis = [
    {
      label: 'Stations Monitored',
      value: totalStations,
      sub: `+${horizon}m horizon active`,
      colorClass: 'text-slate-900 dark:text-white',
      badgeClass: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800',
      icon: Activity,
    },
    {
      label: 'Critical Inflow',
      value: summary.critical || 0,
      sub: '>550 pax / 10m',
      colorClass: 'text-red-600 dark:text-red-400',
      badgeClass: 'text-red-600 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900',
      icon: AlertTriangle,
    },
    {
      label: 'High Inflow',
      value: summary.high || 0,
      sub: '350-550 pax / 10m',
      colorClass: 'text-amber-600 dark:text-amber-400',
      badgeClass: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
      icon: TrendingUp,
    },
    {
      label: 'Moderate',
      value: summary.moderate || 0,
      sub: '150-350 pax / 10m',
      colorClass: 'text-yellow-600 dark:text-yellow-400',
      badgeClass: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-900',
      icon: ShieldCheck,
    },
    {
      label: 'Low / Normal',
      value: summary.low || 0,
      sub: '<150 pax / 10m',
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      badgeClass: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3 transition-colors duration-150"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>{kpi.label}</span>
              <div className={`p-1.5 rounded-md border ${kpi.badgeClass}`}>
                <Icon size={14} strokeWidth={1.75} />
              </div>
            </div>

            <div>
              <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${kpi.colorClass}`}>
                {kpi.value}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 tabular-nums">
                {kpi.sub}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
