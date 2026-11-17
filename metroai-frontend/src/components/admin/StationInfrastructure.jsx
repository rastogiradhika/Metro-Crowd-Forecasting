import React from 'react';
import { DoorOpen, ArrowUpSquare, Layers, Split } from 'lucide-react';

export default function StationInfrastructure({
  gates = 0,
  lifts = 0,
  platforms = 0,
  concourses = 0,
  interchange = false,
}) {
  const items = [
    { label: 'Entry/Exit Gates', value: (gates && gates > 0) ? gates : 'Unknown', icon: DoorOpen },
    { label: 'Lifts / Elevators', value: (lifts && lifts > 0) ? lifts : 'Unknown', icon: ArrowUpSquare },
    { label: 'Platform Tracks', value: (platforms && platforms > 0) ? platforms : 'Unknown', icon: Layers },
    { label: 'Concourse Nodes', value: (concourses && concourses > 0) ? concourses : 'Unknown', icon: Split },
  ];

  return (
    <div className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B]">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          Station Infrastructure
        </h4>
        {interchange && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
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
              className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-3"
            >
              <div className="p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                <Icon size={14} strokeWidth={1.75} />
              </div>
              <div>
                <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                  {it.value}
                </div>
                <div className="text-[11px] text-slate-400">
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
