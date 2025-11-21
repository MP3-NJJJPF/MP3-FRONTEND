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

  const user = result.user;
  const idToken = await user.getIdToken();

  return { user, idToken };
};
