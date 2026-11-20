import React from 'react';
import MetroSchematicMap from '../components/common/MetroSchematicMap';
import { Navigation, Info } from 'lucide-react';

export default function MetroMapPage() {
  return (
    <div className="w-full min-h-screen py-10 sm:py-14 bg-white dark:bg-[#050807] text-[#101513] dark:text-[#F5F7F6] transition-colors">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="space-y-2 border-b border-[#D9E1DD] dark:border-[#1F2A25] pb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-mono uppercase tracking-wider bg-[#059669]/10 text-[#059669] border border-[#059669]/20">
            <Navigation size={13} strokeWidth={2} />
            <span>Delhi Metro Crowd Map</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
            Delhi Metro Crowd Map
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-[#9AA8A1] max-w-3xl leading-relaxed">
            Click on any station to see current and future crowd levels across all metro corridors.
          </p>
        </div>

        {/* Map Diagram */}
        <MetroSchematicMap />

        {/* Informative Guidance */}
        <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <Info size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Station Map Guide</span>
            Delhi Metro lines are displayed with standard line colors. Interchange stations (double rings) allow passengers to switch lines and often experience heavier rushes during peak morning (8:30–10:30 AM) and evening (5:30–8:00 PM) hours.
          </div>
        </div>
      </div>
    </div>
  );
}
