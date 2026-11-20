import React from 'react';
import { Train, Navigation, ArrowRight, CornerDownRight } from 'lucide-react';
import { LINE_COLORS } from '../../data/stations';

export default function JourneyTimeline({ origin: originProp, destination: destProp, route }) {
  const origin = originProp || route?.origin;
  const destination = destProp || route?.destination;
  if (!origin || !destination) return null;

  const originLine = (origin.line || 'YELLOW').toUpperCase();
  const destLine = (destination.line || originLine).toUpperCase();
  const originColor = LINE_COLORS[originLine] || '#059669';
  const destColor = LINE_COLORS[destLine] || '#059669';
  const hasTransfer = originLine !== destLine;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-6 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Journey Route Overview
          </h3>
          <p className="text-xs text-slate-500 dark:text-[#9AA8A1]">
            Sequential boarding, transfer, and exit steps
          </p>
        </div>

        {/* Actionable line markers */}
        <div className="flex items-center gap-2">
          <span
            className="px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider bg-slate-50 dark:bg-[#111815]"
            style={{
              border: `1px solid ${originColor}`,
              color: originColor,
            }}
          >
            {originLine} Line
          </span>
          {hasTransfer && (
            <>
              <ArrowRight size={16} strokeWidth={1.75} className="text-slate-400 dark:text-slate-600" />
              <span
                className="px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider bg-slate-50 dark:bg-[#111815]"
                style={{
                  border: `1px solid ${destColor}`,
                  color: destColor,
                }}
              >
                {destLine} Line
              </span>
            </>
          )}
        </div>
      </div>

      {/* Visual Journey Steps: Linear vertical spine */}
      <div className="relative pl-7 space-y-6 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-200 dark:before:bg-[#1F2A25]">
        
        {/* Step 1: Boarding */}
        <div className="relative flex items-start gap-3.5">
          <div
            className="absolute -left-7 top-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white"
            style={{ backgroundColor: originColor }}
          >
            <Train size={14} strokeWidth={1.75} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {origin.station_name || origin.name}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-[#111815] text-slate-800 dark:text-[#059669] border border-slate-200 dark:border-[#059669]/30">
                BOARD HERE
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#9AA8A1]">
              Enter through ticket gates. Board the {originLine} Line train toward your destination.
            </p>
          </div>
        </div>

        {/* Step 2: Transfer (Shown only if lines differ) */}
        {hasTransfer && (
          <div className="relative flex items-start gap-3.5">
            <div className="absolute -left-7 top-0.5 w-6 h-6 rounded-full bg-white dark:bg-[#111815] border border-amber-500 text-amber-500 flex items-center justify-center shrink-0">
              <CornerDownRight size={14} strokeWidth={1.75} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  Line Interchange Required
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
                  TRANSFER
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#9AA8A1]">
                Change platforms: Transfer from the <strong className="text-slate-900 dark:text-white">{originLine} Line</strong> to the <strong className="text-slate-900 dark:text-white">{destLine} Line</strong> platform.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Destination Exit */}
        <div className="relative flex items-start gap-3.5">
          <div
            className="absolute -left-7 top-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white"
            style={{ backgroundColor: destColor }}
          >
            <Navigation size={14} strokeWidth={1.75} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {destination.station_name || destination.name}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-[#111815] text-slate-800 dark:text-[#3B82F6] border border-slate-200 dark:border-[#3B82F6]/30">
                EXIT HERE
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#9AA8A1]">
              Arrive at {destination.station_name || destination.name} and exit through ticket gates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
