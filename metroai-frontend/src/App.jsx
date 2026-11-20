import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ScrollProgressBar from './components/common/ScrollProgressBar';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import LandingPage from './pages/LandingPage';
import LoadingSkeleton from './components/common/LoadingSkeleton';
import OperatorModal from './components/common/OperatorModal';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy-load secondary pages
const PassengerDashboard = lazy(() => import('./pages/PassengerDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
import AdminLoginPage from './pages/AdminLoginPage';
const MetroMapPage = lazy(() => import('./pages/MetroMapPage'));
const PredictionAccuracyPage = lazy(() => import('./pages/PredictionAccuracyPage'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));

function PageLoader() {
  return (
    <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <LoadingSkeleton width="100%" height="80px" className="mb-4 rounded-lg" />
      <LoadingSkeleton width="100%" height="320px" className="rounded-lg" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-[#FFFFFF] dark:bg-[#050807] text-[#101513] dark:text-[#F5F7F6] font-sans transition-colors duration-200">
              <ScrollProgressBar />
              <Navbar />
              <main className="flex-1">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/passenger" element={<PassengerDashboard />} />
                    <Route path="/login" element={<AdminLoginPage />} />
                    <Route path="/map" element={<MetroMapPage />} />
                    <Route path="/accuracy" element={<PredictionAccuracyPage />} />
                    <Route path="/how-it-works" element={<HowItWorksPage />} />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
              <OperatorModal />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
