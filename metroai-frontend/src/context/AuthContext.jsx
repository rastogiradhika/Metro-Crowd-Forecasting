import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, logoutUser, fetchCurrentUser } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isOperatorLoggedIn, setIsOperatorLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openLoginModal = useCallback(() => setIsModalOpen(true), []);
  const closeLoginModal = useCallback(() => setIsModalOpen(false), []);

  // Check existing session on load via HTTP-Only cookie verification (/auth/me)
  useEffect(() => {
    async function verifySession() {
      try {
        const user = await fetchCurrentUser();
        if (user && (user.role === 'admin' || user.role === 'operator')) {
          setIsOperatorLoggedIn(true);
          setCurrentUser(user);
        } else {
          setIsOperatorLoggedIn(false);
          setCurrentUser(null);
        }
      } catch {
        setIsOperatorLoggedIn(false);
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    verifySession();

    // Listen for 401 Unauthorized signals from API requests (resets auth state quietly without intrusive popup)
    const handleUnauthorized = () => {
      setIsOperatorLoggedIn(false);
      setCurrentUser(null);
    };

    window.addEventListener('metroai:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('metroai:unauthorized', handleUnauthorized);
  }, []);

  const loginOperator = async (email, password) => {
    // 1. Client-side sanity checks
    const emailTrim = (email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrim || !emailRegex.test(emailTrim)) {
      throw new Error('Please enter a valid official DMRC staff email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    // 2. Perform authentic backend handshake (sets secure HTTP-Only cookie)
    const res = await loginUser(emailTrim, password);
    const userRole = res.user?.role || 'admin';
    if (userRole !== 'admin' && userRole !== 'operator') {
      throw new Error('Access restricted: Only authorized DMRC operations staff accounts can log in.');
    }

    setIsOperatorLoggedIn(true);
    setCurrentUser(res.user || { email: emailTrim, role: userRole });
    return res;
  };

  const logoutOperator = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    }
    setIsOperatorLoggedIn(false);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isOperatorLoggedIn,
        currentUser,
        authLoading,
        isModalOpen,
        openLoginModal,
        closeLoginModal,
        loginOperator,
        logoutOperator,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
