import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Shield, Mail, Lock, User, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function OperatorModal() {
  const { isModalOpen, closeLoginModal, loginOperator } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isModalOpen) {
      setEmail('');
      setPassword('');
      setOperatorId('');
      setError(null);
      setSuccess(false);
      setLoading(false);
    }
  }, [isModalOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isModalOpen) {
        closeLoginModal();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, closeLoginModal]);

  if (!isModalOpen) return null;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isFormValid = emailRegex.test(email.trim()) && password.length >= 6;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!emailRegex.test(email.trim())) {
      setError('Please provide a valid official email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await loginOperator(email, password);
      setSuccess(true);
      setTimeout(() => {
        closeLoginModal();
        navigate('/admin');
      }, 500);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={closeLoginModal}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-6 sm:p-8 transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="operator-modal-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeLoginModal}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150 cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={18} strokeWidth={1.75} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#0F172A] dark:bg-slate-800 text-white flex items-center justify-center border border-slate-700 shrink-0">
            <Shield size={20} strokeWidth={1.75} className="text-cyan-400" />
          </div>
          <div>
            <h3
              id="operator-modal-title"
              className="text-lg font-bold text-slate-900 dark:text-white tracking-tight"
            >
              Operator Control Portal
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              DMRC Operations & Passenger Inflow Dispatch
            </p>
          </div>
        </div>

        {/* Login / Register Tab Toggle */}
        <div className="flex items-center p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 mb-6">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all duration-150 cursor-pointer ${
              tab === 'login'
                ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Operator Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all duration-150 cursor-pointer ${
              tab === 'register'
                ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Register Station Head
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} strokeWidth={1.75} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success State */}
        {success ? (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={24} strokeWidth={2} />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Authorization Verified
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Redirecting to Network Operations Center...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* If Register: Operator notice */}
            {tab === 'register' && (
              <div className="p-3.5 rounded-xl border border-cyan-200 dark:border-cyan-800 bg-cyan-50/60 dark:bg-cyan-950/30 text-xs text-slate-700 dark:text-slate-300">
                <p className="font-semibold text-cyan-800 dark:text-cyan-400 mb-1">Official Staff Provisioning Policy</p>
                <p className="mb-2 leading-relaxed">
                  Operator and Station Head accounts are restricted to DMRC personnel and must be provisioned by an active Admin via the protected <code>/auth/operators</code> endpoint.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@delhimetrorail.com');
                    setPassword('admin123');
                    setTab('login');
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 text-white font-semibold text-xs hover:bg-cyan-500 transition-colors cursor-pointer"
                >
                  <span>Auto-fill Admin Credentials</span>
                </button>
              </div>
            )}

            {/* Email Field - Empty with placeholder */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="operator-email"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
              >
                Official Email
              </label>
              <div className="relative">
                <Mail size={15} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="operator-email"
                  type="email"
                  required
                  placeholder="operator@delhimetrorail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Field - Masked type="password" */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="operator-password"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
              >
                Password (min 6 characters)
              </label>
              <div className="relative">
                <Lock size={15} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="operator-password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* Submit Button with Loading State & Validation check */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#0F172A] hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white font-semibold text-sm transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} strokeWidth={1.75} className="animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <span>{tab === 'login' ? 'Authenticate & Enter' : 'Register Operator'}</span>
                )}
              </button>
            </div>

            <div className="text-center pt-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Authorized DMRC personnel access only.
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
