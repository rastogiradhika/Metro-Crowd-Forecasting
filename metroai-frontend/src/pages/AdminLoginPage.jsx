import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLoginPage() {
  const { isOperatorLoggedIn, loginOperator } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already authenticated, redirect to /admin
  useEffect(() => {
    if (isOperatorLoggedIn) {
      navigate('/admin', { replace: true });
    }
  }, [isOperatorLoggedIn, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginOperator(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@delhimetrorail.com');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center px-4 py-12 sm:py-16 bg-slate-50 dark:bg-[#090D11] transition-colors duration-200">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-lg space-y-6">
        
        {/* Header with DMRC Operations Shield */}
        <div className="space-y-2 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-lg bg-slate-900 text-white dark:bg-slate-800 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
            <Shield size={24} strokeWidth={1.75} />
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            DMRC Operations Login
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
            Restricted to authorized transit controllers, dispatchers, and DMRC station operations staff.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 rounded-lg text-red-700 dark:text-red-300 text-xs flex items-center gap-2.5">
            <AlertCircle size={16} strokeWidth={1.75} className="text-red-600 dark:text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Official Staff Email
            </label>
            <div className="relative">
              <Mail size={16} strokeWidth={1.75} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@delhimetrorail.com"
                required
                autoComplete="email"
                className="w-full h-10 pl-10 pr-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Staff Password
            </label>
            <div className="relative">
              <Lock size={16} strokeWidth={1.75} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                className="w-full h-10 pl-10 pr-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Authenticating Staff Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to Operations Dashboard</span>
                <ArrowRight size={14} strokeWidth={1.75} />
              </>
            )}
          </button>
        </form>

        {/* Credentials Info Helper Box with Quick Demo Fill */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900 dark:text-white block">
              DMRC Staff Authentication
            </span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              <KeyRound size={12} strokeWidth={1.75} />
              <span>Fill Demo Login</span>
            </button>
          </div>
          <p className="leading-relaxed">
            Staff account: <code className="font-mono text-slate-800 dark:text-slate-300">admin@delhimetrorail.com</code>
          </p>
        </div>

        {/* Back to Public Passenger Mode Link */}
        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
          <Link
            to="/passenger"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={13} strokeWidth={1.75} />
            <span>Return to Commuter Journey Planner</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
