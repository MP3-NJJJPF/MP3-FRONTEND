import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { MosaicBackground } from '../components/MosaicBackground';
import { useAuthStore } from '../stores/useAuthStore';

/**
 * LoginPage Component
 * Handles user authentication with email/password and OAuth providers
 * Features responsive design: desktop shows centered card, mobile shows full-screen transparent overlay
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    user, 
    isNewOAuthUser, 
    loginWithEmail, 
    loginWithGoogle, 
    loginWithGithub, 
    isLoading, 
    error 
  } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Show success message from registration
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear message from location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !isNewOAuthUser) {
      navigate('/dashboard');
    } else if (isNewOAuthUser) {
      navigate('/complete-oauth');
    }
  }, [user, isNewOAuthUser, navigate]);

  const validatePassword = (pwd: string): string => {
    if (!pwd) {
      return 'Este campo es obligatorio';
    }
    if (pwd.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setEmailError('');
    setPasswordError('');

    // Validate email
    if (!email) {
      setEmailError('Este campo es obligatorio');
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }

    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      // Error is handled by store
      console.error('Login error:', err);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google login error:', err);
    }
  };

  const handleGithubLogin = async () => {
    try {
      await loginWithGithub();
    } catch (err: any) {
      console.error('GitHub login error:', err);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-(--color-background)">
      {/* Mosaic Background */}
      <MosaicBackground />

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        {/* Login Container - Full screen on mobile with transparent bg, card on desktop */}
        <div className="w-full min-h-screen md:min-h-0 md:w-full md:max-w-md bg-(--color-container)/90 md:bg-(--color-container) flex flex-col">
          {/* Logo */}
          <div className="flex justify-center pt-8 pb-6">
            <Link to="/">
              <img src="/logo.svg" alt="TalkHub Logo" className="h-8 w-auto md:h-10" />
            </Link>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-center px-6 md:px-8 pb-8">
            {/* Title */}
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Inicio de sesión</h1>
              <p className="text-base text-gray-400">
                ¡Bienvenido de nuevo! Por favor, ingresa tus credenciales.
              </p>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-400 text-center">{successMessage}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                  }}
                  placeholder="Ingresa correo electrónico"
                  className={`w-full h-12 px-4 bg-(--color-input-bg) border-2 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent transition-all ${
                    emailError ? 'border-(--color-error)' : 'border-(--color-border)'
                  }`}
                />
                {emailError && (
                  <p className="mt-1 text-sm text-(--color-error)">{emailError}</p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="********"
                  className={`w-full h-12 px-4 bg-(--color-input-bg) border-2 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent transition-all ${
                    passwordError ? 'border-(--color-error)' : 'border-(--color-border)'
                  }`}
                />
                {passwordError && (
                  <p className="mt-1 text-sm text-(--color-error)">{passwordError}</p>
                )}
              </div>

              {/* General Error Message */}
              {error && (
                <div className="bg-(--color-error)/10 border border-(--color-error) rounded-lg p-3">
                  <p className="text-sm text-(--color-error)">{error}</p>
                </div>
              )}

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-(--color-error) hover:text-(--color-error)/80 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 flex items-center justify-center rounded-lg bg-(--color-primary) text-base font-normal text-white shadow-lg transition-all hover:bg-(--color-primary-hover) focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderRadius: '8px' }}
                >
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-(--color-border)"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-(--color-container) text-gray-400">O</span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-12 flex items-center justify-center gap-3 rounded-lg bg-(--color-primary) text-base font-normal text-white shadow-lg transition-all hover:bg-(--color-primary-hover) focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderRadius: '8px' }}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Inicia Sesión con Google
              </button>

              {/* GitHub Button */}
              <button
                type="button"
                onClick={handleGithubLogin}
                disabled={isLoading}
                className="w-full h-12 flex items-center justify-center gap-3 rounded-lg bg-(--color-primary) text-base font-normal text-white shadow-lg transition-all hover:bg-(--color-primary-hover) focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderRadius: '8px' }}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Inicia Sesión con GitHub
              </button>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-gray-400">
                ¿Aún no tienes cuenta?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-white hover:text-gray-300 transition-colors"
                >
                  Crear cuenta
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
