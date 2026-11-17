import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isOperatorLoggedIn, openLoginModal } = useAuth();

  useEffect(() => {
    if (!isOperatorLoggedIn) {
      openLoginModal();
    }
  }, [isOperatorLoggedIn, openLoginModal]);

  if (!isOperatorLoggedIn) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] shadow-sm text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900 flex items-center justify-center">
            <Lock size={22} strokeWidth={1.75} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Operator Authorization Required
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
              The DMRC Network Operations Center is restricted to authorized transit staff and operators.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
            <button
              type="button"
              onClick={openLoginModal}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F172A] hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <ShieldAlert size={14} strokeWidth={1.75} />
              <span>Operator Sign In</span>
            </button>
            <Link
              to="/passenger"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              <span>Passenger Mode</span>
              <ArrowRight size={13} strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
