import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Shield, Menu, X, User, LogOut } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import MetroLogo from './MetroLogo';

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { isOperatorLoggedIn, openLoginModal, logoutOperator } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState('CHECKING');

  useEffect(() => {
    let active = true;
    async function checkHealth() {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL ?? '';
        const res = await fetch(`${apiBase}/health`, { method: 'GET' });
        if (res.ok) {
          if (active) setBackendStatus('READY');
        } else {
          if (active) setBackendStatus('OFFLINE');
        }
      } catch {
        if (active) setBackendStatus('OFFLINE');
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  function handleSectionNavigation(sectionId) {
    setMobileMenuOpen(false);
    if (location.pathname === '/') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(`/#${sectionId}`);
    }
  }

  function handleOperatorClick() {
    if (isOperatorLoggedIn) {
      navigate('/admin');
    } else {
      openLoginModal();
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-[#090D11]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Group (Left): Original MetroLogo + METROAI text */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group">
            <MetroLogo size={32} />
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">
                METRO<span className="text-emerald-600 dark:text-emerald-500">AI</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                Transit Intel
              </span>
            </div>
          </Link>
        </div>

        {/* Center Pill Nav */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <Link
            to="/passenger"
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              location.pathname === '/passenger'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            }`}
          >
            Plan Journey
          </Link>
          <button
            type="button"
            onClick={() => handleSectionNavigation('station-forecast')}
            className="px-3 py-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-xs font-semibold transition-colors cursor-pointer"
          >
            Crowd Forecast
          </button>
          <button
            type="button"
            onClick={() => handleSectionNavigation('how-it-works')}
            className="px-3 py-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-xs font-semibold transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => handleSectionNavigation('prediction-accuracy')}
            className="px-3 py-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-xs font-semibold transition-colors cursor-pointer"
          >
            Prediction Accuracy
          </button>
          <button
            type="button"
            onClick={() => handleSectionNavigation('metro-crowd-map')}
            className="px-3 py-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-xs font-semibold transition-colors cursor-pointer"
          >
            Metro Map
          </button>
        </nav>

        {/* Right Action Cluster */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {/* Service Status Badge (Flat dot, no pulsing glow) */}
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider border ${
              backendStatus === 'READY'
                ? 'bg-slate-50 dark:bg-slate-900/40 text-emerald-600 dark:text-emerald-400 border-slate-200 dark:border-slate-800'
                : 'bg-red-50 dark:bg-red-950/20 text-red-600 border-red-200 dark:border-red-900/50'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus === 'READY' ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-red-500'
              }`}
            />
            <span>{backendStatus === 'READY' ? 'PREDICTION READY' : 'SERVICE OFFLINE'}</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isDark ? <Sun size={15} strokeWidth={1.75} /> : <Moon size={15} strokeWidth={1.75} />}
          </button>

          {/* Operator Dashboard Button: High-contrast Slate Primary CTA */}
          <button
            type="button"
            onClick={handleOperatorClick}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 dark:bg-emerald-600 dark:hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
          >
            <Shield size={14} strokeWidth={1.75} />
            <span>{isOperatorLoggedIn ? 'Operations Center' : 'Operator Dashboard'}</span>
          </button>

          {/* User Status / Logout */}
          {isOperatorLoggedIn ? (
            <button
              type="button"
              onClick={logoutOperator}
              title="Sign out of Operations"
              className="px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-semibold"
            >
              <LogOut size={13} strokeWidth={1.75} />
              <span>Logout</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={openLoginModal}
              title="Sign In to Operations"
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <User size={15} strokeWidth={1.75} />
            </button>
          )}
        </div>

        {/* Mobile menu trigger + Quick Operations Access */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden">
          <button
            type="button"
            onClick={handleOperatorClick}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 active:bg-slate-950 dark:bg-emerald-600 transition-colors shadow-xs"
            title="Operations Dashboard"
          >
            <Shield size={13} strokeWidth={1.75} />
            <span className="hidden sm:inline">Operations</span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
          >
            {isDark ? <Sun size={15} strokeWidth={1.75} /> : <Moon size={15} strokeWidth={1.75} />}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
          >
            {mobileMenuOpen ? <X size={18} strokeWidth={1.75} /> : <Menu size={18} strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090D11] px-4 py-4 space-y-3">
          <Link
            to="/passenger"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400"
          >
            Plan Journey (Passenger Panel)
          </Link>
          <button
            type="button"
            onClick={() => handleSectionNavigation('station-forecast')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Check Crowd Forecast
          </button>
          <button
            type="button"
            onClick={() => handleSectionNavigation('how-it-works')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => handleSectionNavigation('prediction-accuracy')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Prediction Accuracy
          </button>
          <button
            type="button"
            onClick={() => handleSectionNavigation('metro-crowd-map')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Metro Map
          </button>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleOperatorClick();
              }}
              className="block w-full text-center py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
            >
              {isOperatorLoggedIn ? 'Operations Center' : 'Operator Dashboard'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
