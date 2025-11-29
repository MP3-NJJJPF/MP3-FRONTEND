import socketIOClient, { Socket } from 'socket.io-client';
import {
  IceServerConfig,
  VoiceParticipant,
  WebRTCOffer,
  WebRTCAnswer,
  IceCandidate,
  AudioStateChange,
  UserJoinedEvent,
  UserLeftEvent,
} from '../types/api.types';

/**
 * WebRTC Service
 * Manages voice call connections, WebRTC peer connections, and audio streams
 */
class WebRTCService {
  private socket: Socket | null = null;
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private iceServers: RTCIceServer[] = [];
  private currentMeetingId: string | null = null;
  private isMuted: boolean = false;
  private listeners: Map<string, Set<Function>> = new Map();

  /**
   * Initialize connection to voice server
   */
  async connect(userId: string, userName: string, userPhoto?: string): Promise<void> {
    if (this.socket?.connected) {
      console.log('[WebRTC] Already connected');
      return;
    }

    const voiceServerUrl = import.meta.env.VITE_VOICE_URL || 'https://server-voice-pi.onrender.com';

    try {
      // Fetch ICE servers configuration
      const response = await fetch(`${voiceServerUrl}/api/ice-servers`);
      if (response.ok) {
        const data = await response.json();
        this.iceServers = data.iceServers || [];
        console.log('[WebRTC] ICE servers loaded:', this.iceServers);
      }
    } catch (error) {
      console.error('[WebRTC] Failed to fetch ICE servers:', error);
      // Use default STUN server as fallback
      this.iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
    }

    // Connect to Socket.io
    this.socket = socketIOClient(voiceServerUrl, {
      transports: ['websocket', 'polling'],
      auth: {
        userId,
        name: userName,
        photo: userPhoto,
      },
    });

    this.setupSocketListeners();

    return new Promise((resolve, reject) => {
      // Check if already connected
      if (this.socket!.connected) {
        console.log('[WebRTC] Socket already connected');
        resolve();
        return;
      }

      const connectHandler = () => {
        console.log('[WebRTC] Connected to voice server');
        this.socket!.off('connect_error', errorHandler);
        resolve();
      };

      const errorHandler = (error: any) => {
        console.error('[WebRTC] Connection error:', error);
        this.socket!.off('connect', connectHandler);
        reject(error);
      };

      this.socket!.once('connect', connectHandler);
      this.socket!.once('connect_error', errorHandler);

      setTimeout(() => {
        this.socket!.off('connect', connectHandler);
        this.socket!.off('connect_error', errorHandler);
        reject(new Error('Connection timeout'));
      }, 15000);
    });
  }

  /**
   * Setup Socket.io event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // User joined the meeting
    this.socket.on('user-joined', (data: UserJoinedEvent) => {
      console.log('[WebRTC] User joined:', data);
      
      if (!data || !data.userId) {
        console.error('[WebRTC] Invalid user-joined data:', data);
        return;
      }

      this.emit('user-joined', data);
      
      // Create peer connection for the new user
      if (this.localStream) {
        this.createPeerConnection(data.userId);
      }
    });

    // User left the meeting
    this.socket.on('user-left', (data: UserLeftEvent) => {
      console.log('[WebRTC] User left:', data);
      this.emit('user-left', data);
      this.closePeerConnection(data.userId);
    });

    // Received WebRTC offer
    this.socket.on('webrtc-offer', async (data: WebRTCOffer) => {
      console.log('[WebRTC] Received offer from:', data.from);
      await this.handleOffer(data);
    });

    // Received WebRTC answer
    this.socket.on('webrtc-answer', async (data: WebRTCAnswer) => {
      console.log('[WebRTC] Received answer from:', data.from);
      await this.handleAnswer(data);
    });

    // Received ICE candidate
    this.socket.on('ice-candidate', async (data: IceCandidate) => {
      console.log('[WebRTC] Received ICE candidate from:', data.from);
      await this.handleIceCandidate(data);
    });

    // Audio state changed
    this.socket.on('audio-state-changed', (data: AudioStateChange) => {
      console.log('[WebRTC] Audio state changed:', data);
      this.emit('audio-state-changed', data);
    });

    // Error events
    this.socket.on('error', (error) => {
      console.error('[WebRTC] Socket error:', error);
      this.emit('error', error);
    });
  }

  /**
   * Join a meeting/room
   */
  async joinMeeting(meetingId: string): Promise<void> {
    // Wait for connection if not connected yet
    if (!this.socket?.connected) {
      console.log('[WebRTC] Waiting for socket connection...');
      await new Promise<void>((resolve, reject) => {
        const checkConnection = setInterval(() => {
          if (this.socket?.connected) {
            clearInterval(checkConnection);
            resolve();
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkConnection);
          reject(new Error('Socket connection timeout'));
        }, 10000);
      });
    }

    this.currentMeetingId = meetingId;

    // Request microphone access
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      console.log('[WebRTC] Local stream acquired');
      this.emit('local-stream', this.localStream);
    } catch (error) {
      console.error('[WebRTC] Failed to get local stream:', error);
      throw new Error('No se pudo acceder al micrófono');
    }

