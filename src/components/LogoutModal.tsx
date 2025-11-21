import React from 'react';
import { Modal } from './Modal';

interface LogoutModalProps {
  /**
   * Whether the modal is open or closed
   */
  isOpen: boolean;
  /**
   * Function to close the modal
   */
  onClose: () => void;
  /**
   * Function to handle logout confirmation
   */
  onConfirm: () => void;
}

/**
 * LogoutModal Component
 * Confirmation modal for user logout
 * Displays warning message and logout/cancel actions
 */
export const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 md:p-8">
        {/* Title */}
        <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-4">
          ¿Estás seguro de que quieres cerrar tu sesión?
        </h2>

        {/* Description */}
        <p className="text-xs md:text-sm text-gray-400 text-center mb-6">
          Se te redirigirá a la página de inicio.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          {/* Confirm Button */}
          <button
            onClick={onConfirm}
            className="w-full h-10 md:h-12 bg-(--color-primary) hover:bg-(--color-primary-hover) text-white font-semibold rounded-xl transition-colors"
          >
            Cerrar sesión
          </button>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="w-full h-10 md:h-12 bg-(--color-error) hover:bg-(--color-error)/80 text-white font-semibold rounded-xl transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
};
