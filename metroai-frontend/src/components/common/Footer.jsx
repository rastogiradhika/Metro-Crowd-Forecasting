import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrainFront, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DEMO_MODE } from '../../services/api';

export default function Footer() {
  const { isOperatorLoggedIn, openLoginModal } = useAuth();
  const navigate = useNavigate();

  function handleOperationsClick(e) {
    e.preventDefault();
    if (isOperatorLoggedIn) {
      navigate('/admin');
    } else {
      openLoginModal();
    }
  }

  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] text-slate-600 dark:text-slate-400 text-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          {/* Brand Info & Model Status */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base group">
              <div className="w-7 h-7 rounded-lg bg-[#0F172A] dark:bg-slate-800 text-cyan-400 flex items-center justify-center border border-slate-700/80 shadow-xs">
                <TrainFront size={15} strokeWidth={2} />
              </div>
              <span className="tracking-tight">
                METRO<span className="text-cyan-600 dark:text-cyan-400">AI</span>
              </span>
            </Link>

            <span className="text-slate-300 dark:text-slate-700">·</span>

            <div className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              {DEMO_MODE ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    Demo Data
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Inflow Models Active · MAE 4.08 on synthetic data</span>
                </>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link
              to="/passenger"
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors duration-150"
            >
              Passenger Forecast
            </Link>

            <button
              type="button"
              onClick={handleOperationsClick}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors duration-150 cursor-pointer"
            >
              Operations Center
            </button>
          </nav>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-start gap-2 max-w-2xl">
            <ShieldCheck size={15} strokeWidth={1.75} className="text-slate-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Synthetic Research Model:</strong> Forecasts come from a model trained on synthetic commuter distribution data, not live DMRC sensor measurements. Entrance inflow estimates station turnstile volume rather than instantaneous platform headcounts.
            </p>
          </div>
          <div className="shrink-0 tabular-nums">
            © {new Date().getFullYear()} METROAI · Delhi Metro Transit Intelligence
          </div>
        </div>
      </div>
    </footer>
  );
}
