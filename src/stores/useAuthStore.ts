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
  isNewOAuthUser?: boolean; // Flag to indicate if user needs to complete OAuth registration
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
  console.log('🚀 initAuthObserver: Starting...');
  
  const unsubscribe = onAuthStateChanged(
    auth,
    async (fbUser: FirebaseUser | null) => {
      console.log('🔥 Firebase onAuthStateChanged triggered');
      console.log('👤 Firebase User:', fbUser ? 'EXISTS' : 'NULL');
      
      if (fbUser) {
        console.log('📧 Email:', fbUser.email);
        console.log('🆔 UID:', fbUser.uid);
        console.log('🔐 Providers:', fbUser.providerData.map(p => p.providerId));
        
        // ✅ SET LOADING TRUE while fetching user data
        console.log('⏳ Setting isLoading: true');
        set({ isLoading: true });
        
        try {
          // Get Firebase ID token
          const idToken = await fbUser.getIdToken();
          console.log('🎫 Firebase ID Token obtained:', idToken ? 'YES' : 'NO');
          
          // Determine if user is OAuth or email/password
          const isOAuthUser = fbUser.providerData.some(
            provider => provider.providerId === 'google.com' || provider.providerId === 'github.com'
          );
          
          console.log('🔍 User type:', isOAuthUser ? 'OAuth' : 'Email/Password');
          
          // Try to get user data from backend using /users/me
          try {
            console.log('📡 Calling /users/me with token:', isOAuthUser ? 'Firebase Token' : 'undefined (using cookies)');
            
            const userData = await apiClient.get(
              `/api/v1/users/me`, 
              isOAuthUser ? idToken : undefined
            ) as unknown as UserInfoResponse;
            
            const userInfo = userData.user;
            
            console.log('✅ User data fetched successfully:', userInfo);
            
            const user: User = {
              uid: fbUser.uid,
              email: userInfo.email,
              displayName: userInfo.firstName 
                ? `${userInfo.firstName} ${userInfo.lastName || ''}`.trim() 
                : fbUser.displayName || '',
              photoURL: fbUser.photoURL || userInfo.photoURL || '',
              age: userInfo.age,
            };

            console.log('💾 Setting user in store:', user);
            console.log('✅ Setting isLoading: false');
            
            // ✅ SET LOADING FALSE after successful fetch
            set({ 
              user, 
              idToken: isOAuthUser ? idToken : null, 
              isLoading: false, 
              error: null 
            });
            
            console.log('🎉 Auth observer completed successfully');
          } catch (error) {
            console.error('❌ Error fetching user data:', error);
            
            // User not found in backend, might need to complete profile
            console.log('⚠️ User not found in backend during auth observer');
            
            const user: User = {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              photoURL: fbUser.photoURL,
              age: undefined,
            };

            console.log('💾 Setting partial user in store:', user);
            console.log('✅ Setting isLoading: false');
            
            // ✅ SET LOADING FALSE even if user not found
            set({ user, idToken, isLoading: false, error: null });
          }
        } catch (error: unknown) {
          console.error('💥 Auth observer error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Authentication error';
          console.log('❌ Setting isLoading: false with error');
          
          // ✅ SET LOADING FALSE on error
          set({ error: errorMessage, isLoading: false });
        }
      } else {
        console.log('👋 No Firebase user, clearing store');
        console.log('✅ Setting isLoading: false');
        
        // ✅ SET LOADING FALSE when no user
        set({ 
          user: null, 
          idToken: null, 
          isNewOAuthUser: false,
          oauthUserData: null,
          isLoading: false
        });
      }
    },
    (error) => {
      console.error('💥 Auth state change error:', error);
      console.log('❌ Setting isLoading: false due to auth state error');
      
      // ✅ SET LOADING FALSE on auth state error
      set({ error: error.message, isLoading: false });
    }
  );

  return unsubscribe;
},

  /**
   * Login with email and password
   */
  loginWithEmail: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      // Authenticate with backend
      const loginResponse = await apiClient.post(`/api/v1/users/login`, {email, password}) as unknown as LoginResponse;
      const userData = await apiClient.get(`/api/v1/users/me`, undefined) as unknown as UserInfoResponse;
      const userInfo = userData.user;
      
      const appUser: User = {
        uid: loginResponse.id || userInfo.id || email,
        email: userInfo.email,
        displayName: userInfo.firstName ? `${userInfo.firstName} ${userInfo.lastName || ''}`.trim() : userInfo.email?.split('@')[0] || '',
        photoURL: userInfo.photoURL || '',
        age: userInfo.age,
      };

      
      set({ user: appUser, idToken: null, isLoading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Register new user with email and password
   */
  registerWithEmail: async (email: string, password: string, displayName: string, age: number) => {
    set({ isLoading: true, error: null });
    try {
      // Register in backend only - user will need to login after registration
      await apiClient.post('/api/v1/users', {
        firstName: displayName,
        lastName: '',
        age,
        email,
        password,
        confirmPassword: password,
      });

      // Successfully registered - user should now login
      set({ isLoading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Login with Google OAuth
   * Checks if user exists in backend, if not redirects to complete-profile
   */
  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const { user, idToken } = await authService.loginWithGoogle();
    //   console.log('Google login successful, checking backend...', { uid: user.uid });
    //   console.log('Token:', idToken ? 'Present' : 'Missing');
    //   console.log('Making request to: POST /api/v1/users/login');
      
      // Try to get user data from backend to check if they're registered
      try {
        const response = await apiClient.post(`/api/v1/users/google`, {
          email: user.email,
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0],
        }, idToken) as unknown as OAuthResponse;
        console.log('Backend response:', response);
        
        // Check if user needs to complete profile
        if (response.status === "incomplete_profile") {
        //   console.log('User has incomplete profile, redirecting to complete profile');
          set({
            isNewOAuthUser: true,
            oauthUserData: {
              displayName: user.displayName || '',
              email: user.email || '',
            },
            idToken,
            isLoading: false,
          });
          return;
        }
        
        // User exists in backend with complete profile, fetch full user data
        const userData = await apiClient.get(`/api/v1/users/me`, idToken) as unknown as UserInfoResponse;
        const userInfo = userData.user;
        
        const appUser: User = {
          uid: user.uid,
          email: userInfo.email,
          displayName: userInfo.firstName ? `${userInfo.firstName} ${userInfo.lastName || ''}`.trim() : user.displayName || '',
          photoURL: user.photoURL || userInfo.photoURL || '',
          age: userInfo.age,
        };
        
        // console.log('User found in backend, logging in:', appUser);
        set({ user: appUser, idToken, isLoading: false });
      } catch (error: unknown) {
        // Backend error - could be 404 (not found), 500 (server error), or 429 (rate limit)
        // console.log('Backend error:', error);
        
        // If it's a rate limit error (429), show message and don't redirect
        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage.includes('429')) {
          set({ 
            error: 'Demasiadas solicitudes. Por favor espera 10 minutos e intenta de nuevo.',
            isLoading: false 
          });
          return;
        }
        
        // If it's a 500 error, the backend might be down but user might exist
        // For now, assume new user and redirect to complete profile
        // TODO: Ask backend team for correct endpoint to check user existence
        // console.log('User not found in backend or backend error, redirecting to complete profile');
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
    //   console.error('Google login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error de inicio de sesión con Google';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Login with GitHub OAuth
   * Checks if user exists in backend, if not redirects to complete-profile
   */
  loginWithGithub: async () => {
    set({ isLoading: true, error: null });
    try {
      const { user, idToken } = await authService.loginWithGithub();
      
      // Try to get user data from backend to check if they're registered
      try {
        const response = await apiClient.post(`/api/v1/users/google`, {
          email: user.email,
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0],
        }, idToken) as unknown as OAuthResponse;
        
        // Check if user needs to complete profile
        if (response.status === "incomplete_profile") {
          console.log('User has incomplete profile, redirecting to complete profile');
          set({
            isNewOAuthUser: true,
            oauthUserData: {
              displayName: user.displayName || '',
              email: user.email || '',
            },
            idToken,
            isLoading: false,
          });
          return;
        }
        
        // User exists in backend with complete profile, fetch full user data
        const userData = await apiClient.get(`/api/v1/users/me`, idToken) as unknown as UserInfoResponse;
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
        // User not found in backend (404 or other error), needs to complete registration
        console.log('User not found in backend, redirecting to complete profile');
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
      await authService.logout();
      set({ 
        user: null, 
        idToken: null, 
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
    set({ isLoading: true, error: null });
    try {
      const { idToken } = get();
      if (!idToken) throw new Error('No authenticated user');
      
      // Call backend to change password
      await apiClient.patch('/api/v1/users/change-password', {
        currentPassword,
        password: newPassword,
        confirmPassword: newPassword,
      }, idToken || undefined);
      
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

      // Split displayName into firstName and lastName
      const nameParts = displayName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Update in backend
      await apiClient.put(`/api/v1/users/edit-me`, {
        firstName,
        lastName,
        email,
        age,
      }, idToken || undefined);

      // Update local state
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
    set({ isLoading: true, error: null });
    try {
      const { idToken } = get();
      if (!idToken) throw new Error('No authenticated user');
      
      // Call backend to delete account
      await apiClient.delete('/api/v1/users/me', {
        password,
      }, idToken);
      
      // Logout from Firebase
      await authService.logout();
      
      set({ 
        user: null, 
        idToken: null,
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
