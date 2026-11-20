import React from 'react';
import { DoorOpen, ArrowUpSquare, Layers, Split } from 'lucide-react';

export default function StationInfrastructure({
  gates = 0,
  lifts = 0,
  platforms = 0,
  concourses = 0,
  interchange = false,
}) {
  // Operational defaults based on DMRC standard architecture if station metadata is missing
  const effectiveGates = (gates && gates > 0) ? gates : (interchange ? 8 : 4);
  const effectiveLifts = (lifts && lifts > 0) ? lifts : (interchange ? 6 : 3);
  const effectivePlatforms = (platforms && platforms > 0) ? platforms : (interchange ? 4 : 2);
  const effectiveConcourses = (concourses && concourses > 0) ? concourses : (interchange ? 3 : 2);

  const items = [
    { label: 'Entry/Exit Gates', value: effectiveGates, icon: DoorOpen },
    { label: 'Lifts / Elevators', value: effectiveLifts, icon: ArrowUpSquare },
    { label: 'Platform Tracks', value: effectivePlatforms, icon: Layers },
    { label: 'Ticket Hall / Lobby', value: effectiveConcourses, icon: Split },
  ];

  return (
    <div className="w-full p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          Station Infrastructure
        </h4>
        {interchange && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Interchange Hub
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((it, idx) => {
          const Icon = it.icon;
          return (
            <div
              key={idx}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/30 flex items-center gap-3 transition-colors"
            >
              <div className="p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-emerald-400">
                <Icon size={14} strokeWidth={1.75} />
              </div>
              <div>
                <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                  {it.value}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {it.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
