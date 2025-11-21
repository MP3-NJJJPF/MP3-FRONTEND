import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { MosaicBackground } from '../components/MosaicBackground';
import { apiClient } from '../fetch/fetchClient';

/**
 * ResetPasswordPage Component
 * Handles password reset after user clicks the email link
 * User creates a new password with confirmation
 * Features responsive design: desktop shows centered card, mobile shows full-screen transparent overlay
 */
export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setGeneralError('Enlace de recuperación inválido o expirado');
    }
  }, [token, email]);

  const validatePassword = (pwd: string): string => {
    if (!pwd) {
      return 'Este campo es obligatorio';
    }
    const errors: string[] = [];
    if (pwd.length < 8) errors.push('mínimo 8 caracteres');
    if (!/[A-Z]/.test(pwd)) errors.push('una mayúscula');
    if (!/[a-z]/.test(pwd)) errors.push('una minúscula');
    if (!/[0-9]/.test(pwd)) errors.push('un número');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) errors.push('un carácter especial');
    
    if (errors.length > 0) {
      return `La contraseña debe contener: ${errors.join(', ')}`;
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setNewPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');

    let hasError = false;

    // Validate token and email
    if (!token || !email) {
      setGeneralError('Enlace de recuperación inválido o expirado');
      return;
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (passwordValidation) {
      setNewPasswordError(passwordValidation);
      hasError = true;
    }

    // Validate confirm password
    if (!confirmPassword) {
      setConfirmPasswordError('Este campo es obligatorio');
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Las contraseñas no coinciden');
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);
    
    try {
      await apiClient.post('/api/v1/users/reset-password', {
        password: newPassword,
        confirmPassword: confirmPassword,
        token: token,
        email: email,
      });

      // Redirect to login after successful reset
      navigate('/login', {
        state: {
          message: 'Contraseña restablecida exitosamente. Por favor inicia sesión con tu nueva contraseña.'
        }
      });
    } catch (error: any) {
      setGeneralError(error.message || 'Error al restablecer la contraseña. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-(--color-background)">
      {/* Mosaic Background */}
      <MosaicBackground />

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        {/* Reset Container - Full screen on mobile with transparent bg, card on desktop */}
        <div className="w-full min-h-screen md:w-full md:max-w-md bg-(--color-container)/90 md:bg-(--color-container) flex flex-col">
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
              <h1 className="text-3xl font-bold text-white mb-2">Restablecer Contraseña</h1>
              <p className="text-base text-gray-400">
                Ingresa tu nueva contraseña
              </p>
            </div>

            {/* General Error Message */}
            {generalError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400 text-center">{generalError}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              {/* New Password Input */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Nueva Contraseña
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setNewPasswordError('');
                  }}
                  placeholder="********"
                  className={`w-full h-12 px-4 bg-(--color-input-bg) border-2 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent transition-all ${
                    newPasswordError ? 'border-(--color-error)' : 'border-(--color-border)'
                  }`}
                />
                {newPasswordError && (
                  <p className="mt-1 text-sm text-(--color-error)">{newPasswordError}</p>
                )}
              </div>

              {/* Confirm Password Input */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmPasswordError('');
                  }}
                  placeholder="********"
                  className={`w-full h-12 px-4 bg-(--color-input-bg) border-2 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent transition-all ${
                    confirmPasswordError ? 'border-(--color-error)' : 'border-(--color-border)'
                  }`}
                />
                {confirmPasswordError && (
                  <p className="mt-1 text-sm text-(--color-error)">{confirmPasswordError}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !token || !email}
                  className="w-full h-12 flex items-center justify-center rounded-lg bg-(--color-primary) text-base font-normal text-white shadow-lg transition-all hover:bg-(--color-primary-hover) focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderRadius: '8px' }}
                >
                  {isLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
                </button>
              </div>
            </form>
          </div>
          {/* Back to Login Link */}
            <div className="text-center pb-8">
              <Link
                to="/login"
                className="text-sm font-medium text-white hover:text-gray-300 transition-colors"
              >
                Volver al inicio de sesión
              </Link>
            </div>
        </div>
      </div>
    </div>
  );
};
