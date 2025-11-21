import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { EditProfileModal } from '../components/EditProfileModal';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { DeleteAccountModal } from '../components/DeleteAccountModal';

/**
 * ProfilePage Component
 * User profile management page
 * Displays user information (name, email, age) and account actions
 * (change password, edit profile, delete account)
 */
export const ProfilePage: React.FC = () => {
  // TODO: Get from auth context
  const [user, setUser] = useState({
    fullName: 'Jean Pierre Cardenas',
    email: 'jean123456@gmail.com',
    age: 12,
    photoUrl: '/assets/profile-placeholder.jpg',
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);

  const handleChangePassword = () => {
    setIsChangePasswordModalOpen(true);
  };

  const handleSavePassword = (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    // TODO: Implement save password logic
    console.log('Changing password:', data);
    setIsChangePasswordModalOpen(false);
  };

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = (data: { fullName: string; email: string; age: string }) => {
    // TODO: Implement save profile logic
    console.log('Saving profile:', data);
    setUser({
      ...user,
      fullName: data.fullName,
      email: data.email,
      age: parseInt(data.age),
    });
    setIsEditModalOpen(false);
  };

  const handleDeleteAccount = () => {
    setIsDeleteAccountModalOpen(true);
  };

  const handleConfirmDelete = (password: string) => {
    // TODO: Implement delete account logic
    console.log('Deleting account with password:', password);
    setIsDeleteAccountModalOpen(false);
    // Redirect to home or login page after deletion
  };

  return (
    <div className="min-h-screen bg-(--color-background) flex flex-row">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 pb-32 md:pb-12">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Mi Cuenta
          </h1>
          <p className="text-base md:text-lg text-gray-400">
            Gestiona tu información de perfil y la configuración de tu cuenta.
          </p>
        </div>

        {/* Profile Card */}
        <div className="w-full max-w-md bg-(--color-container) rounded-2xl p-8">
          {/* User Info Section */}
          <div className="flex items-start gap-6 mb-6">
            {/* Profile Photo */}
            <div className="shrink-0">
              <img
                src={user.photoUrl}
                alt={user.fullName}
                className="w-24 h-24 rounded-full object-cover"
              />
            </div>

            {/* User Details */}
            <div className="flex-1">
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">Nombre Completo</p>
                <p className="text-lg font-semibold text-white">{user.fullName}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">Correo</p>
                <p className="text-base text-white">{user.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Edad</p>
                <p className="text-base text-white">{user.age} años</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-t border-(--color-border) my-6" />

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Change Password Button */}
            <button
              onClick={handleChangePassword}
              className="w-full h-12 flex items-center justify-center gap-2 bg-(--color-primary) hover:bg-(--color-primary-hover) text-white font-semibold rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Cambiar Contraseña
            </button>

            {/* Edit Profile Button */}
            <button
              onClick={handleEditProfile}
              className="w-full h-12 flex items-center justify-center gap-2 bg-(--color-primary) hover:bg-(--color-primary-hover) text-white font-semibold rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar Perfil
            </button>

            {/* Delete Account Button */}
            <button
              onClick={handleDeleteAccount}
              className="w-full h-12 flex items-center justify-center gap-2 bg-(--color-error) hover:bg-(--color-error)/80 text-white font-semibold rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar Cuenta
            </button>
          </div>
        </div>

        {/* Edit Profile Modal */}
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveProfile}
          initialData={user}
        />

        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
          onSave={handleSavePassword}
        />

        {/* Delete Account Modal */}
        <DeleteAccountModal
          isOpen={isDeleteAccountModalOpen}
          onClose={() => setIsDeleteAccountModalOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      </main>
    </div>
  );
};
