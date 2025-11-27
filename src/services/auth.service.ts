import { auth, googleProvider, githubProvider } from "../lib/firebase.config";
import {
  //setPersistence,
  //browserLocalPersistence,
  signInWithPopup,
  //signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  deleteUser as firebaseDeleteUser,
} from "firebase/auth";
import { apiClient } from "../fetch/fetchClient";

/**
 * Register a new user with email and password
 */
export const registerWithEmail = async (email: string, password: string, _displayName: string, age: number) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  const idToken = await user.getIdToken();

  // Send user data to backend
  await apiClient.post("/api/v1/users/complete-profile", {
    age,
  }, idToken);

  return { user, idToken };
};

/**
 * Login with email and password
 */
// export const loginWithEmail = async (email: string, password: string) => {
//   const userCredential = await signInWithEmailAndPassword(auth, email, password);
//   const user = userCredential.user;
//   const idToken = await user.getIdToken();
//   await setPersistence(auth, browserLocalPersistence);

//   return { user, idToken };
// };

/**
 * Login with Google
 */
export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const idToken = await user.getIdToken();

  return { user, idToken };
};

/**
 * Login with GitHub
 */
export const loginWithGithub = async () => {
  const result = await signInWithPopup(auth, githubProvider);
  const user = result.user;
  const idToken = await user.getIdToken();

  return { user, idToken };
};

/**
 * Complete OAuth registration (Google/GitHub) with additional data
 */
export const completeOAuthRegistration = async (age: number) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  const idToken = await user.getIdToken();

  // Send complete user data to backend
  await apiClient.post("/api/v1/users/complete-profile", {
    age,
  }, idToken);

  return { user, idToken };
};

/**
 * Logout current user
 */
export const logout = async () => {
  await signOut(auth);
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

/**
 * Update user password
 */
export const updatePassword = async (newPassword: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  await firebaseUpdatePassword(user, newPassword);
};

/**
 * Delete user account
 */
export const deleteAccount = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  const idToken = await user.getIdToken();

  // Delete user data from backend
  await apiClient.delete(`/auth/user/${user.uid}`, null, idToken);

  // Delete Firebase user
  await firebaseDeleteUser(user);
};

/**
 * Get current user's ID token
 */
export const getCurrentUserToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  return await user.getIdToken();
};
