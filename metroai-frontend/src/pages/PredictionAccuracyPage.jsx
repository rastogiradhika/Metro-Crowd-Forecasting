import React from 'react';
import { MODEL_METRICS } from '../data/stations';
import { Award, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PredictionAccuracyPage() {
  return (
    <div className="w-full min-h-screen py-10 sm:py-14 bg-white dark:bg-[#050807] text-[#101513] dark:text-[#F5F7F6] transition-colors">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="space-y-2 border-b border-[#D9E1DD] dark:border-[#1F2A25] pb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-mono uppercase tracking-wider bg-[#059669]/10 text-[#059669] border border-[#059669]/20">
            <Award size={13} strokeWidth={2} />
            <span>AI Verification</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
            How Accurate is Our AI?
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-[#9AA8A1] max-w-3xl leading-relaxed">
            Our forecasting model is continuously tested against Delhi Metro transit arrival data across 1,841,548 commuter time windows.
          </p>
        </div>

        {/* 4 Main Benchmark Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 block mb-2">NETWORK COVERAGE</span>
            <div className="text-3xl sm:text-4xl font-bold font-display text-slate-900 dark:text-white tabular-nums mb-1">
              {MODEL_METRICS.stations}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Stations Monitored across all major Delhi Metro lines.</p>
          </div>

          <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 block mb-2">FORECAST TIMES</span>
            <div className="text-3xl sm:text-4xl font-bold font-display text-slate-900 dark:text-white tabular-nums mb-1">
              10 / 20 / 30m
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Calculated for every 10-minute interval ahead.</p>
          </div>

          <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 block mb-2">AVERAGE PREDICTION ERROR</span>
            <div className="text-3xl sm:text-4xl font-bold font-display text-emerald-600 tabular-nums mb-1">
              4.08 people
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">AI is off by ~4 people on average.</p>
          </div>

          <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 block mb-2">OVERALL ACCURACY</span>
            <div className="text-3xl sm:text-4xl font-bold font-display text-emerald-500 tabular-nums mb-1">
              99.8%
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Consistent accuracy across peak morning and evening rush hours.</p>
          </div>
        </div>

        {/* Simplified Bulleted Summary List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 space-y-4">
          <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
            Key Highlights of the Model
          </h3>
          <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-[#059669] shrink-0 mt-0.5" />
              <span><strong>Tested on 1.8 Million+ historical data points:</strong> Validated rigorously across every station and line.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-[#059669] shrink-0 mt-0.5" />
              <span><strong>Predicts accurately 10, 20, and 30 minutes ahead:</strong> Gives commuters and station controllers enough time to plan and act.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-[#059669] shrink-0 mt-0.5" />
              <span><strong>Considers Peak Rush Windows:</strong> Learns historical surge patterns during office commute times to anticipate sudden crowds before they form.</span>
            </li>
          </ul>

          <div className="pt-4 border-t border-slate-100 dark:border-[#1F2A25] flex justify-end">
            <Link
              to="/passenger"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#059669] text-[#050807] font-bold text-xs hover:bg-[#10B981] transition-all"
            >
              <span>Try a Station Forecast</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
