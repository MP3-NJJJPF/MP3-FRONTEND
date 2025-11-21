import React, { useState } from "react";
import { Link } from "react-router";
import { MosaicBackground } from "../components/MosaicBackground";
import { useAuthStore } from '../stores/useAuthStore';

/**
 * ForgotPasswordPage Component
 * Handles password recovery process - User enters email to receive reset link
 * Features responsive design: desktop shows centered card, mobile shows full-screen transparent overlay
 */
export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword, isLoading, error } = useAuthStore();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setEmailError("");

    // Validate email
    if (!email) {
      setEmailError("Este campo es obligatorio");
      return;
    }

    try {
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-(--color-background)">
      {/* Mosaic Background */}
      <MosaicBackground />

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        {/* Recovery Container - Full screen on mobile with transparent bg, card on desktop */}
        <div className="w-full min-h-screen md:w-full md:max-w-md bg-(--color-container)/90 md:bg-(--color-container) flex flex-col">
          {/* Logo */}
          <div className="flex justify-center pt-8 pb-6">
            <Link to="/">
              <img
                src="/logo.svg"
                alt="TalkHub Logo"
                className="h-8 w-auto md:h-10"
              />
            </Link>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-center px-6 md:px-8 pb-8">
            {!isSubmitted ? (
              <>
                {/* Title */}
                <div className="mb-6 text-center">
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Recuperación de Contraseña
                  </h1>
                  <p className="text-base text-gray-400">
                    No te preocupes, a todos nos pasa.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                  {/* Email Input */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Correo
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError("");
                      }}
                      placeholder="Ingrese su correo electrónico"
                      className={`w-full h-12 px-4 bg-(--color-input-bg) border-2 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent transition-all ${
                        emailError
                          ? "border-(--color-error)"
                          : "border-(--color-border)"
                      }`}
                    />
                    {emailError && (
                      <p className="mt-1 text-sm text-(--color-error)">
                        {emailError}
                      </p>
                    )}
                  </div>

                  {/* General Error Message */}
                  {error && (
                    <div className="bg-(--color-error)/10 border border-(--color-error) rounded-lg p-3">
                      <p className="text-sm text-(--color-error)">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 flex items-center justify-center rounded-lg bg-(--color-primary) text-base font-normal text-white shadow-lg transition-all hover:bg-(--color-primary-hover) focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ borderRadius: "8px" }}
                    >
                      {isLoading ? 'Enviando...' : 'Enviar Enlace'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                {/* Success Message */}
                <div className="text-center">
                  <div className="mb-6">
                    <div className="mx-auto w-16 h-16 bg-(--color-primary) rounded-full flex items-center justify-center mb-4">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                      ¡Correo Enviado!
                    </h1>
                    <p className="text-base text-gray-400 mb-6">
                      Hemos enviado un enlace de recuperación a tu correo
                      electrónico.
                    </p>
                  </div>
                  <Link
                    to="/login"
                    className="inline-block px-6 py-3 bg-(--color-primary) hover:bg-(--color-primary-hover) text-white font-normal rounded-lg transition-all"
                  >
                    Volver al inicio de sesión
                  </Link>
                </div>
              </>
            )}
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
