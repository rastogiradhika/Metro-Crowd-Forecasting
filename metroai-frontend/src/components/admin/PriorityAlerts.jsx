import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { getRiskConfig } from '../../utils/risk';
import { formatNumber } from '../../utils/formatters';
import { LINE_COLORS } from '../../data/stations';

export default function PriorityAlerts({ alerts = [], onSelectStation }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-slate-200 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
            <AlertTriangle size={16} strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Top 5 Priority Station Inflow Alerts
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Highest projected passenger inflow across the network requiring proactive dispatch
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {alerts.slice(0, 5).map((station, idx) => {
          const risk = getRiskConfig(station.risk_level);
          const lineCol = LINE_COLORS[station.line] || '#64748B';

          return (
            <div
              key={station.station_id || idx}
              onClick={() => onSelectStation && onSelectStation(station.station_id)}
              className="py-3.5 px-3 -mx-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors duration-150 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 text-center text-xs font-mono font-bold text-slate-400">
                  #{idx + 1}
                </span>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: lineCol }}
                    />
                    <span className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {station.station_name}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({station.line} Line)
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      +{station.horizon_minutes}m
                    </span>
                  </div>

                  {station.reason && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {station.reason}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pl-9 sm:pl-0">
                <div className="flex flex-col sm:items-end">
                  <span
                    className="text-base font-extrabold tabular-nums"
                    style={{ color: risk.color }}
                  >
                    {formatNumber(station.predicted_inflow)}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    pax / 10m
                  </span>
                </div>

                <div
                  className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shrink-0"
                  style={{
                    backgroundColor: risk.bg,
                    borderColor: risk.border,
                    color: risk.color,
                  }}
                >
                  {risk.shortLabel}
                </div>

                <ArrowRight
                  size={15}
                  strokeWidth={1.75}
                  className="text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
