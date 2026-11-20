import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminLoginPage from '../../pages/AdminLoginPage';

export default function ProtectedRoute({ children }) {
  const { isOperatorLoggedIn, authLoading } = useAuth();

  // Fix I2: Prevent flashing of login screen during session verification
  if (authLoading) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#090D11] text-slate-600 dark:text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-xs font-mono font-medium tracking-wider uppercase">Checking session...</div>
      </div>
    );
  }

  // If not logged in, show the Admin/Staff Login Page
  if (!isOperatorLoggedIn) {
    return <AdminLoginPage />;
  }

  // Once authenticated, render the Operations Dashboard
  return children;
}
