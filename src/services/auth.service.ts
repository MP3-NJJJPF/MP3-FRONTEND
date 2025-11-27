<<<<<<< HEAD
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
=======
import { auth, googleProvider, githubProvider} from "../lib/firebase.config";

// Import the signInWithPopup function from Firebase Authentication
// This function opens a popup window for authentication
import { signInWithPopup } from "firebase/auth";

// Export a function to control Google login
export const loginWithGoogle = async () => {
  // Open the Google login pop-up window and wait for the result.
  const result = await signInWithPopup(auth, googleProvider);

  // Extract the authenticated user's data from the result
  // Contains user info like email, displayName, photoURL, etc.
  const user = result.user;

  // Get the Firebase JWT (JSON Web Token) for the authenticated user
  // This token is used to verify the user's identity on the backend
  const idToken = await user.getIdToken();

  // Return both the user object and the authentication token
  return { user, idToken };
};

// export const loginWithFacebook = async () => {
//   const result = await signInWithPopup(auth, facebookProvider);
//   const user = result.user;
//   const idToken = await user.getIdToken();
//   return { user, idToken };
// };

export const loginWithGithub = async () => {
  const result = await signInWithPopup(auth, githubProvider);

>>>>>>> 47f5a6f69d1b5b8896bfbb4bb4a9c6b0756b12b3
  const user = result.user;
  const idToken = await user.getIdToken();

  return { user, idToken };
};
<<<<<<< HEAD

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
=======
>>>>>>> 47f5a6f69d1b5b8896bfbb4bb4a9c6b0756b12b3
