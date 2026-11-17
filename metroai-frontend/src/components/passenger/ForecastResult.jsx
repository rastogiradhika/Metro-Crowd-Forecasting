import React, { useState, useEffect } from 'react';
import {
  Clock,
  DoorOpen,
  ArrowRight,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';
import JourneyTimeline from './JourneyTimeline';
import { getRiskConfig } from '../../utils/risk';
import { formatNumber, formatTime } from '../../utils/formatters';

export default function ForecastResult({
  result,
  onApplyOffset,
  travelTime,
}) {
  // Live timestamp (Hooks are called unconditionally at the top)
  const [formattedTime, setFormattedTime] = useState('');
  useEffect(() => {
    if (!result) return;
    const now = new Date();
    setFormattedTime(
      now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
  }, [result]);

  // Early return placed AFTER all hooks
  if (!result) return null;

  const { origin, destination, route, advisory } = result;
  const originRisk = getRiskConfig(origin.risk_level);
  const destRisk = getRiskConfig(destination.risk_level);

  // Honest data: do not fabricate numbers if series is not returned
  const series = origin.horizon_series || null;

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* SINGLE UNIFIED RESULT CARD WITH 1PX DIVIDERS (NO NESTED CARDS) */}
      <div className="w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-sm overflow-hidden transition-colors duration-200">
        {/* Top Success Header Bar with Green Accent */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 size={15} strokeWidth={2} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Forecast Ready
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 inline-flex items-center gap-1.5">
                Journey: <strong className="text-slate-900 dark:text-white">{origin.station_name}</strong>
                <ArrowRight size={12} strokeWidth={1.75} className="text-slate-400" />
                <strong className="text-slate-900 dark:text-white">{destination.station_name}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 tabular-nums">
            <Clock size={13} strokeWidth={1.75} />
            <span>Travel Window: {formatTime(travelTime)}</span>
          </div>
        </div>

        {/* Core Main Grid: Vertical 1px border dividing Origin and Destination */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* LEFT COLUMN: Origin Station Data (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:border-r border-slate-200 dark:border-slate-700/80 flex flex-col justify-between gap-6">
            <div>
              {/* Origin Station Title & Risk Badge */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Origin Station
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {origin.station_name}
                  </h3>
                </div>

                {/* Status Badge */}
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shrink-0"
                  style={{
                    backgroundColor: originRisk.bg,
                    borderColor: originRisk.border,
                    color: originRisk.color,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: originRisk.color }}
                  />
                  <span>{originRisk.shortLabel} Risk</span>
                </div>
              </div>

              {/* Main Metric: Predicted Inflow (Tabular numbers) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-6">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
                  <span>PREDICTED PASSENGER INFLOW</span>
                  <span className="tabular-nums font-mono text-slate-500 dark:text-slate-400">+{origin.horizon_minutes || 20}m horizon</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums"
                    style={{ color: originRisk.color }}
                  >
                    {formatNumber(origin.predicted_inflow)}
                  </span>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    passengers entering / 10m
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                  {originRisk.description}
                </p>
              </div>

              {/* Horizon Projection: 10m, 20m, 30m */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                  <span>Inflow Horizon Breakdown</span>
                  <span className="text-slate-500 dark:text-slate-400 font-normal">Next 30 mins</span>
                </div>

                {series ? (
                  <div className="grid grid-cols-3 gap-3">
                    {series.map((item) => {
                      const itemRisk = getRiskConfig(item.risk);
                      return (
                        <div
                          key={item.horizon}
                          className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>+{item.horizon}m</span>
                            <span
                              className="font-semibold text-[10px] uppercase"
                              style={{ color: itemRisk.color }}
                            >
                              {itemRisk.shortLabel}
                            </span>
                          </div>
                          <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                            {formatNumber(item.inflow)}
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">entering</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 text-center">
                    Horizon breakdown series unavailable for this station window.
                  </div>
                )}
              </div>
            </div>

            {/* Accessibility Data */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <DoorOpen size={14} strokeWidth={1.75} className="shrink-0 text-slate-500" />
              <span>
                Station Infrastructure: {origin.gates || 6} gates · {origin.lifts || 2} lifts · {origin.platforms || 2} platforms
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: Destination Station & Smart Advisory (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-6 bg-slate-50/40 dark:bg-slate-900/30">
            <div>
              {/* Destination Station Header */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Destination Station
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {destination.station_name}
                  </h3>
                </div>

                {/* Status Badge */}
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shrink-0"
                  style={{
                    backgroundColor: destRisk.bg,
                    borderColor: destRisk.border,
                    color: destRisk.color,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: destRisk.color }}
                  />
                  <span>{destRisk.shortLabel} Risk</span>
                </div>
              </div>

              {/* Destination Arrival & Expected Inflow */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Est. Arrival
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatTime(destination.forecast_time || '08:45')}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Inflow at Arrival
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatNumber(destination.predicted_inflow)} pax
                  </span>
                </div>
              </div>

              {/* Smart Travel Advisory Section */}
              {advisory && (
                <div className="p-4 rounded-xl border border-cyan-200 dark:border-cyan-800/80 bg-cyan-50/60 dark:bg-cyan-950/30">
                  <div className="flex items-center gap-2 mb-2 text-cyan-800 dark:text-cyan-400 font-semibold text-xs tracking-wider uppercase">
                    <Lightbulb size={15} strokeWidth={1.75} />
                    <span>Smart Travel Advisory</span>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                    {advisory.message}
                  </p>

                  {advisory.gate_recommendation && (
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 mb-3 bg-white/80 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                      <DoorOpen size={14} strokeWidth={1.75} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                      <span>{advisory.gate_recommendation}</span>
                    </div>
                  )}

                  {advisory.suggest_time_offset && onApplyOffset && (
                    <button
                      type="button"
                      onClick={() => onApplyOffset(advisory.suggest_time_offset)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 text-xs font-semibold transition-colors duration-150 cursor-pointer shadow-xs"
                    >
                      <Clock size={13} strokeWidth={1.75} />
                      <span>
                        Check {advisory.later_time ? formatTime(advisory.later_time) : `+${advisory.suggest_time_offset} mins later`}
                      </span>
                      <ArrowRight size={13} strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Model Disclaimer & Info */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed space-y-1">
              <div>
                {result?.meta?.disclaimer || 'Forecasts come from a model trained on SYNTHETIC data, not DMRC measurements.'}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500">
                Inflow forecasts represent passenger entrance volume across turnstiles, not instantaneous platform headcounts.
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM METADATA BAR: Live Timestamp & Model MAE */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="tabular-nums">
              Last updated: {formattedTime || 'Just now'} · MAE 4.08 on synthetic data
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Delhi Metro Synthetic Inflow Engine v2.0
          </div>
        </div>
      </div>

      {/* Journey Timeline Progression */}
      <JourneyTimeline route={route} />
    </div>
  );
}
