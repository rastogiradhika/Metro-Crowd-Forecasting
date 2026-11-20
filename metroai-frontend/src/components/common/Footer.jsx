import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MetroLogo from './MetroLogo';
import { useAuth } from '../../context/AuthContext';

export default function Footer() {
  const { isOperatorLoggedIn, openLoginModal } = useAuth();
  const navigate = useNavigate();

  function handleOperatorClick() {
    if (isOperatorLoggedIn) {
      navigate('/admin');
    } else {
      openLoginModal();
    }
  }

  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#090D11] text-slate-500 dark:text-slate-400 py-10 transition-colors">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <MetroLogo size={30} />
            <div>
              <span className="font-display font-bold text-sm tracking-tight text-slate-900 dark:text-white block">
                METRO<span className="text-emerald-600 dark:text-emerald-500">AI</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Delhi Metro Passenger Flow Forecasting Engine
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap items-center gap-6 text-xs font-medium">
            <Link to="/passenger" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Plan Journey</Link>
            <Link to="/map" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Delhi Metro Crowd Map</Link>
            <Link to="/accuracy" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">How Accurate is Our AI?</Link>
            <Link to="/how-it-works" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">How It Works</Link>
            <button
              type="button"
              onClick={handleOperatorClick}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Operator Dashboard
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 dark:text-slate-400">
          <p>
            © {new Date().getFullYear()} METROAI Transit Intelligence. Powered by Official Metro Schedules.
          </p>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">AI Crowd Forecasting Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