    // Join the meeting via socket
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        console.warn('[WebRTC] Join meeting: No acknowledgment from server, assuming success');
        resolve();
      }, 8000);

      this.socket!.emit('join-meeting', { meetingId }, (response?: any) => {
        clearTimeout(timeoutId);
        if (response?.error) {
          console.error('[WebRTC] Join meeting error:', response.error);
          reject(new Error(response.error));
        } else {
          console.log('[WebRTC] Joined meeting successfully', response);
          resolve();
        }
      });
    });
  }

  /**
   * Leave the current meeting
   */
  leaveMeeting(): void {
    if (!this.currentMeetingId || !this.socket) return;

    console.log('[WebRTC] Leaving meeting:', this.currentMeetingId);

    // Emit leave event
    this.socket.emit('leave-meeting', { meetingId: this.currentMeetingId });

    // Close all peer connections
    this.peerConnections.forEach((pc, userId) => {
      this.closePeerConnection(userId);
    });

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    this.currentMeetingId = null;
    this.emit('meeting-left', {});
  }

  /**
   * Toggle mute/unmute microphone
   */
  toggleMute(): boolean {
    if (!this.localStream) return this.isMuted;

    this.isMuted = !this.isMuted;
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !this.isMuted;
    });

    // Notify server
    if (this.socket && this.currentMeetingId) {
      this.socket.emit('toggle-audio', {
        meetingId: this.currentMeetingId,
        isMuted: this.isMuted,
      });
    }

    console.log('[WebRTC] Mute toggled:', this.isMuted);
    this.emit('mute-changed', this.isMuted);
    return this.isMuted;
  }

  /**
   * Get current mute state
   */
  isMutedState(): boolean {
    return this.isMuted;
  }

  /**
   * Create peer connection for a user
   */
  private async createPeerConnection(userId: string): Promise<RTCPeerConnection> {
    if (this.peerConnections.has(userId)) {
      return this.peerConnections.get(userId)!;
    }

    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    this.peerConnections.set(userId, pc);

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('ice-candidate', {
          to: userId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track from:', userId);
      const remoteStream = event.streams[0];
      this.emit('remote-stream', { userId, stream: remoteStream });
    };

    // Handle connection state
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state with', userId, ':', pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        this.closePeerConnection(userId);
      }
    };

    // Create and send offer
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (this.socket) {
        this.socket.emit('webrtc-offer', {
          to: userId,
          offer: pc.localDescription!.toJSON(),
        });
      }
    } catch (error) {
      console.error('[WebRTC] Failed to create offer:', error);
    }

    return pc;
  }

  /**
   * Handle incoming WebRTC offer
   */
  private async handleOffer(data: WebRTCOffer): Promise<void> {
    if (!data || !data.from) {
      console.error('[WebRTC] Invalid offer data:', data);
      return;
    }

    try {
      console.log('[WebRTC] Processing offer from:', data.from);
      let pc = this.peerConnections.get(data.from);
      
      if (!pc) {
        pc = new RTCPeerConnection({ iceServers: this.iceServers });
        this.peerConnections.set(data.from, pc);

        // Add local stream tracks
        if (this.localStream) {
          this.localStream.getTracks().forEach((track) => {
            pc!.addTrack(track, this.localStream!);
          });
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate && this.socket) {
            this.socket.emit('ice-candidate', {
              to: data.from,
              candidate: event.candidate.toJSON(),
            });
          }
        };

        // Handle remote stream
        pc.ontrack = (event) => {
          console.log('[WebRTC] Received remote track from:', data.from);
          const remoteStream = event.streams[0];
          this.emit('remote-stream', { userId: data.from, stream: remoteStream });
        };

        // Handle connection state
        pc.onconnectionstatechange = () => {
          console.log('[WebRTC] Connection state with', data.from, ':', pc!.connectionState);
        };
      }

      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (this.socket) {
        this.socket.emit('webrtc-answer', {
          to: data.from,
          answer: pc.localDescription!.toJSON(),
        });
      }
    } catch (error) {
      console.error('[WebRTC] Failed to handle offer:', error);
    }
  }

  /**
   * Handle incoming WebRTC answer
   */
  private async handleAnswer(data: WebRTCAnswer): Promise<void> {
    if (!data || !data.from) {
      console.error('[WebRTC] Invalid answer data:', data);
      return;
    }

    try {
      console.log('[WebRTC] Processing answer from:', data.from);
      const pc = this.peerConnections.get(data.from);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      } else {
        console.warn('[WebRTC] No peer connection found for:', data.from);
      }
    } catch (error) {
      console.error('[WebRTC] Failed to handle answer:', error);
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  private async handleIceCandidate(data: IceCandidate): Promise<void> {
    if (!data || !data.from) {
      console.error('[WebRTC] Invalid ICE candidate data:', data);
      return;
    }

    try {
      const pc = this.peerConnections.get(data.from);
      if (pc && data.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log('[WebRTC] Added ICE candidate from:', data.from);
      } else {
        if (!pc) console.warn('[WebRTC] No peer connection found for:', data.from);
        if (!data.candidate) console.warn('[WebRTC] No candidate in data');
      }
    } catch (error) {
      console.error('[WebRTC] Failed to handle ICE candidate:', error);
    }
  }

  /**
   * Close peer connection with a user
   */
  private closePeerConnection(userId: string): void {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(userId);
      console.log('[WebRTC] Closed peer connection with:', userId);
    }
  }

  /**
   * Disconnect from voice server
   */
  disconnect(): void {
    console.log('[WebRTC] Disconnecting...');
    
    this.leaveMeeting();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.listeners.clear();
  }

  /**
   * Event emitter - emit events to listeners
   */
  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => listener(data));
    }
  }

  /**
   * Event emitter - add event listener
   */
  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  /**
   * Event emitter - remove event listener
   */
  off(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }
}

// Export singleton instance
export const webrtcService = new WebRTCService();
