import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { EditProfileModal } from '../components/EditProfileModal';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { DeleteAccountModal } from '../components/DeleteAccountModal';
import { useAuthStore } from '../stores/useAuthStore';


/**
 * ProfilePage Component
 * User profile management page
 * Displays user information (name, email, age) and account actions
 * (change password, edit profile, delete account)
 */
export const ProfilePage: React.FC = () => {
  const { user: authUser, updateProfile, updatePassword, deleteAccount, isLoading } = useAuthStore();



  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  

  const handleChangePassword = () => {
    setIsChangePasswordModalOpen(true);
  };

  const handleSavePassword = async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      
      // Validate passwords match
      if (data.newPassword !== data.confirmPassword) {
        setErrorMessage('Las contraseñas no coinciden');
        return;
      }
      
      await updatePassword(data.currentPassword, data.newPassword);
      
      setSuccessMessage('Contraseña actualizada exitosamente');
      setIsChangePasswordModalOpen(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cambiar la contraseña. Verifica tu contraseña actual.';
      setErrorMessage(errorMessage);
    }
  };

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (data: { fullName: string; email: string; age: string }) => {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      
      await updateProfile(data.fullName, data.email, parseInt(data.age));
      
      setSuccessMessage('Perfil actualizado exitosamente');
      setIsEditModalOpen(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el perfil';
      setErrorMessage(errorMessage);
    }
  };

  const handleDeleteAccount = () => {
    setIsDeleteAccountModalOpen(true);
  };

  const handleConfirmDelete = async (password: string) => {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      
      await deleteAccount(password);
      
      // Account deleted successfully, redirect to home
      window.location.href = '/';
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar la cuenta. Verifica tu contraseña.';
      setErrorMessage(errorMessage);
      setIsDeleteAccountModalOpen(false);
    }
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
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-400 text-center">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400 text-center">{errorMessage}</p>
            </div>
          )}

          {/* User Info Section */}
          <div className="flex items-start gap-6 mb-6">
            {/* Profile Photo */}
            <div className="shrink-0">
              <img
                src={authUser?.photoURL && authUser.photoURL.trim() !== "" ? authUser.photoURL : '/assets/profile-placeholder.jpg'}
                alt={authUser?.displayName || 'Usuario'}
                className="w-24 h-24 rounded-full object-cover"
              />
            </div>

            {/* User Details */}
            <div className="flex-1">
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">Nombre Completo</p>
                <p className="text-lg font-semibold text-white">{authUser?.displayName || 'N/A'}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">Correo</p>
                <p className="text-base text-white">{authUser?.email || 'N/A'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Edad</p>
                <p className="text-base text-white">{authUser?.age ? `${authUser.age} años` : 'N/A'}</p>
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
              disabled={isLoading}
              className="w-full h-12 flex items-center justify-center gap-2 bg-(--color-error) hover:bg-(--color-error)/80 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          initialData={{
            fullName: authUser?.displayName || '',
            email: authUser?.email || '',
            age: authUser?.age || 0,
          }}
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
