import React from 'react';
import { Clock, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import JourneyTimeline from './JourneyTimeline';
import DataNotice from '../common/DataNotice';

function getCrowdStatus(riskLevel) {
  const normalized = (riskLevel || 'LOW').toUpperCase();
  switch (normalized) {
    case 'LOW':
      return {
        label: 'Low Crowd (Comfortable)',
        lightBadge: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        darkBadge: 'dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300',
        textColor: '#059669',
        icon: CheckCircle2,
      };
    case 'MODERATE':
      return {
        label: 'Moderate Crowd',
        lightBadge: 'bg-amber-50 border-amber-200 text-amber-800',
        darkBadge: 'dark:bg-amber-950/40 dark:border-amber-800/60 dark:text-amber-300',
        textColor: '#D97706',
        icon: AlertTriangle,
      };
    case 'HIGH':
    case 'CRITICAL':
      return {
        label: 'High Crowd',
        lightBadge: 'bg-red-50 border-red-200 text-red-800',
        darkBadge: 'dark:bg-red-950/40 dark:border-red-800/60 dark:text-red-300',
        textColor: '#DC2626',
        icon: AlertCircle,
      };
    default:
      return {
        label: 'Comfortable',
        lightBadge: 'bg-slate-50 border-slate-200 text-slate-700',
        darkBadge: 'dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300',
        textColor: '#64748B',
        icon: Info,
      };
  }
}

export default function ForecastResult({ result, onApplyOffset, travelTime }) {
  if (!result) return null;

  const { origin, destination, advisory } = result;
  const originStatus = getCrowdStatus(origin?.risk_level);
  const destStatus = getCrowdStatus(destination?.risk_level);
  const shiftOffset = advisory?.suggest_time_offset || 15;

  return (
    <div className="space-y-6">
      {/* ── 0. AI MODEL DISCLAIMER ───────────────────────────────────────── */}
      <DataNotice meta={result?.meta || origin?.meta} />

      {/* ── 1. ACTIONABLE TRAVEL ADVISORY ─────────────────────────────────── */}
      {advisory && (
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-emerald-400 shrink-0 mt-0.5">
              <Info size={18} strokeWidth={1.75} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Travel Advisory
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${originStatus.lightBadge} ${originStatus.darkBadge}`}
                >
                  {originStatus.label}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-white leading-snug">
                {advisory.message}
              </p>
              {advisory.gate_recommendation && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tip: {advisory.gate_recommendation}
                </p>
              )}
            </div>
          </div>

          {onApplyOffset && (
            <button
              type="button"
              onClick={() => onApplyOffset(shiftOffset)}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 dark:bg-emerald-600 dark:hover:bg-emerald-700 transition-colors shrink-0 cursor-pointer shadow-xs"
            >
              <Clock size={15} strokeWidth={1.75} />
              <span>Check Crowd for +{shiftOffset} mins</span>
            </button>
          )}
        </div>
      )}

      {/* ── 2. ORIGIN & DESTINATION OVERVIEW (Flat Surface, 1px Divider) ────── */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          
          {/* Left Column: Boarding Station */}
          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Boarding Station
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {origin?.station_name}
                </h3>
              </div>
              <span
                className={`px-2.5 py-1 rounded text-xs font-semibold border ${originStatus.lightBadge} ${originStatus.darkBadge}`}
              >
                {originStatus.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Expected Crowd (People)
                </span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {origin?.predicted_inflow}{' '}
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Passengers</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Departure Time
                </span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {origin?.forecast_time || travelTime}
                </div>
              </div>
            </div>

            {/* Crowd Level Indicator Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400">
                <span>Comfortable</span>
                <span>Moderate Rush</span>
                <span>Heavy Rush</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(15, ((origin?.predicted_inflow || 0) / 800) * 100))}%`,
                    backgroundColor: originStatus.textColor,
                  }}
                ></div>
              </div>
            </div>

            {/* 30-Min Inflow Steps */}
            {origin?.horizon_series && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Crowd Forecast for Next 30 Mins
                </span>
                <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50/70 dark:bg-slate-900/40">
                  {origin.horizon_series.map((h) => {
                    const hStatus = getCrowdStatus(h.risk || h.risk_level);
                    return (
                      <div key={h.horizon} className="px-2 text-center space-y-1">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                          After {h.horizon} min
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white block tabular-nums">
                          {h.inflow || h.predicted_inflow}
                        </span>
                        <span
                          className="text-[10px] font-semibold block"
                          style={{ color: hStatus.textColor }}
                        >
                          {hStatus.label.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Ticket Gates: <strong className="text-slate-900 dark:text-white">{origin?.gates || 4}</strong></span>
              <span>Platforms: <strong className="text-slate-900 dark:text-white">{origin?.platforms || 2}</strong></span>
            </div>
          </div>

          {/* Right Column: Destination Station */}
          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Destination Station
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {destination?.station_name}
                </h3>
              </div>
              <span
                className={`px-2.5 py-1 rounded text-xs font-semibold border ${destStatus.lightBadge} ${destStatus.darkBadge}`}
              >
                {destStatus.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Expected Crowd (People)
                </span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {destination?.predicted_inflow}{' '}
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Passengers</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Estimated Arrival Time
                </span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {destination?.forecast_time}
                </div>
              </div>
            </div>

            {/* Arrival Expectation Info Box */}
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <span className="font-semibold text-slate-900 dark:text-white block">
                Arrival Transit Expectation
              </span>
              <p className="leading-relaxed">
                Expected conditions at {destination?.station_name} around {destination?.forecast_time} are{' '}
                <strong style={{ color: destStatus.textColor }}>
                  {destStatus.label.toLowerCase()}
                </strong>.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Line: <strong className="text-slate-900 dark:text-white">{destination?.line} Line</strong></span>
              <span>Ticket Gates: <strong className="text-slate-900 dark:text-white">{destination?.gates || 4}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. ROUTE TIMELINE ────────────────────────────────────────────── */}
      <JourneyTimeline origin={origin} destination={destination} route={result.route} />
    </div>
  );
}
