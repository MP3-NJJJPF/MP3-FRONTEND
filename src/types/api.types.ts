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
  name: string;
  age?: number;
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

export interface OnlineUser {
  socketId: string;
  userId: string;
  name: string;
  photo?: string;
}

/**
 * WebRTC Voice Call Types
 */

/**
 * ICE server configuration from backend
 */
export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

/**
 * Meeting/Room data
 */
export interface Meeting {
  meetingId: string;
  createdBy: string;
  participants: string[];
  createdAt: string;
}

/**
 * Voice participant in a call 
 */
export interface VoiceParticipant {
  userId: string;
  name: string;
  photo?: string;
  isMuted: boolean;
  isSpeaking: boolean;
  volumeLevel?: 'low' | 'medium' | 'high';
  stream?: MediaStream;
}

/**
 * WebRTC signaling events 
 */
export interface WebRTCOffer {
  from: string;
  to: string;
  offer: RTCSessionDescriptionInit;
}

export interface WebRTCAnswer {
  from: string;
  to: string;
  answer: RTCSessionDescriptionInit;
}

export interface IceCandidate {
  from: string;
  to: string;
  candidate: RTCIceCandidateInit;
}

export interface AudioStateChange {
  userId: string;
  isMuted: boolean;
}

export interface UserJoinedEvent {
  userId: string;
  name: string;
  photo?: string;
}

export interface UserLeftEvent {
  userId: string;
}