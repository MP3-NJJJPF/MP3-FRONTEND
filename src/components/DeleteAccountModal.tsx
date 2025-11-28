import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';

interface DeleteAccountModalProps {
  /**
   * Controls whether the modal is currently visible
   */
  isOpen: boolean;
  /**
   * Callback function invoked when the modal should be closed
   */
  onClose: () => void;
  /**
   * Authentication method used by the user
   * Determines whether password verification is required
   */
  authMethod: 'email' | 'google' | 'github' | null;
  /**
   * Callback function invoked when the user confirms account deletion
   * @param password - The user's password for verification (empty string for OAuth users)
   */
  onConfirm: (password: string) => void;
}

/**
 * DeleteAccountModal Component
 * 
 * A confirmation modal for account deletion that requires explicit user confirmation.
 * The modal implements different validation rules based on the authentication method:
 * - Email authentication: Requires both current password and typing "ELIMINAR"
 * - OAuth (Google/GitHub): Only requires typing "ELIMINAR"
 * 
 * @component
 * @example
 * ```tsx
 * <DeleteAccountModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   authMethod="email"
 *   onConfirm={(password) => handleDeleteAccount(password)}
 * />
 * ```
 */
export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  authMethod,
}) => {
  /**
   * State for storing the user's password input
   * Only used when authMethod is 'email'
   */
  const [password, setPassword] = useState('');
  
  /**
   * State for storing the confirmation text input
   * User must type "ELIMINAR" to enable the delete button
   */
  const [confirmText, setConfirmText] = useState('');

  /**
   * Effect hook to reset form fields when the modal is closed
   * Ensures a clean state when the modal is reopened
   */
  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setConfirmText('');
    }
  }, [isOpen]);

  /**
   * Determines whether the delete button should be enabled
   * For email authentication: requires both password and correct confirmation text
   * For OAuth authentication: only requires correct confirmation text
   */
  const isDeleteEnabled = authMethod === 'email' 
    ? confirmText === 'ELIMINAR' && password.length > 0
    : confirmText === 'ELIMINAR';

  /**
   * Handles form submission
   * Prevents default form behavior and invokes the onConfirm callback if validation passes
   * 
   * @param e - Form submission event
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isDeleteEnabled) {
      onConfirm(password);
    }
  };

  /**
   * Handles modal close action
   * Invokes the onClose callback provided by the parent component
   */
  const handleClose = () => {
    onClose();
  };

  // Early return to avoid rendering when modal is not visible
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="p-6 md:p-8">
        {/* Modal Title */}
        <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-4">
          Eliminar Cuenta
        </h2>

        {/* Warning Message */}
        <p className="text-xs md:text-sm text-gray-400 text-center mb-6">
          Esta acción es permanente y no se puede deshacer. Todos tus datos serán eliminados.
        </p>

        {/* Form Fields Container */}
        <div className="space-y-4 mb-6">
          {/* Password Input - Only shown for email authentication */}
          {authMethod === 'email' && (
            <div>
              <label htmlFor="delete-password" className="block text-xs md:text-sm text-white font-medium mb-2">
                Contraseña Actual
              </label>
              <input
                id="delete-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full h-10 md:h-12 px-4 bg-(--color-input-bg) text-white text-xs md:text-sm rounded-xl border border-(--color-border) focus:outline-none focus:border-(--color-primary) transition-colors placeholder:text-gray-500"
                autoComplete="current-password"
              />
            </div>
          )}

          {/* Confirmation Text Input */}
          <div>
            <label htmlFor="delete-confirm-text" className="block text-xs md:text-sm text-white font-medium mb-2">
              Escribe "ELIMINAR" para confirmar
            </label>
            <input
              id="delete-confirm-text"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="ELIMINAR"
              className="w-full h-10 md:h-12 px-4 bg-(--color-input-bg) text-white text-xs md:text-sm rounded-xl border border-(--color-border) focus:outline-none focus:border-(--color-primary) transition-colors placeholder:text-gray-500"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Action Buttons Container */}
        <div className="space-y-3">
          {/* Delete Account Button */}
          <button
            type="submit"
            disabled={!isDeleteEnabled}
            className={`w-full h-10 md:h-12 text-white font-semibold rounded-xl transition-colors ${
              isDeleteEnabled
                ? 'bg-(--color-error) hover:bg-(--color-error)/80 cursor-pointer'
                : 'bg-gray-600 cursor-not-allowed opacity-50'
            }`}
          >
            Eliminar Cuenta
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={handleClose}
            className="w-full h-10 md:h-12 bg-(--color-primary) hover:bg-(--color-primary-hover) text-white font-semibold rounded-xl transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
};