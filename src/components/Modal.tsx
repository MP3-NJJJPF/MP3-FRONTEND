import React from 'react';

interface ModalProps {
  /**
   * Whether the modal is open or closed
   */
  isOpen: boolean;
  /**
   * Function to close the modal
   */
  onClose: () => void;
  /**
   * Modal content
   */
  children: React.ReactNode;
}

/**
 * Modal Component
 * Base modal component with backdrop and centered content
 * Provides consistent styling for all modal dialogs
 */
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
      <div
        className="bg-(--color-container) rounded-2xl max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
