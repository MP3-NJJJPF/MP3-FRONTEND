import React, { useState } from 'react';
import { Modal } from './Modal';

interface EditProfileModalProps {
  /**
   * Whether the modal is open or closed
   */
  isOpen: boolean;
  /**
   * Function to close the modal
   */
  onClose: () => void;
  /**
   * Function to handle profile update
   */
  onSave: (data: { fullName: string; email: string; age: string }) => void;
  /**
   * Initial user data
   */
  initialData: {
    fullName: string;
    email: string;
    age: number;
  };
}

/**
 * EditProfileModal Component
 * Modal for editing user profile information
 * Allows editing name, email, and age
 */
export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [fullName, setFullName] = useState(initialData.fullName);
  const [email, setEmail] = useState(initialData.email);
  const [age, setAge] = useState(initialData.age.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ fullName, email, age });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 md:p-8">
        {/* Title */}
        <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-6">
          Editar Cuenta
        </h2>

        {/* Form Fields */}
        <div className="space-y-4 mb-6">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-xs md:text-sm text-white font-medium mb-2">
              Nombre Completo
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-10 md:h-12 px-4 bg-(--color-input-bg) text-white text-xs md:text-sm rounded-xl border border-(--color-border) focus:outline-none focus:border-(--color-primary) transition-colors"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs md:text-sm text-white font-medium mb-2">
              Correo
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 md:h-12 px-4 bg-(--color-input-bg) text-white text-xs md:text-sm rounded-xl border border-(--color-border) focus:outline-none focus:border-(--color-primary) transition-colors"
              required
            />
          </div>

          {/* Age */}
          <div>
            <label htmlFor="age" className="block text-xs md:text-sm text-white font-medium mb-2">
              Edad
            </label>
            <input
              id="age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full h-10 md:h-12 px-4 bg-(--color-input-bg) text-white text-xs md:text-sm rounded-xl border border-(--color-border) focus:outline-none focus:border-(--color-primary) transition-colors"
              required
              min="1"
              max="150"
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
            Guardar Cambios
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
