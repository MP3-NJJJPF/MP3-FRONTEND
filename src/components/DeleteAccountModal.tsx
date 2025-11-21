import React, { useState } from 'react';
import { Modal } from './Modal';

interface DeleteAccountModalProps {
  /**
   * Whether the modal is open or closed
   */
  isOpen: boolean;
  /**
   * Function to close the modal
   */
  onClose: () => void;
  /**
   * Function to handle account deletion
   */
  onConfirm: (password: string) => void;
}

/**
 * DeleteAccountModal Component
 * Confirmation modal for account deletion
 * Requires current password and typing "ELIMINAR" to enable deletion button
 */
export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const isDeleteEnabled = confirmText === 'ELIMINAR' && password.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isDeleteEnabled) {
      onConfirm(password);
      
      // Reset form
      setPassword('');
      setConfirmText('');
    }
  };

  const handleClose = () => {
    setPassword('');
    setConfirmText('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="p-6 md:p-8">
        {/* Title */}
        <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-4">
          Eliminar Cuenta
        </h2>

        {/* Warning Message */}
        <p className="text-xs md:text-sm text-gray-400 text-center mb-6">
          Esta acción es permanente y no se puede deshacer. Todos tus datos serán eliminados.
        </p>

        {/* Form Fields */}
        <div className="space-y-4 mb-6">
          {/* Current Password */}
          <div>
            <label htmlFor="password" className="block text-xs md:text-sm text-white font-medium mb-2">
              Contraseña Actual
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="w-full h-10 md:h-12 px-4 bg-(--color-input-bg) text-white text-xs md:text-sm rounded-xl border border-(--color-border) focus:outline-none focus:border-(--color-primary) transition-colors placeholder:text-gray-500"
              required
            />
          </div>

          {/* Confirmation Text */}
          <div>
            <label htmlFor="confirmText" className="block text-xs md:text-sm text-white font-medium mb-2">
              Escribe "ELIMINAR" para confirmar
            </label>
            <input
              id="confirmText"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              className="w-full h-10 md:h-12 px-4 bg-(--color-input-bg) text-white text-xs md:text-sm rounded-xl border border-(--color-border) focus:outline-none focus:border-(--color-primary) transition-colors placeholder:text-gray-500"
              required
            />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Delete Button */}
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
