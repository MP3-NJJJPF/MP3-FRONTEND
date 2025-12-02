import { create } from 'zustand';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase.config';
import * as authService from '../services/auth.service';
import { apiClient } from '../fetch/fetchClient';
import type { LoginResponse, UserInfoResponse, OAuthResponse } from '../types/api.types';

/**
 * User interface with application-specific data
 */
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  age?: number;
  isNewOAuthUser?: boolean;
}

/**
 * Authentication store state interface
 */
interface AuthStore {
  // State
  user: User | null;
  idToken: string | null;
  isLoading: boolean;
  error: string | null;
  authMethod: 'email' | 'google' | 'github' | null;
  isNewOAuthUser: boolean;
  oauthUserData: { displayName: string; email: string } | null;

  // Actions
  setUser: (user: User | null) => void;
  setIdToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setOAuthUserData: (data: { displayName: string; email: string } | null) => void;

  // Auth methods
  initAuthObserver: () => () => void;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string, age: number) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  completeOAuthRegistration: (age: number) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (displayName: string, email: string, age: number) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

/**
 * Zustand store for authentication state management
 */
export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  idToken: null,
  authMethod: null,
  isLoading: true,
  error: null,
  isNewOAuthUser: false,
  oauthUserData: null,

  // Setters
  setUser: (user) => set({ user }),
  setIdToken: (token) => set({ idToken: token }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setOAuthUserData: (data) => set({ oauthUserData: data, isNewOAuthUser: !!data }),

  /**
   * Initialize Firebase auth state observer
   * Listens to authentication state changes and fetches user data from backend
   */
  initAuthObserver: () => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (fbUser: FirebaseUser | null) => {
        set({ isLoading: true });

        try {
          if (fbUser) {
            const idToken = await fbUser.getIdToken();

            const providers = fbUser.providerData.map(p => p.providerId);
            let authMethod: 'email' | 'google' | 'github' | null = null;

            if (providers.includes('password')) authMethod = 'email';
            else if (providers.includes('google.com')) authMethod = 'google';
            else if (providers.includes('github.com')) authMethod = 'github';

            const isOAuthUser = fbUser.providerData.some(
              provider => provider.providerId === 'google.com' || provider.providerId === 'github.com'
            );

            try {
              // Intentar obtener datos del backend
              const userData = await apiClient.get(`/api/v1/users/me`) as unknown as UserInfoResponse;
              const userInfo = userData.user;

              const user: User = {
                uid: fbUser.uid,
                email: userInfo.email,
                displayName: userInfo.firstName
                  ? `${userInfo.firstName} ${userInfo.lastName || ''}`.trim()
                  : fbUser.displayName || '',
                photoURL: fbUser.photoURL || userInfo.photoURL || '',
                age: userInfo.age,
              };

              set({
                user,
                idToken: isOAuthUser ? idToken : null,
                authMethod,
                isLoading: false,
                error: null
              });
            } catch (error) {
              console.error('❌ Error fetching user data:', error);

              // Usuario no encontrado en backend, necesita completar perfil
              const user: User = {
                uid: fbUser.uid,
                email: fbUser.email,
                displayName: fbUser.displayName,
                photoURL: fbUser.photoURL,
                age: undefined,
              };

              set({
                user,
                idToken,
                authMethod,
                isLoading: false,
                error: null
              });
            }
          } else {
            // ✅ No hay usuario en Firebase, verificar cookie de sesión
            try {
              const hasValidToken = await apiClient.get("/api/v1/users/check-token");

              if (hasValidToken) {
                const meResponse = await apiClient.get("/api/v1/users/me") as unknown as UserInfoResponse;
                const userInfo = meResponse.user;

                set({
                  user: {
                    uid: userInfo.id || '',
                    email: userInfo.email,
                    displayName: `${userInfo.firstName} ${userInfo.lastName || ''}`.trim(),
                    photoURL: '',
                    age: userInfo.age,
                  },
                  authMethod: 'email',
                  isLoading: false,
                  isNewOAuthUser: false,
                  oauthUserData: null,
                });
                return;
              }
            } catch (error) {
              console.log('No valid session found');
            }

            // No hay sesión válida
            set({
              user: null,
              idToken: null,
              authMethod: null,
              isNewOAuthUser: false,
              oauthUserData: null,
              isLoading: false,
            });
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Authentication error';
          set({ error: errorMessage, isLoading: false });
        }
      },
      (error) => {
        console.error('💥 Auth state change error:', error);
        set({ error: error.message, isLoading: false });
      }
    );

    return unsubscribe;
  },

  /**
   * Login with email and password (manual login)
   */
  loginWithEmail: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.post(
        "/api/v1/users/login",
        { email, password }
      ) as unknown as LoginResponse;

      const appUser: User = {
        uid: response.id,
        email: response.email,
        displayName: response.name || response.email.split("@")[0],
        age: response.age,
        photoURL: "",
      };

      set({
        user: appUser,
        authMethod: 'email',
        idToken: null,
        isNewOAuthUser: false,
        oauthUserData: {
          displayName: appUser.displayName || '',
          email: appUser.email || '',
        },
        isLoading: false,
      });
    } catch (error: any) {
      const message = error?.response?.data?.message || "Correo o contraseña incorrectos.";
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  /**
   * Register new user with email and password
   */
  registerWithEmail: async (email: string, password: string, displayName: string, age: number) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post('/api/v1/users', {
        firstName: displayName,
        lastName: '',
        age,
        email,
        password,
        confirmPassword: password,
      });

      set({ isLoading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Login with Google OAuth
   */
  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const { user, idToken } = await authService.loginWithGoogle();

      try {
        const response = await apiClient.post(`/api/v1/users/google`, {}, idToken) as unknown as OAuthResponse;

        if (response.status === "incomplete_profile") {
          set({
            isNewOAuthUser: true,
            authMethod: 'google',
            oauthUserData: {
              displayName: user.displayName || '',
              email: user.email || '',
            },
            idToken,
            isLoading: false,
          });
          return;
        }

        const userData = await apiClient.get(`/api/v1/users/me`) as unknown as UserInfoResponse;
        const userInfo = userData.user;

        const appUser: User = {
          uid: user.uid,
          email: userInfo.email,
          displayName: userInfo.firstName ? `${userInfo.firstName} ${userInfo.lastName || ''}`.trim() : user.displayName || '',
          photoURL: user.photoURL || userInfo.photoURL || '',
          age: userInfo.age,
        };

        set({ user: appUser, idToken, isLoading: false });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage.includes('429')) {
          set({
            error: 'Demasiadas solicitudes. Por favor espera 10 minutos e intenta de nuevo.',
            isLoading: false
          });
          return;
        }

        set({
          isNewOAuthUser: true,
          oauthUserData: {
            displayName: user.displayName || '',
            email: user.email || '',
          },
          idToken,
          isLoading: false,
        });
      }
    } catch (error: unknown) {
      console.error('Google login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error de inicio de sesión con Google';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Login with GitHub OAuth
   */
  loginWithGithub: async () => {
    set({ isLoading: true, error: null });
    try {
      const { user, idToken } = await authService.loginWithGithub();

      try {
        const response = await apiClient.post(`/api/v1/users/google`, {
          email: user.email,
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0],
        }, idToken) as unknown as OAuthResponse;

        if (response.status === "incomplete_profile") {
          set({
            isNewOAuthUser: true,
            authMethod: 'github',
            oauthUserData: {
              displayName: user.displayName || '',
              email: user.email || '',
            },
            idToken,
            isLoading: false,
          });
          return;
        }

        const userData = await apiClient.get(`/api/v1/users/me`) as unknown as UserInfoResponse;
        const userInfo = userData.user;

        const appUser: User = {
          uid: user.uid,
          email: userInfo.email,
          displayName: userInfo.firstName ? `${userInfo.firstName} ${userInfo.lastName || ''}`.trim() : user.displayName || '',
          photoURL: user.photoURL || userInfo.photoURL || '',
          age: userInfo.age,
        };

        set({ user: appUser, idToken, isLoading: false });
      } catch {
        set({
          isNewOAuthUser: true,
          oauthUserData: {
            displayName: user.displayName || '',
            email: user.email || '',
          },
          idToken,
          isLoading: false,
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error de inicio de sesión con GitHub';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Complete OAuth registration with age
   */
  completeOAuthRegistration: async (age: number) => {
    set({ isLoading: true, error: null });
    try {
      await authService.completeOAuthRegistration(age);
      const firebaseUser = auth.currentUser;

      if (!firebaseUser) throw new Error('No authenticated user');

      const idToken = await firebaseUser.getIdToken();
      const { oauthUserData } = get();

      const appUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: oauthUserData?.displayName || firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        age,
      };

      set({
        user: appUser,
        idToken,
        isNewOAuthUser: false,
        oauthUserData: null,
        isLoading: false
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al completar el registro';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Logout current user
   */
  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post("/api/v1/users/logout");
      await authService.logout();
      set({
        user: null,
        idToken: null,
        authMethod: null,
        isNewOAuthUser: false,
        oauthUserData: null,
        isLoading: false
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Send password reset email
   */
  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post('/api/v1/users/forgot-password', { email });
      set({ isLoading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Update user password
   */
  updatePassword: async (currentPassword: string, newPassword: string) => {
    set({ isLoading: false, error: null });
    try {
      const { authMethod } = get();

      // cambiar la contraseña si el authMethod es 'google' o 'github'
      if (authMethod === 'google' || authMethod === 'github') {
        // cambiamos la contrasela desde firebase
        await apiClient.patch('/api/v1/users/change-password-google-github', {
          password: newPassword,
          authMethod: authMethod,
        });
        return;
      }

      await apiClient.patch('/api/v1/users/change-password', {
        currentPassword,
        password: newPassword,
        confirmPassword: newPassword,
      });

      set({ isLoading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Password update failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (displayName: string, email: string, age: number) => {
    set({ isLoading: true, error: null });
    try {
      const { user, idToken } = get();
      if (!user) throw new Error('No authenticated user');

      const nameParts = displayName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await apiClient.put(`/api/v1/users/edit-me`, {
        firstName,
        lastName,
        email,
        age,
      }, idToken || undefined);

      set({
        user: { ...user, displayName, email, age },
        isLoading: false
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Delete user account
   */
  deleteAccount: async (password: string) => {
    set({ isLoading: false, error: null });
    try {
      await apiClient.delete('/api/v1/users/me', {
        password,
        authMethod: get().authMethod,
      });

      await authService.logout();

      set({
        user: null,
        idToken: null,
        authMethod: null,
        isNewOAuthUser: false,
        oauthUserData: null,
        isLoading: false
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Account deletion failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
}));