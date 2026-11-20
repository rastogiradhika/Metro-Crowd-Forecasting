import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Shield, Lock, Mail, AlertCircle, ArrowRight, ExternalLink, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function OperatorModal() {
  const { isModalOpen, closeLoginModal, loginOperator } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeLoginModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, closeLoginModal]);

  if (!isModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginOperator(email, password);
      closeLoginModal();
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeLoginModal}
          aria-label="Close login dialog"
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X size={18} strokeWidth={1.75} />
        </button>

        {/* Modal Header */}
        <div className="space-y-2">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white dark:bg-slate-800 dark:text-emerald-400 flex items-center justify-center shadow-xs border border-slate-200 dark:border-slate-700">
            <Shield size={20} strokeWidth={1.75} />
          </div>
          <h3 id="modal-title" className="text-xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            DMRC Operations Login
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Restricted to verified Delhi Metro Rail Corporation (DMRC) staff, dispatchers, and network controllers.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 rounded-lg text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} strokeWidth={1.75} className="text-red-600 dark:text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Official Staff Email
            </label>
            <div className="relative">
              <Mail size={15} strokeWidth={1.75} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@delhimetrorail.com"
                required
                autoComplete="email"
                className="w-full pl-10 pr-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Staff Password
            </label>
            <div className="relative">
              <Lock size={15} strokeWidth={1.75} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Authenticating DMRC Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to Network Operations</span>
                <ArrowRight size={14} strokeWidth={1.75} />
              </>
            )}
          </button>
        </form>

        {/* Demo Fill Helper Button */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleFillDemo}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            <KeyRound size={13} strokeWidth={1.75} />
            <span>Fill Staff Demo Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              closeLoginModal();
              navigate('/login');
            }}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <span>Full screen page</span>
            <ExternalLink size={12} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}
