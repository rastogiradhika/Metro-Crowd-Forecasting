import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { TrainFront, Sun, Moon, Shield, Menu, X, LogOut, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { isOperatorLoggedIn, openLoginModal, logoutOperator } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPassenger = location.pathname.startsWith('/passenger');
  const isAdmin = location.pathname.startsWith('/admin');

  // Handle section routing from any page
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

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 transition-saas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo (Left): Modern Metro Emblem with TrainFront */}
        <Link
          to="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2 text-slate-900 dark:text-white group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#0F172A] dark:bg-slate-800 text-cyan-400 flex items-center justify-center border border-slate-700/80 shadow-xs transition-saas group-hover:border-cyan-500">
            <TrainFront size={18} strokeWidth={2} />
          </div>
          <span className="font-bold text-lg tracking-tight">
            METRO<span className="text-cyan-600 dark:text-cyan-400">AI</span>
          </span>
        </Link>

        {/* Desktop Links (Center) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            to="/passenger"
            className={`transition-saas ${
              isPassenger
                ? 'text-cyan-600 dark:text-cyan-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Plan Journey
          </Link>
          <button
            type="button"
            onClick={() => handleSectionNavigation('how-it-works')}
            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-saas cursor-pointer"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => handleSectionNavigation('metrics')}
            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-saas cursor-pointer"
          >
            Model Performance
          </button>
        </nav>

        {/* Desktop Actions (Right) */}
        <div className="hidden md:flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-saas cursor-pointer"
          >
            {isDark ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
          </button>

          {/* Operator Action */}
          {isOperatorLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                to="/admin"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-saas ${
                  isAdmin
                    ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-800'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 size={13} strokeWidth={2} className="text-emerald-500" />
                <span>Operations Active</span>
              </Link>
              <button
                type="button"
                onClick={logoutOperator}
                title="Sign out of Operations"
                aria-label="Sign out"
                className="p-2 text-slate-400 hover:text-red-600 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 transition-colors cursor-pointer"
              >
                <LogOut size={15} strokeWidth={1.75} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={openLoginModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-[#0F172A] hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-500 transition-saas cursor-pointer shadow-xs"
            >
              <Shield size={15} strokeWidth={1.75} />
              <span>Operator Login</span>
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="p-2 text-slate-500 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
          >
            {isDark ? <Sun size={17} strokeWidth={1.75} /> : <Moon size={17} strokeWidth={1.75} />}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} strokeWidth={1.75} /> : <Menu size={20} strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] px-4 py-5 shadow-lg transition-all animate-fadeIn">
          <div className="flex flex-col gap-3">
            <Link
              to="/passenger"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Plan Journey
            </Link>
            <button
              type="button"
              onClick={() => handleSectionNavigation('how-it-works')}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => handleSectionNavigation('metrics')}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Model Performance
            </button>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              {isOperatorLoggedIn ? (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-cyan-600 text-white text-xs font-semibold"
                  >
                    <CheckCircle2 size={14} strokeWidth={2} />
                    <span>Go to Operations Dashboard</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logoutOperator();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <LogOut size={13} strokeWidth={1.75} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openLoginModal();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#0F172A] dark:bg-cyan-600 text-white text-xs font-semibold"
                >
                  <Shield size={14} strokeWidth={1.75} />
                  <span>Operator Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
