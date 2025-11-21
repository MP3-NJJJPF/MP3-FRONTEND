import React from 'react';
import { Modal } from './Modal';

interface LeaveCallModalProps {
  /**
   * Whether the modal is open or closed
   */
  isOpen: boolean;
  /**
   * Function to close the modal
   */
  onClose: () => void;
  /**
   * Function to handle leaving the call
   */
  onConfirm: () => void;
}

/**
 * LeaveCallModal Component
 * Confirmation modal for leaving a video call
 * Displays warning message and leave/cancel actions
 */
export const LeaveCallModal: React.FC<LeaveCallModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 md:p-8">
        {/* Title */}
        <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-6">
          ¿Quieres salir de la llamada?
        </h2>

        {/* Actions */}
        <div className="space-y-3">
          {/* Confirm Button */}
          <button
            onClick={onConfirm}
            className="w-full h-10 md:h-12 bg-(--color-primary) hover:bg-(--color-primary-hover) text-white font-semibold rounded-xl transition-colors"
          >
            Colgar llamada
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
