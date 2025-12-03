import socketIOClient, { Socket } from 'socket.io-client';

/**
 * WebRTC Service
 * Manages voice call connections, WebRTC peer connections, and audio streams
 */
class WebRTCService {
  private socket: Socket | null = null;
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private pendingIceCandidates: Map<string, any[]> = new Map();
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

    const voiceServerUrl = import.meta.env.VITE_VOICE_SERVER_URL || import.meta.env.VITE_VOICE_URL || 'https://server-voice-pi.onrender.com';

    try {
      // Fetch ICE servers configuration (STUN/TURN)
      console.log('[WebRTC] 🔍 Fetching ICE servers from:', `${voiceServerUrl}/api/ice-servers`);
      
      const response = await fetch(`${voiceServerUrl}/api/ice-servers`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors',
      });
      
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
        console.warn('[WebRTC] ⚠️ Could not fetch ICE servers (status:', response.status, ')');
        console.warn('[WebRTC] 🔄 Using fallback Google STUN servers');
        this.iceServers = [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ];
      }
    } catch (error: any) {
      console.warn('[WebRTC] ⚠️ Could not fetch ICE servers:', error.message);
      console.log('[WebRTC] 🔄 Using fallback Google STUN servers');
      // Use multiple STUN servers as fallback
      this.iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ];
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
      if (!data || !data.userId) return;

      // CRÍTICO: No crear peer connection contigo mismo
      if (data.userId === this.currentUserId) {
        console.log('[WebRTC] ⚠️ Ignoring self user-joined event');
        return;
      }

      const displayName = data.name || data.userId;
      console.log('[WebRTC] 👤 User joined:', displayName, '(', data.userId, ')');
      console.log('[WebRTC] 🔍 My userId:', this.currentUserId);
      console.log('[WebRTC] 🔍 Their userId:', data.userId);
      
      this.emit('user-joined', {
        userId: data.userId,
        name: displayName,
        photo: data.photo,
      });
      
      // Check if we already have a peer connection (could happen on reconnect)
      if (this.peerConnections.has(data.userId)) {
        console.log('[WebRTC] ⚠️ Peer connection already exists for:', data.userId);
        return;
      }
      
      // SOLUCIÓN RACE CONDITION: Solo el usuario con ID "menor" crea la oferta
      // Esto evita que ambos peers creen offers simultáneamente
      const shouldInitiate = this.currentUserId! < data.userId;
      
      console.log('[WebRTC] 🎲 Should I initiate?', shouldInitiate, '(comparing:', this.currentUserId!, '<', data.userId, ')');
      
      if (this.localStream && shouldInitiate) {
        console.log('[WebRTC] 🎯 YES - I should initiate (my ID < their ID), creating offer...');
        setTimeout(() => {
          this.createPeerConnection(data.userId);
        }, 100); // Small delay to ensure socket is ready
      } else if (!shouldInitiate) {
        console.log('[WebRTC] ⏸️ NO - Waiting for offer from peer (their ID < my ID)');
      } else {
        console.warn('[WebRTC] ⚠️ No local stream available yet');
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
      // Ignorar offers de uno mismo
      if (data.from === this.currentUserId) {
        console.log('[WebRTC] ⚠️ Ignoring offer from self');
        return;
      }
      console.log('[WebRTC] 📨 Received OFFER from:', data.from);
      await this.handleOffer(data);
    });

    // Received WebRTC answer (backend envía: webrtc-answer)
    this.socket.on('webrtc-answer', async (data: any) => {
      // Ignorar answers de uno mismo
      if (data.from === this.currentUserId) {
        console.log('[WebRTC] ⚠️ Ignoring answer from self');
        return;
      }
      console.log('[WebRTC] 📨 Received ANSWER from:', data.from);
      await this.handleAnswer(data);
    });

    // Received ICE candidate (backend envía: ice-candidate) - CRÍTICO
    this.socket.on('ice-candidate', async (data: any) => {
      console.log('[WebRTC] 🧊 ===== RECEIVED ICE CANDIDATE =====');
      console.log('[WebRTC] 🧊 From:', data.from || data.fromUserId);
      console.log('[WebRTC] 🧊 To:', data.to);
      console.log('[WebRTC] 🧊 Has candidate:', !!data.candidate);
      
      // Ignorar candidatos de uno mismo
      if (data.from === this.currentUserId || data.fromUserId === this.currentUserId) {
        console.log('[WebRTC] 🧊 ⚠️ Ignoring ICE candidate from self');
        return;
      }
      
      await this.handleIceCandidate(data);
      console.log('[WebRTC] 🧊 ===== END ICE CANDIDATE =====');
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
      
      // Ensure audio tracks are enabled and NOT muted
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = true;
        console.log('[AUDIO] Local track configured:', {
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState
        });
      });
      
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

    const configuration: RTCConfiguration = {
      iceServers: this.iceServers,
      iceCandidatePoolSize: 10,
      iceTransportPolicy: 'all', // Use both STUN and TURN
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    };

    const pc = new RTCPeerConnection(configuration);
    this.peerConnections.set(userId, pc);

    // Add local stream tracks
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      console.log('[AUDIO] 🎤 Adding', audioTracks.length, 'local audio tracks to:', userId);
      audioTracks.forEach((track, index) => {
        console.log(`[AUDIO] Track ${index}:`, {
          kind: track.kind,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          label: track.label
        });
        pc.addTrack(track, this.localStream!);
        console.log(`[AUDIO] ✅ Track ${index} added to peer connection`);
      });
      
      // Verify tracks were added
      const senders = pc.getSenders();
      console.log('[AUDIO] 📊 Peer connection has', senders.length, 'senders');
      senders.forEach((sender, idx) => {
        if (sender.track) {
          console.log(`[AUDIO] Sender ${idx}:`, sender.track.kind, 'enabled:', sender.track.enabled);
        }
      });
    } else {
      console.error('[AUDIO] ❌ NO LOCAL STREAM!');
    }

    // Handle ICE candidates - CRÍTICO PARA ESTABLECER CONEXIÓN
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] 🧊 ICE candidate generated for:', userId);
        console.log('[WebRTC] 🧊 Candidate type:', event.candidate.type);
        console.log('[WebRTC] 🧊 Candidate:', event.candidate.candidate);
        
        if (this.socket && this.currentUserId && this.currentMeetingId) {
          this.socket.emit('ice-candidate', {
            from: this.currentUserId,
            to: userId,
            candidate: event.candidate.toJSON(),
            meetingId: this.currentMeetingId
          });
          console.log('[WebRTC] 🧊 ✅ ICE candidate SENT to:', userId);
        } else {
          console.error('[WebRTC] 🧊 ❌ Cannot send ICE candidate - missing socket/userId/meetingId');
        }
      } else {
        console.log('[WebRTC] 🧊 ✅ All ICE candidates sent for:', userId);
      }
    };

    // Handle ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ❄️ ICE connection state changed:', pc.iceConnectionState, 'with:', userId);
      if (pc.iceConnectionState === 'connected') {
        console.log('[AUDIO] ✅ ICE CONNECTED with:', userId);
      } else if (pc.iceConnectionState === 'completed') {
        console.log('[AUDIO] ✅ ICE COMPLETED with:', userId);
      } else if (pc.iceConnectionState === 'failed') {
        console.error('[AUDIO] ❌ ICE FAILED with:', userId);
        console.error('[AUDIO] Connection may need restart or TURN servers');
        
        // Try to restart ICE
        console.log('[WebRTC] 🔄 Attempting ICE restart...');
        pc.restartIce();
      } else if (pc.iceConnectionState === 'disconnected') {
        console.warn('[AUDIO] ⚠️ ICE DISCONNECTED with:', userId);
        
        // Wait a bit and restart if still disconnected
        setTimeout(() => {
          if (pc.iceConnectionState === 'disconnected') {
            console.log('[WebRTC] 🔄 Still disconnected, restarting ICE...');
            pc.restartIce();
          }
        }, 3000);
      }
    };

    // Handle remote stream - CRÍTICO PARA ESCUCHAR AUDIO
    pc.ontrack = (event) => {
      console.log('[AUDIO] 🎵 ==== REMOTE TRACK RECEIVED ====');
      console.log('[AUDIO] From:', userId);
      console.log('[AUDIO] Track kind:', event.track.kind);
      console.log('[AUDIO] Track enabled:', event.track.enabled);
      console.log('[AUDIO] Track muted:', event.track.muted);
      console.log('[AUDIO] Track readyState:', event.track.readyState);
      console.log('[AUDIO] Track ID:', event.track.id);
      console.log('[AUDIO] Track label:', event.track.label);
      
      // CRÍTICO: Forzar que el track esté enabled (tracks pueden venir deshabilitados)
      event.track.enabled = true;
      console.log('[AUDIO] ✅ Track enabled set to TRUE');
      
      console.log('[AUDIO] Streams count:', event.streams.length);
      
      const remoteStream = event.streams[0];
      if (remoteStream) {
        console.log('[AUDIO] ✅ Stream ID:', remoteStream.id);
        console.log('[AUDIO] Stream active:', remoteStream.active);
        console.log('[AUDIO] Stream tracks:', remoteStream.getTracks().length);
        
        // CRÍTICO: Asegurar que TODOS los tracks del stream estén enabled
        remoteStream.getTracks().forEach((t, i) => {
          const wasEnabled = t.enabled;
          t.enabled = true;
          console.log(`[AUDIO] Track ${i}:`, t.kind, 'was enabled:', wasEnabled, '-> now enabled:', t.enabled, 'muted:', t.muted);
        });
        
        console.log('[AUDIO] 📢 Emitting remote-stream event for userId:', userId);
        this.emit('remote-stream', { userId, stream: remoteStream });
        console.log('[AUDIO] ✅ Remote-stream event emitted');
        console.log('[AUDIO] ==== END REMOTE TRACK ====');
      } else {
        console.error('[AUDIO] ❌❌❌ NO STREAM in track event!');
      }
    };

    // Handle connection state
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        console.log('[AUDIO] ✅ PEER CONNECTED with:', userId);
      } else if (pc.connectionState === 'failed') {
        console.error('[AUDIO] ❌ PEER CONNECTION FAILED with:', userId);
      } else if (pc.connectionState === 'disconnected') {
        console.warn('[AUDIO] ⚠️ PEER DISCONNECTED with:', userId);
      }
      console.log('[WebRTC] 🔗 Connection state:', pc.connectionState, 'with:', userId);
    };
    
    // Handle ICE gathering state
    pc.onicegatheringstatechange = () => {
      console.log('[WebRTC] 📡 ICE gathering state:', pc.iceGatheringState, 'with:', userId);
    };
    
    // Handle signaling state
    pc.onsignalingstatechange = () => {
      console.log('[WebRTC] 📶 Signaling state:', pc.signalingState, 'with:', userId);
    };

    // Create and send offer
    try {
      console.log('[WebRTC] 🎯 Creating offer for:', userId);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      
      console.log('[WebRTC] 📝 Offer created, setting local description...');
      await pc.setLocalDescription(offer);
      console.log('[WebRTC] ✅ Local description set (offer)');
      console.log('[WebRTC] 📤 Sending offer to:', userId);

      if (this.socket && this.currentUserId && this.currentMeetingId) {
        this.socket.emit('webrtc-offer', {
          from: this.currentUserId,
          to: userId,
          offer: pc.localDescription!.toJSON(),
          meetingId: this.currentMeetingId
        });
        console.log('[WebRTC] ✅ Offer sent successfully to:', userId);
      } else {
        console.error('[WebRTC] ❌ Cannot send offer - missing socket/userId/meetingId');
      }
    } catch (error) {
      console.error('[WebRTC] ❌ Failed to create/send offer:', error);
    }

    return pc;
  }

  /**
   * Handle incoming WebRTC offer
   */
  private async handleOffer(data: any): Promise<void> {
    const fromUserId = data.fromUserId || data.from;
    
    console.log('[WebRTC] 📥 ===== HANDLING OFFER =====');
    console.log('[WebRTC] Raw data:', JSON.stringify(data, null, 2));
    console.log('[WebRTC] From:', fromUserId);
    console.log('[WebRTC] Has offer?', !!data.offer);
    
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
        
        const configuration: RTCConfiguration = {
          iceServers: this.iceServers,
          iceCandidatePoolSize: 10,
          iceTransportPolicy: 'all',
          bundlePolicy: 'max-bundle',
          rtcpMuxPolicy: 'require',
        };
        
        pc = new RTCPeerConnection(configuration);
        this.peerConnections.set(fromUserId, pc);

        // Add local stream tracks
        if (this.localStream) {
          const tracks = this.localStream.getTracks();
          console.log('[WebRTC] 🎤 Adding', tracks.length, 'local tracks (handleOffer)');
          tracks.forEach((track, index) => {
            console.log(`[WebRTC] Track ${index}:`, {
              kind: track.kind,
              enabled: track.enabled,
              muted: track.muted,
              readyState: track.readyState,
              label: track.label
            });
            pc!.addTrack(track, this.localStream!);
            console.log(`[WebRTC] ✅ Track ${index} added`);
          });
          
          // Verify tracks were added
          const senders = pc.getSenders();
          console.log('[WebRTC] 📊 Peer connection has', senders.length, 'senders (handleOffer)');
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            console.log('[WebRTC] 🧊 ICE candidate generated (handleOffer) for:', fromUserId);
            console.log('[WebRTC] 🧊 Candidate type:', event.candidate.type);
            
            if (this.socket && this.currentUserId && this.currentMeetingId) {
              this.socket.emit('ice-candidate', {
                from: this.currentUserId,
                to: fromUserId,
                candidate: event.candidate.toJSON(),
                meetingId: this.currentMeetingId
              });
              console.log('[WebRTC] 🧊 ✅ ICE candidate SENT (handleOffer) to:', fromUserId);
            }
          } else {
            console.log('[WebRTC] 🧊 ✅ All ICE candidates sent (handleOffer) for:', fromUserId);
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
      
      // Process pending ICE candidates if any BEFORE creating answer
      const pendingCandidates = this.pendingIceCandidates.get(fromUserId);
      if (pendingCandidates && pendingCandidates.length > 0) {
        console.log('[WebRTC] 📦 Processing', pendingCandidates.length, 'pending ICE candidates BEFORE answer');
        for (const candidate of pendingCandidates) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('[WebRTC] ✅ Added pending ICE candidate');
          } catch (err) {
            console.error('[WebRTC] ❌ Failed to add pending ICE candidate:', err);
          }
        }
        this.pendingIceCandidates.delete(fromUserId);
      }
      
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
        console.log('[WebRTC] ===== END HANDLING OFFER =====');
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
    
    console.log('[WebRTC] 📥 ===== HANDLING ANSWER =====');
    console.log('[WebRTC] Raw data:', JSON.stringify(data, null, 2));
    console.log('[WebRTC] From:', fromUserId);
    console.log('[WebRTC] Has answer?', !!data.answer);
    
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
      if (!pc) {
        console.warn('[WebRTC] ⚠️ No peer connection found for:', fromUserId);
        return;
      }

      // Check signaling state before setting remote description
      console.log('[WebRTC] Current signaling state:', pc.signalingState);
      
      // If already stable or closed, don't try to set answer
      if (pc.signalingState === 'stable' || pc.signalingState === 'closed') {
        console.log('[WebRTC] ℹ️ Peer connection in', pc.signalingState, 'state, skipping answer');
        return;
      }
      
      // Can only set answer if we're waiting for one
      if (pc.signalingState !== 'have-local-offer') {
        console.warn('[WebRTC] ⚠️ Cannot process answer in state:', pc.signalingState);
        return;
      }

      console.log('[WebRTC] Setting remote description (answer)');
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      console.log('[WebRTC] ✅ Remote description (answer) set for:', fromUserId);
      console.log('[WebRTC] ✅ Connection negotiation complete with:', fromUserId);
      
      // Process pending ICE candidates if any
      const pendingCandidates = this.pendingIceCandidates.get(fromUserId);
      if (pendingCandidates && pendingCandidates.length > 0) {
        console.log('[WebRTC] 📦 Processing', pendingCandidates.length, 'pending ICE candidates for:', fromUserId);
        for (const candidate of pendingCandidates) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('[WebRTC] ✅ Added pending ICE candidate');
          } catch (err) {
            console.error('[WebRTC] ❌ Failed to add pending ICE candidate:', err);
          }
        }
        this.pendingIceCandidates.delete(fromUserId);
      }
      console.log('[WebRTC] ===== END HANDLING ANSWER =====');
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
      console.log('[WebRTC] 🧊 Empty ICE candidate (end of candidates) from:', fromUserId);
      return;
    }

    try {
      const pc = this.peerConnections.get(fromUserId);
      if (!pc) {
        console.error('[WebRTC] 🧊 ❌ No peer connection for ICE candidate from:', fromUserId);
        console.error('[WebRTC] 🧊 Available connections:', Array.from(this.peerConnections.keys()));
        return;
      }

      console.log('[WebRTC] 🧊 Peer connection found for:', fromUserId);
      console.log('[WebRTC] 🧊 Remote description set?', !!pc.remoteDescription);
      console.log('[WebRTC] 🧊 Signaling state:', pc.signalingState);

      // Check if remote description is set before adding ICE candidate
      if (!pc.remoteDescription) {
        console.warn('[WebRTC] 🧊 ⚠️ No remote description yet, queuing ICE candidate for:', fromUserId);
        // Store candidate to add later
        if (!this.pendingIceCandidates.has(fromUserId)) {
          this.pendingIceCandidates.set(fromUserId, []);
        }
        this.pendingIceCandidates.get(fromUserId)!.push(data.candidate);
        console.log('[WebRTC] 🧊 Queued candidate. Total pending:', this.pendingIceCandidates.get(fromUserId)!.length);
        return;
      }

      console.log('[WebRTC] 🧊 Adding ICE candidate to peer connection...');
      console.log('[WebRTC] 🧊 Candidate details:', JSON.stringify(data.candidate, null, 2));
      
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      console.log('[WebRTC] 🧊 ✅ ICE candidate SUCCESSFULLY ADDED for:', fromUserId);
    } catch (error) {
      console.error('[WebRTC] 🧊 ❌ Failed to add ICE candidate:', error);
      console.error('[WebRTC] 🧊 Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      console.error('[WebRTC] 🧊 Candidate was:', JSON.stringify(data.candidate, null, 2));
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

  /**
   * Get peer connection stats for debugging
   */
  async getPeerConnectionStats(userId: string): Promise<any> {
    const pc = this.peerConnections.get(userId);
    if (!pc) {
      return { error: 'No peer connection found' };
    }

    const stats = await pc.getStats();
    const statsObj: any = {};
    
    stats.forEach((report) => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        statsObj.candidatePair = report;
      }
      if (report.type === 'inbound-rtp' && report.kind === 'audio') {
        statsObj.inboundAudio = report;
      }
      if (report.type === 'outbound-rtp' && report.kind === 'audio') {
        statsObj.outboundAudio = report;
      }
    });

    return {
      iceConnectionState: pc.iceConnectionState,
      iceGatheringState: pc.iceGatheringState,
      signalingState: pc.signalingState,
      connectionState: pc.connectionState,
      stats: statsObj,
    };
  }

  /**
   * Log all peer connections status
   */
  logAllConnectionsStatus(): void {
    console.log('[WebRTC] 📊 ==== CONNECTION STATUS ====');
    console.log('[WebRTC] Total peer connections:', this.peerConnections.size);
    
    this.peerConnections.forEach((pc, userId) => {
      console.log(`[WebRTC] User: ${userId}`);
      console.log('  - ICE connection:', pc.iceConnectionState);
      console.log('  - ICE gathering:', pc.iceGatheringState);
      console.log('  - Signaling:', pc.signalingState);
      console.log('  - Connection:', pc.connectionState);
      console.log('  - Senders:', pc.getSenders().length);
      console.log('  - Receivers:', pc.getReceivers().length);
    });
    
    console.log('[WebRTC] ==== END STATUS ====');
  }
}

// Export singleton instance
export const webrtcService = new WebRTCService();
