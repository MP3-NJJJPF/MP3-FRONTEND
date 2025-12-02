import socketIOClient, { Socket } from 'socket.io-client';

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
  private currentUserId: string | null = null;
  private currentUserName: string | null = null;
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

    // Store user info
    this.currentUserId = userId;
    this.currentUserName = userName;

    const voiceServerUrl = import.meta.env.VITE_VOICE_URL || 'https://server-voice-pi.onrender.com';

    try {
      // Fetch ICE servers configuration (STUN/TURN)
      console.log('[WebRTC] 🔍 Fetching ICE servers from:', `${voiceServerUrl}/api/ice-servers`);
      const response = await fetch(`${voiceServerUrl}/api/ice-servers`);
      
      console.log('[WebRTC] Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[WebRTC] 📦 Raw response data:', JSON.stringify(data, null, 2));
        
        // Normalize ICE servers to ensure proper URL format
        this.iceServers = (data.iceServers || []).map((server: any) => {
          const normalizedServer = { ...server };
          
          // Ensure urls is always an array
          const urlsArray = Array.isArray(server.urls) ? server.urls : [server.urls];
          
          // Fix URLs that don't have protocol prefix
          normalizedServer.urls = urlsArray.map((url: string) => {
            if (!url) return url;
            
            // If URL doesn't start with turn: or stun:, try to fix it
            if (!url.startsWith('turn:') && !url.startsWith('stun:')) {
              // Check if it's a TURN server (has credentials)
              if (server.username && server.credential) {
                return `turn:${url}`;
              }
              // Otherwise assume it's a STUN server
              return `stun:${url}`;
            }
            return url;
          });
          
          return normalizedServer;
        });
        
        console.log('[WebRTC] 📡 ICE servers array (normalized):', JSON.stringify(this.iceServers, null, 2));
        
        // Log TURN servers specifically
        const turnServers = this.iceServers.filter((server: any) => {
          const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
          return urls.some((url: string) => url && url.includes('turn:'));
        });
        
        const stunServers = this.iceServers.filter((server: any) => {
          const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
          return urls.some((url: string) => url && url.includes('stun:'));
        });
        
        console.log('[WebRTC] 🎯 STUN servers found:', stunServers.length);
        console.log('[WebRTC] 🔄 TURN servers found:', turnServers.length);
        
        if (turnServers.length > 0) {
          console.log('[WebRTC] ✅ TURN configuration:', JSON.stringify(turnServers, null, 2));
        } else {
          console.warn('[WebRTC] ⚠️ WARNING: No TURN servers found! This may cause connection issues.');
          console.warn('[WebRTC] Expected format: { urls: "turn:...", username: "...", credential: "..." }');
        }
      } else {
        const errorText = await response.text();
        console.error('[WebRTC] ❌ Failed to fetch ICE servers');
        console.error('[WebRTC] Status:', response.status);
        console.error('[WebRTC] Response:', errorText);
        this.iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
      }
    } catch (error) {
      console.error('[WebRTC] ❌ Exception fetching ICE servers:', error);
      console.error('[WebRTC] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      // Use default STUN server as fallback
      this.iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
      console.log('[WebRTC] 🔄 Using fallback STUN server');
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

    // User joined the meeting (backend envía: user-joined)
    this.socket.on('user-joined', (data: any) => {
      console.log('[WebRTC] 👤 User joined event received');
      console.log('[WebRTC] Data:', JSON.stringify(data, null, 2));
      
      if (!data || !data.userId) {
        console.error('[WebRTC] ❌ Invalid user joined data:', data);
        return;
      }

      console.log('[WebRTC] ✅ Valid user:', data.userId, data.name);
      
      // Emit for component
      this.emit('user-joined', {
        userId: data.userId,
        name: data.name,
        photo: data.photo,
      });
      
      // Create peer connection for the new user
      if (this.localStream) {
        console.log('[WebRTC] 🔗 Creating peer connection with:', data.userId);
        this.createPeerConnection(data.userId);
      } else {
        console.warn('[WebRTC] ⚠️ No local stream available, cannot create peer connection');
      }
    });

    // User left the meeting (backend envía: user-left)
    this.socket.on('user-left', (data: any) => {
      console.log('[WebRTC] 👋 User left:', data);
      
      if (!data || !data.userId) {
        console.error('[WebRTC] ❌ Invalid user left data:', data);
        return;
      }

      this.emit('user-left', data);
      this.closePeerConnection(data.userId);
    });

    // Received WebRTC offer (backend envía: webrtc-offer)
    this.socket.on('webrtc-offer', async (data: any) => {
      console.log('[WebRTC] 📨 Received OFFER');
      console.log('[WebRTC] Offer data:', JSON.stringify({ from: data.from, to: data.to, hasOffer: !!data.offer }));
      await this.handleOffer(data);
    });

    // Received WebRTC answer (backend envía: webrtc-answer)
    this.socket.on('webrtc-answer', async (data: any) => {
      console.log('[WebRTC] 📨 Received ANSWER');
      console.log('[WebRTC] Answer data:', JSON.stringify({ from: data.from, to: data.to, hasAnswer: !!data.answer }));
      await this.handleAnswer(data);
    });

    // Received ICE candidate (backend envía: ice-candidate)
    this.socket.on('ice-candidate', async (data: any) => {
      console.log('[WebRTC] 🧊 Received ICE candidate');
      console.log('[WebRTC] ICE data:', JSON.stringify({ from: data.from, to: data.to, hasCandidate: !!data.candidate }));
      await this.handleIceCandidate(data);
    });

    // Audio state changed (backend envía: audio-state-changed)
    this.socket.on('audio-state-changed', (data: any) => {
      console.log('[WebRTC] 🔇 Audio state changed:', data);
      this.emit('audio-state-changed', data);
    });

    // Error events
    this.socket.on('error', (error) => {
      console.error('[WebRTC] ❌ Socket error:', error);
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

      console.log('[WebRTC] 📤 Sending join-meeting event:', { meetingId, userId: this.currentUserId, userName: this.currentUserName });
      
      this.socket!.emit('join-meeting', { 
        meetingId, 
        userId: this.currentUserId,
        userName: this.currentUserName 
      }, (response?: any) => {
        clearTimeout(timeoutId);
        if (response?.error) {
          console.error('[WebRTC] Join meeting error:', response.error);
          reject(new Error(response.error));
        } else {
          console.log('[WebRTC] ✅ Joined meeting successfully', response);
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
    if (this.currentUserId) {
      this.socket.emit('leave-meeting', { 
        meetingId: this.currentMeetingId,
        userId: this.currentUserId 
      });
    }

    // Close all peer connections
    this.peerConnections.forEach((_pc, userId) => {
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
    if (this.socket && this.currentMeetingId && this.currentUserId) {
      this.socket.emit('toggle-audio', {
        meetingId: this.currentMeetingId,
        userId: this.currentUserId,
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
      console.log('[WebRTC] ♻️ Peer connection already exists for:', userId);
      return this.peerConnections.get(userId)!;
    }

    console.log('[WebRTC] 🆕 Creating NEW peer connection for:', userId);
    console.log('[WebRTC] ICE servers config:', JSON.stringify(this.iceServers, null, 2));

    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    this.peerConnections.set(userId, pc);

    console.log('[WebRTC] ✅ RTCPeerConnection created for:', userId);

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        console.log('[WebRTC] 🎤 Adding local track to peer:', track.kind, 'for', userId);
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] 🧊 Sending ICE candidate to:', userId);
        console.log('[WebRTC] Candidate type:', event.candidate.type);
        if (this.socket && this.currentUserId && this.currentMeetingId) {
          this.socket.emit('ice-candidate', {
            from: this.currentUserId,
            to: userId,
            candidate: event.candidate.toJSON(),
            meetingId: this.currentMeetingId
          });
        }
      } else {
        console.log('[WebRTC] ✅ ICE gathering complete for:', userId);
      }
    };

    // Handle ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] 🔌 ICE connection state with', userId, ':', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        console.error('[WebRTC] ❌ ICE connection FAILED with:', userId);
      } else if (pc.iceConnectionState === 'connected') {
        console.log('[WebRTC] ✅ ICE connection ESTABLISHED with:', userId);
      } else if (pc.iceConnectionState === 'disconnected') {
        console.warn('[WebRTC] ⚠️ ICE connection DISCONNECTED with:', userId);
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('[WebRTC] 🎵 Received REMOTE TRACK from:', userId);
      console.log('[WebRTC] Track kind:', event.track.kind);
      console.log('[WebRTC] Track enabled:', event.track.enabled);
      console.log('[WebRTC] Streams count:', event.streams.length);
      
      const remoteStream = event.streams[0];
      if (remoteStream) {
        console.log('[WebRTC] ✅ Remote stream received with', remoteStream.getTracks().length, 'tracks');
        this.emit('remote-stream', { userId, stream: remoteStream });
      } else {
        console.error('[WebRTC] ❌ No stream in track event!');
      }
    };

    // Handle connection state
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] 🔗 Connection state with', userId, ':', pc.connectionState);
      
      if (pc.connectionState === 'connected') {
        console.log('[WebRTC] ✅✅✅ PEER CONNECTION ESTABLISHED with:', userId);
      } else if (pc.connectionState === 'failed') {
        console.error('[WebRTC] ❌❌❌ PEER CONNECTION FAILED with:', userId);
        this.closePeerConnection(userId);
      } else if (pc.connectionState === 'disconnected') {
        console.warn('[WebRTC] ⚠️ Peer connection DISCONNECTED with:', userId);
      }
    };

    // Handle signaling state
    pc.onsignalingstatechange = () => {
      console.log('[WebRTC] 📡 Signaling state with', userId, ':', pc.signalingState);
    };

    // Create and send offer
    try {
      console.log('[WebRTC] 📤 Creating offer for:', userId);
      const offer = await pc.createOffer();
      console.log('[WebRTC] Offer created, setting local description');
      
      await pc.setLocalDescription(offer);
      console.log('[WebRTC] ✅ Local description set');

      if (this.socket && this.currentUserId && this.currentMeetingId) {
        console.log('[WebRTC] 📨 Sending offer to:', userId);
        this.socket.emit('webrtc-offer', {
          from: this.currentUserId,
          to: userId,
          offer: pc.localDescription!.toJSON(),
          meetingId: this.currentMeetingId
        });
        console.log('[WebRTC] ✅ Offer sent successfully');
      } else {
        console.error('[WebRTC] ❌ Socket not available to send offer!');
      }
    } catch (error) {
      console.error('[WebRTC] ❌ Failed to create/send offer:', error);
      console.error('[WebRTC] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }

    return pc;
  }

  /**
   * Handle incoming WebRTC offer
   */
  private async handleOffer(data: any): Promise<void> {
    const fromUserId = data.fromUserId || data.from;
    
    console.log('[WebRTC] 📥 HANDLING OFFER');
    console.log('[WebRTC] From:', fromUserId);
    
    if (!data || !fromUserId) {
      console.error('[WebRTC] ❌ Invalid offer data:', data);
      return;
    }

    if (!data.offer) {
      console.error('[WebRTC] ❌ No offer in data!');
      return;
    }

    try {
      console.log('[WebRTC] Processing offer from:', fromUserId);
      let pc = this.peerConnections.get(fromUserId);
      
      if (!pc) {
        console.log('[WebRTC] 🆕 Creating peer connection for incoming offer');
        pc = new RTCPeerConnection({ iceServers: this.iceServers });
        this.peerConnections.set(fromUserId, pc);

        // Add local stream tracks
        if (this.localStream) {
          this.localStream.getTracks().forEach((track) => {
            console.log('[WebRTC] 🎤 Adding local track:', track.kind);
            pc!.addTrack(track, this.localStream!);
          });
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate && this.socket && this.currentUserId && this.currentMeetingId) {
            console.log('[WebRTC] 🧊 Sending ICE candidate (from handleOffer) to:', fromUserId);
            this.socket.emit('ice-candidate', {
              from: this.currentUserId,
              to: fromUserId,
              candidate: event.candidate.toJSON(),
              meetingId: this.currentMeetingId
            });
          }
        };

        // Handle ICE connection state
        pc.oniceconnectionstatechange = () => {
          console.log('[WebRTC] 🔌 ICE state (handleOffer):', pc!.iceConnectionState, 'with', fromUserId);
        };

        // Handle remote stream
        pc.ontrack = (event) => {
          console.log('[WebRTC] 🎵 Remote track received (handleOffer) from:', fromUserId);
          console.log('[WebRTC] Track kind:', event.track.kind);
          const remoteStream = event.streams[0];
          if (remoteStream) {
            console.log('[WebRTC] ✅ Emitting remote stream for:', fromUserId);
            this.emit('remote-stream', { userId: fromUserId, stream: remoteStream });
          }
        };

        // Handle connection state
        pc.onconnectionstatechange = () => {
          console.log('[WebRTC] 🔗 Connection state (handleOffer):', pc!.connectionState, 'with', fromUserId);
        };
      }

      console.log('[WebRTC] Setting remote description (offer)');
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      console.log('[WebRTC] ✅ Remote description set');
      
      console.log('[WebRTC] Creating answer');
      const answer = await pc.createAnswer();
      console.log('[WebRTC] Answer created');
      
      await pc.setLocalDescription(answer);
      console.log('[WebRTC] ✅ Local description (answer) set');

      if (this.socket && this.currentUserId && this.currentMeetingId) {
        console.log('[WebRTC] 📨 Sending answer to:', fromUserId);
        this.socket.emit('webrtc-answer', {
          from: this.currentUserId,
          to: fromUserId,
          answer: pc.localDescription!.toJSON(),
          meetingId: this.currentMeetingId
        });
        console.log('[WebRTC] ✅ Answer sent successfully');
      }
    } catch (error) {
      console.error('[WebRTC] ❌ Failed to handle offer:', error);
      console.error('[WebRTC] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }
  }

  /**
   * Handle incoming WebRTC answer
   */
  private async handleAnswer(data: any): Promise<void> {
    const fromUserId = data.fromUserId || data.from;
    
    console.log('[WebRTC] 📥 HANDLING ANSWER from:', fromUserId);
    
    if (!data || !fromUserId) {
      console.error('[WebRTC] ❌ Invalid answer data:', data);
      return;
    }

    if (!data.answer) {
      console.error('[WebRTC] ❌ No answer in data!');
      return;
    }

    try {
      const pc = this.peerConnections.get(fromUserId);
      if (pc) {
        console.log('[WebRTC] Setting remote description (answer)');
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        console.log('[WebRTC] ✅ Remote description (answer) set for:', fromUserId);
      } else {
        console.warn('[WebRTC] ⚠️ No peer connection found for:', fromUserId);
      }
    } catch (error) {
      console.error('[WebRTC] ❌ Failed to handle answer:', error);
      console.error('[WebRTC] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  private async handleIceCandidate(data: any): Promise<void> {
    const fromUserId = data.fromUserId || data.from;
    
    console.log('[WebRTC] 🧊 HANDLING ICE CANDIDATE from:', fromUserId);
    
    if (!data || !fromUserId) {
      console.error('[WebRTC] ❌ Invalid ICE candidate data:', data);
      return;
    }

    if (!data.candidate) {
      console.error('[WebRTC] ❌ No candidate in data!');
      return;
    }

    try {
      const pc = this.peerConnections.get(fromUserId);
      if (pc && data.candidate) {
        console.log('[WebRTC] Adding ICE candidate');
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log('[WebRTC] ✅ ICE candidate added for:', fromUserId);
      } else {
        if (!pc) console.warn('[WebRTC] ⚠️ No peer connection found for:', fromUserId);
        if (!data.candidate) console.warn('[WebRTC] ⚠️ No candidate in data');
      }
    } catch (error) {
      console.error('[WebRTC] ❌ Failed to add ICE candidate:', error);
      console.error('[WebRTC] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
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
