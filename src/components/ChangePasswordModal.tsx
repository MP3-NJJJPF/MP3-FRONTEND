import React, { useState } from 'react';
import { Modal } from './Modal';

interface ChangePasswordModalProps {
  /**
   * Whether the modal is open or closed
   */
  isOpen: boolean;
  /**
   * Function to close the modal
   */
  onClose: () => void;
  /**
   * Function to handle password change
   */
  onSave: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => void;
}

/**
 * ChangePasswordModal Component
 * Modal for changing user password
 * Requires current password, new password, and confirmation
 */
export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    
    onSave({ currentPassword, newPassword, confirmPassword });
    
    // Reset form
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 md:p-8">
        {/* Title */}
        <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-6">
          Nueva Contraseña
        </h2>

        {/* Form Fields */}
        <div className="space-y-4 mb-6">
          {/* Current Password */}
          <div>
            <label htmlFor="currentPassword" className="block text-xs md:text-sm text-white font-medium mb-2">
              Contraseña Actual
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="********"
              className="w-full h-10 md:h-12 px-4 bg-(--color-input-bg) text-white text-xs md:text-sm rounded-xl border border-(--color-border) focus:outline-none focus:border-(--color-primary) transition-colors placeholder:text-gray-500"
              required
            />
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-xs md:text-sm text-white font-medium mb-2">
              Nueva Contraseña
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="********"
              className="w-full h-10 md:h-12 px-4 bg-(--color-input-bg) text-white text-xs md:text-sm rounded-xl border border-(--color-border) focus:outline-none focus:border-(--color-primary) transition-colors placeholder:text-gray-500"
              required
              minLength={8}
            />
          </div>

          {/* Confirm New Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-xs md:text-sm text-white font-medium mb-2">
              Confirmar Nueva Contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="********"
              className="w-full h-10 md:h-12 px-4 bg-(--color-input-bg) text-white text-xs md:text-sm rounded-xl border border-(--color-border) focus:outline-none focus:border-(--color-primary) transition-colors placeholder:text-gray-500"
              required
              minLength={8}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Save Button */}
          <button
            type="submit"
            className="w-full h-10 md:h-12 bg-(--color-primary) hover:bg-(--color-primary-hover) text-white font-semibold rounded-xl transition-colors"
          >
            Cambiar Contraseña
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full h-10 md:h-12 bg-(--color-error) hover:bg-(--color-error)/80 text-white font-semibold rounded-xl transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
};
