/**
 * API Response Types
 * Define the structure of responses from backend API endpoints
 */

/**
 * User data from backend API
 */
export interface ApiUser {
  id?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  age?: number;
  role?: string;
  isActive?: boolean;
  photoURL?: string;
}

/**
 * Login response from /api/v1/users/login
 */
export interface LoginResponse {
  token: string;
  id: string;
  email: string;
}

/**
 * User info response from /api/v1/users/me
 */
export interface UserInfoResponse {
  user: ApiUser;
}

/**
 * OAuth response from /api/v1/users/google or /api/v1/users/github
 */
export interface OAuthResponse {
  status: 'incomplete_profile' | 'complete';
  token?: string;
  user?: ApiUser;
}

/**
 * Generic API success response
 */
export interface ApiSuccessResponse {
  message?: string;
  status?: string;
}
