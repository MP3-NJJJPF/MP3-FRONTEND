import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { LogoutModal } from './LogoutModal';
import { useAuthStore } from '../stores/useAuthStore';

/**
 * Sidebar Component
 * Navigation sidebar that appears on the left for desktop/tablet
 * and at the bottom for mobile. Has a floating appearance with rounded borders.
 */
export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setIsLogoutModalOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    {
      path: '/dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      label: 'Inicio',
    },
    {
      path: '/profile',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      label: 'Perfil',
    },
  ];

  return (
    <>
      {/* Desktop & Tablet Sidebar - Left Side */}
      <aside className="hidden md:flex md:flex-col md:w-20 md:pl-2 md:py-5 shrink-0">
        <div className="flex flex-col items-center h-full py-5 px-2 bg-(--color-container) rounded-full">
          {/* Logo */}
          <Link to="/dashboard" className="mb-8">
            <img
              src="/logo-icon.svg"
              alt="Logo"
              className="w-12 h-12"
            />
          </Link>

          {/* Navigation Items */}
          <nav className="flex flex-col flex-1 items-center justify-center gap-10">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`p-3 rounded-xl transition-colors ${
                  location.pathname === item.path
                    ? 'bg-(--color-primary) text-white'
                    : 'text-gray-400 hover:bg-(--color-primary)/20 hover:text-white'
                }`}
                title={item.label}
              >
                {item.icon}
              </Link>
            ))}
          </nav>

          {/* Logout Button */}
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="mt-auto p-3 text-gray-400 hover:bg-(--color-error)/20 hover:text-(--color-error) rounded-xl transition-colors"
            title="Cerrar Sesión"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 px-2 py-5 z-50">
        <div className="flex items-center justify-around gap-2 py-2 px-2 bg-(--color-container) rounded-2xl">
          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex flex-col items-center gap-1 p-3 rounded-xl transition-colors text-gray-400 hover:bg-(--color-primary)/20 hover:text-white"
          >
            <img
              src="/logo-icon.svg"
              alt="Logo"
              className="w-6 h-6"
            />
          </Link>

          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
                location.pathname === item.path
                  ? 'bg-(--color-primary) text-white'
                  : 'text-gray-400 hover:bg-(--color-primary)/20 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}

          {/* Logout Button Mobile */}
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex flex-col items-center gap-1 p-3 text-gray-400 hover:bg-(--color-error)/20 hover:text-(--color-error) rounded-xl transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-xs font-medium">Salir</span>
          </button>
        </div>
      </nav>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />
    </>
  );
};

