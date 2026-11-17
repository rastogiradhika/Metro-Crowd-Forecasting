import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, logoutUser, fetchCurrentUser, DEMO_MODE } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isOperatorLoggedIn, setIsOperatorLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openLoginModal = () => setIsModalOpen(true);
  const closeLoginModal = () => setIsModalOpen(false);

  // Check existing session on load via HTTP-Only cookie verification (/auth/me)
  useEffect(() => {
    async function verifySession() {
      try {
        const user = await fetchCurrentUser();
        if (user && (user.role === 'admin' || user.role === 'operator')) {
          setIsOperatorLoggedIn(true);
          setCurrentUser(user);
        }
      } catch {
        setIsOperatorLoggedIn(false);
        setCurrentUser(null);
      }
    }

    if (!DEMO_MODE) {
      verifySession();
    } else {
      // In Demo mode, check sessionStorage
      try {
        const stored = sessionStorage.getItem('metroai_operator_auth') === 'true';
        setIsOperatorLoggedIn(stored);
      } catch {
        setIsOperatorLoggedIn(false);
      }
    }

    // Listen for 401 Unauthorized signals from API requests
    const handleUnauthorized = () => {
      setIsOperatorLoggedIn(false);
      setCurrentUser(null);
      openLoginModal();
    };

    window.addEventListener('metroai:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('metroai:unauthorized', handleUnauthorized);
  }, []);

  const loginOperator = async (email, password) => {
    // 1. Client-side sanity checks
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      throw new Error('Please enter a valid official email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    // 2. Perform authentic backend handshake (sets HTTP-Only cookie)
    const res = await loginUser(email, password);
    setIsOperatorLoggedIn(true);
    setCurrentUser(res.user || { email, role: 'admin' });

    if (DEMO_MODE) {
      try {
        sessionStorage.setItem('metroai_operator_auth', 'true');
      } catch {
        // ignore storage errors
      }
    }

    return res;
  };

  const logoutOperator = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    }
    try {
      sessionStorage.removeItem('metroai_operator_auth');
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
