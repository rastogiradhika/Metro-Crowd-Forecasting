import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Shield, ChevronRight } from 'lucide-react';
import { MODEL_METRICS } from '../data/stations';
import { useAuth } from '../context/AuthContext';

// Sleek, modern Delhi Metro train SVG (No pill badge, sits directly on rail)
function MetroTrainSvg({ className = '' }) {
  return (
    <svg
      viewBox="0 0 144 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Sleek Aerodynamic Metro Coach Body */}
      <path
        d="M6 28 L11 12 C13 8 17 6 23 6 L124 6 C132 6 138 11 140 18 L141 28 C141 31 139 33 136 33 L9 33 C6.8 33 6 31 6 28 Z"
        className="fill-slate-900 dark:fill-slate-100"
      />
      {/* Front Nose Windshield Slope */}
      <path
        d="M122 6 L138 16 C140 19 139 24 137 27 L118 27 Z"
        className="fill-slate-800 dark:fill-slate-200"
      />
      {/* Cyan Windshield Glass */}
      <path
        d="M121 10 L133 17 C134 18.5 134 20 132 20 L119 20 C118 20 117.5 19 118 17.5 L120 11.5 C120.2 10.5 120.5 10 121 10 Z"
        className="fill-cyan-400 dark:fill-cyan-500"
      />
      {/* Passenger Windows */}
      <rect x="18" y="11" width="14" height="9" rx="1.5" className="fill-slate-100 dark:fill-slate-800" />
      <rect x="37" y="11" width="14" height="9" rx="1.5" className="fill-slate-100 dark:fill-slate-800" />
      <rect x="56" y="11" width="14" height="9" rx="1.5" className="fill-slate-100 dark:fill-slate-800" />
      <rect x="75" y="11" width="14" height="9" rx="1.5" className="fill-slate-100 dark:fill-slate-800" />
      <rect x="94" y="11" width="14" height="9" rx="1.5" className="fill-slate-100 dark:fill-slate-800" />
      {/* Metro Livery Stripe (Delhi Yellow / Cyan accent line) */}
      <path d="M8 25 L137 25" stroke="#06B6D4" strokeWidth="2.2" strokeLinecap="round" />
      {/* Dual Headlights */}
      <circle cx="136" cy="26" r="1.75" className="fill-amber-300 dark:fill-amber-400" />
      {/* Steel Wheels / Bogies sitting right on rail */}
      <circle cx="24" cy="33.5" r="3" className="fill-slate-700 dark:fill-slate-400" stroke="#0F172A" strokeWidth="1" />
      <circle cx="36" cy="33.5" r="3" className="fill-slate-700 dark:fill-slate-400" stroke="#0F172A" strokeWidth="1" />
      <circle cx="94" cy="33.5" r="3" className="fill-slate-700 dark:fill-slate-400" stroke="#0F172A" strokeWidth="1" />
      <circle cx="106" cy="33.5" r="3" className="fill-slate-700 dark:fill-slate-400" stroke="#0F172A" strokeWidth="1" />
      {/* Pantograph */}
      <path d="M42 6 L45 2 L55 2 L58 6" stroke="#64748B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LandingPage() {
  const { isOperatorLoggedIn, openLoginModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to anchor on load or route navigation
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [location]);

  function handleOperationsCTA() {
    if (isOperatorLoggedIn) {
      navigate('/admin');
    } else {
      openLoginModal();
    }
  }

  return (
    <div className="w-full flex flex-col gap-14 sm:gap-20 py-8 sm:py-16 md:py-20 transition-saas">
      {/* ── HERO SECTION: Strict 7xl Grid Alignment ───────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 sm:mb-8 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] text-xs font-medium text-slate-700 dark:text-slate-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Station Passenger Inflow Forecast Engine</span>
          </div>

          {/* Clean Headline (Mobile-first responsive text) */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-4 sm:mb-6">
            Predict Crowd. <br className="hidden sm:inline" />
            <span className="text-slate-900 dark:text-white">Plan Better.</span>
          </h1>

          {/* Subheading */}
          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed mb-8 sm:mb-10 px-2">
            Passenger-flow forecasting across 262 Delhi Metro stations to help commuters plan smarter departures and transit operators anticipate platform pressure.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mb-10 sm:mb-14">
            <Link
              to="/passenger"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-[#0F172A] hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-500 transition-saas shadow-xs cursor-pointer"
            >
              <span>Check Crowd Forecast</span>
              <ArrowRight size={16} strokeWidth={1.75} />
            </Link>
            <button
              type="button"
              onClick={handleOperationsCTA}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-saas cursor-pointer"
            >
              <Shield size={16} strokeWidth={1.75} />
              <span>Open Operations Dashboard</span>
            </button>
          </div>
        </div>

        {/* ── CONTINUOUS SOLID DOUBLE RAILWAY TRACK & TRAIN (NO PILL BADGE) ────────── */}
        <div className="w-full max-w-4xl mx-auto py-5 px-4 sm:px-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] shadow-2xs overflow-hidden">
          {/* Station Endpoints */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500 mb-3 px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
              <span>ORIGIN: RAJIV CHOWK</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>TERMINAL: HAUZ KHAS</span>
              <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
            </div>
          </div>

          {/* Continuous Railway Track: Solid double steel rails without ruler ticks */}
          <div className="relative h-12 flex items-end overflow-hidden w-full">
            {/* Upper solid steel rail */}
            <div className="absolute bottom-3 left-0 right-0 h-[2.5px] bg-slate-300 dark:bg-slate-700 rounded-full" />
            {/* Lower solid steel rail */}
            <div className="absolute bottom-1 left-0 right-0 h-[2px] bg-slate-300/80 dark:bg-slate-700/80 rounded-full" />
            {/* Subtle transit guide glow */}
            <div className="absolute bottom-2 left-0 right-0 h-[1.5px] bg-cyan-500/20 dark:bg-cyan-400/25" />

            {/* Sleek Metro Train SVG continuously looping across track without stopping */}
            <div className="train-continuous-rail pointer-events-none flex items-center">
              <MetroTrainSvg className="w-32 sm:w-40 h-auto drop-shadow-xs" />
            </div>
          </div>
        </div>
      </section>

      {/* ── VERIFIED METRICS SECTION ───────────────────────────── */}
      <section id="metrics" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:divide-x md:divide-slate-200 md:dark:divide-slate-800">
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {MODEL_METRICS.stations}
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                Stations Monitored
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                10 / 20 / 30m
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                Forecast Horizons
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {MODEL_METRICS.mae_10m}
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                Model MAE (Residual)
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                0.998
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                Test R² Score
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            How METROAI Forecasts Flow
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Transforming static timetable schedules into predictive station passenger inflow rates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center font-bold text-sm mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                GTFS Timetable Ingestion
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Aggregates 262 station topologies, headway frequencies, and multi-line interchange bottlenecks from official Delhi transit schedules.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-mono text-cyan-600 dark:text-cyan-400">
              Station Network Graph
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center font-bold text-sm mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Multi-Horizon Inflow Models
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Trains residual XGBoost models predicting entrance volume rates (+10, +20, and +30 minutes ahead) with an MAE of 4.08 on synthetic commuter data (2% residual improvement over static diurnal profiles).
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-mono text-cyan-600 dark:text-cyan-400">
              Residual Time-Series ML
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center font-bold text-sm mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Smart Mitigation & Dispatch
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Provides commuters with time-shift departure advisories and delivers real-time priority alerts and crowd management recommendations to DMRC operators.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-mono text-cyan-600 dark:text-cyan-400">
              Preemptive Crowd Routing
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER CALLOUT ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-4">
        <div className="bg-[#0F172A] dark:bg-[#1E293B] text-white rounded-2xl p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
          <div className="max-w-xl">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
              Explore Delhi Metro's Passenger Forecast
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 dark:text-slate-400 leading-relaxed">
              Check expected inflow at your boarding station or inspect the network-wide operational priority schematic.
            </p>
          </div>
          <Link
            to="/passenger"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 dark:bg-cyan-500 dark:text-white dark:hover:bg-cyan-400 transition-saas shrink-0"
          >
            <span>Plan a Journey</span>
            <ChevronRight size={16} strokeWidth={1.75} />
          </Link>
        </div>
      </section>
    </div>
  );
}
