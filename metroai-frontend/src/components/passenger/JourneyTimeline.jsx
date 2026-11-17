import React from 'react';
import { Train, Navigation, ArrowRight } from 'lucide-react';
import { LINE_COLORS } from '../../data/stations';

export default function JourneyTimeline({ route }) {
  if (!route || !route.origin || !route.destination) {
    return null;
  }

  const { origin, intermediate = [], destination } = route;
  const primaryLine = origin.line || destination.line || 'YELLOW';
  const lineColor = LINE_COLORS[primaryLine] || '#EAB308';

  return (
    <div className="w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-200 dark:border-slate-800 mb-6">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: lineColor }}
          />
          <h3 className="font-bold text-slate-900 dark:text-white text-base inline-flex items-center gap-2">
            <span>Journey Sequence: {origin.name}</span>
            <ArrowRight size={14} strokeWidth={1.75} className="text-slate-400" />
            <span>{destination.name}</span>
          </h3>
        </div>
        <div className="text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums">
          {intermediate.length + 2} Stations · {primaryLine} Line
        </div>
      </div>

      {/* Clean Timeline List */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-[11px] sm:before:left-[15px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {/* Origin */}
        <div className="relative flex items-start gap-4">
          <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shrink-0 border-2 border-white dark:border-slate-900 shadow-xs">
            <Train size={12} strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white text-sm">
                {origin.name}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                BOARDING
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Platform Entry & Turnstiles</p>
          </div>
        </div>

        {/* Intermediate Stops */}
        {intermediate.map((station, idx) => (
          <div key={station.id || idx} className="relative flex items-center gap-4">
            <div
              className="absolute -left-6 sm:-left-8 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-2 shrink-0 ml-1.5"
              style={{ borderColor: lineColor }}
            />
            <div className="flex items-center gap-2 py-0.5">
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {station.name}
              </span>
              {station.line && station.line !== primaryLine && (
                <span className="text-[11px] text-cyan-600 dark:text-cyan-400">
                  Interchange to {station.line}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Destination */}
        <div className="relative flex items-start gap-4">
          <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center shrink-0 border-2 border-white dark:border-slate-900 shadow-xs">
            <Navigation size={12} strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white text-sm">
                {destination.name}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                ALIGHTING
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Concourse & Exit Gates</p>
          </div>
        </div>
      </div>
    </div>
  );
}
