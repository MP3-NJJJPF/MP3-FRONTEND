import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { CallRoomPage } from './pages/CallRoomPage';
import { SiteMapPage } from './pages/SiteMapPage';
import { CompleteOAuthPage } from './pages/CompleteOAuthPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './stores/useAuthStore';

/**
 * Main application component
 * Handles routing configuration for all pages
 * Initializes Firebase auth observer on mount
 */
const App: React.FC = () => {
  const initAuthObserver = useAuthStore((state) => state.initAuthObserver);

  // Initialize Firebase auth observer
  useEffect(() => {
    const unsubscribe = initAuthObserver();
    return () => unsubscribe();
  }, [initAuthObserver]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/sitemap" element={<SiteMapPage />} />
        <Route path="/complete-oauth" element={<CompleteOAuthPage />} />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/call/:roomId" 
          element={
            <ProtectedRoute>
              <CallRoomPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
};
export default App;