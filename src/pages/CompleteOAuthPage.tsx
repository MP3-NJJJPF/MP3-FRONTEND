import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MosaicBackground } from '../components/MosaicBackground';
import { useAuthStore } from '../stores/useAuthStore';

/**
 * CompleteOAuthPage Component
 * Page for completing OAuth registration (Google/GitHub)
 * Users only need to provide their age, name and email are pre-filled from OAuth
 */
export const CompleteOAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { oauthUserData, completeOAuthRegistration, isLoading, error } = useAuthStore();

  const [age, setAge] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    console.log('CompleteOAuthPage - oauthUserData:', oauthUserData);
    // Redirect if no OAuth data
    if (!oauthUserData) {
      console.log('No OAuth data, redirecting to login');
      navigate('/login');
    }
  }, [oauthUserData, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validation
    const ageNum = parseInt(age);
    if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
      setValidationError('Por favor ingresa una edad válida');
      return;
    }

    try {
      await completeOAuthRegistration(ageNum);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al completar el registro';
      setValidationError(message);
    }
  };

  if (!oauthUserData) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-(--color-background)">
      {/* Left side - Mosaic background */}
      <MosaicBackground />

      {/* Right side - Complete Registration form */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src="/logo.svg"
              alt="Logo"
              className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4"
            />
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Completa tu Registro
            </h1>
            <p className="text-sm md:text-base text-gray-400">
              Solo necesitamos un dato más
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field (Disabled) */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                Nombre Completo
              </label>
              <input
                id="name"
                type="text"
                value={oauthUserData?.displayName || ''}
                readOnly
                className="w-full h-12 px-4 bg-(--color-input-bg) text-gray-400 rounded-xl border border-(--color-border) cursor-not-allowed opacity-70"
              />
            </div>

            {/* Email Field (Disabled) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={oauthUserData?.email || ''}
                readOnly
                className="w-full h-12 px-4 bg-(--color-input-bg) text-gray-400 rounded-xl border border-(--color-border) cursor-not-allowed opacity-70"
              />
            </div>

            {/* Age Field (Enabled) */}
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-white mb-2">
                Edad *
              </label>
              <input
                id="age"
                type="number"
                value={age}
                onChange={(e) => {
                  console.log('Age changed:', e.target.value);
                  setAge(e.target.value);
                }}
                onFocus={() => console.log('Age input focused')}
                placeholder="Ingresa tu edad"
                min="1"
                max="150"
                required
                autoFocus
                className="w-full h-12 px-4 bg-(--color-input-bg) text-white rounded-xl border-2 border-(--color-border) focus:outline-none focus:border-(--color-primary) focus:ring-2 focus:ring-(--color-primary)/50 transition-colors"
              />
            </div>

            {/* Error Messages */}
            {(validationError || error) && (
              <p className="text-sm text-(--color-error)">
                {validationError || error}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-(--color-primary) hover:bg-(--color-primary-hover) text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Completando registro...' : 'Completar Registro'}
            </button>
          </form>

          {/* Info text */}
          <p className="text-xs md:text-sm text-gray-400 text-center mt-6">
            Tu nombre y correo fueron obtenidos de tu cuenta. Solo necesitamos tu edad para completar el registro.
          </p>
        </div>
      </div>
    </div>
  );
};
