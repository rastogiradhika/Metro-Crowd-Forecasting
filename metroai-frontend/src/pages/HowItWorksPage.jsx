import React from 'react';
import { Layers, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HowItWorksPage() {
  return (
    <div className="w-full min-h-screen py-10 sm:py-14 bg-white dark:bg-[#050807] text-[#101513] dark:text-[#F5F7F6] transition-colors">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="space-y-2 border-b border-[#D9E1DD] dark:border-[#1F2A25] pb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-mono uppercase tracking-wider bg-[#059669]/10 text-[#059669] border border-[#059669]/20">
            <Layers size={13} strokeWidth={2} />
            <span>Process Overview</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
            How MetroAI Forecasts Flow
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-[#9AA8A1] max-w-3xl leading-relaxed">
            From metro timetables to smart commuter advice in three simple steps.
          </p>
        </div>

        {/* 3 Step Pipeline Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="p-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-600/40 transition-colors flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center font-mono text-emerald-600 font-bold text-sm">
                01
              </div>
              <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                We Read Train Schedules
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Metro timetables and station network connections are read directly from official DMRC static schedules, mapping all 262 stations, train timings, and interchange routes.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 font-mono text-[11px] text-emerald-600">
              STEP 1 • SCHEDULE INGESTION
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-600/40 transition-colors flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center font-mono text-emerald-600 font-bold text-sm">
                02
              </div>
              <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                AI Predicts the Crowd
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Our AI analyzes time of day, train frequency, and past crowd patterns to estimate how many people will enter each station in the next 10, 20, and 30 minutes.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 font-mono text-[11px] text-emerald-600">
              STEP 2 • INTELLIGENT ESTIMATION
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-600/40 transition-colors flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center font-mono text-emerald-600 font-bold text-sm">
                03
              </div>
              <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                You Get Travel Advice
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                You receive simple guidance (such as shifting your departure by 15 minutes to skip rush lines) while DMRC station controllers receive proactive alerts to manage gates smoothly.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 font-mono text-[11px] text-emerald-600">
              STEP 3 • ACTIONABLE GUIDANCE
            </div>
          </div>
        </div>

        {/* Clean Call To Action Box (Formula removed) */}
        <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Ready to plan a faster, smoother commute?
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Check crowd forecasts for any Delhi Metro station right now before you leave home.
            </p>
          </div>
          <Link
            to="/passenger"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 transition-all shadow-md"
          >
            <span>Check Crowd Forecast</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
