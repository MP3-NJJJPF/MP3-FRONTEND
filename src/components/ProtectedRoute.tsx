import React from 'react';
import { Navigate } from 'react-router';
import { useAuthStore } from '../stores/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute Component
 * Wrapper component that protects routes from unauthenticated access
 * Redirects to login if user is not authenticated
 * Redirects to complete-oauth if user needs to complete OAuth registration
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isNewOAuthUser, isLoading } = useAuthStore();

  console.log('🛡️ ProtectedRoute check:');
  console.log('  - isLoading:', isLoading);
  console.log('  - user:', user);
  console.log('  - isNewOAuthUser:', isNewOAuthUser);

  // Show loading state while checking auth
  if (isLoading) {
    console.log('  ➡️ Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--color-background)">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-(--color-primary) border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Cargando...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('  ➡️ Redirecting to /login (no user)');
    return <Navigate to="/login" replace />;
  }

  // Redirect to complete OAuth if user needs to complete registration
  if (isNewOAuthUser) {
    console.log('  ➡️ Redirecting to /complete-oauth');
    return <Navigate to="/complete-oauth" replace />;
  }

  console.log('  ✅ Access granted');
  // User is authenticated and registration is complete
  return <>{children}</>;
};
