import React, { useEffect, useRef, useState } from 'react';

/**
 * VoiceParticipant Component
 * Displays a participant in a voice call with audio visualization
 */
interface VoiceParticipantProps {
  userId: string;
  name: string;
  photo?: string;
  isMuted: boolean;
  stream?: MediaStream;
  isLocal?: boolean;
}

export const VoiceParticipant: React.FC<VoiceParticipantProps> = ({
  userId,
  name,
  photo,
  isMuted,
  stream,
  isLocal = false,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Log received props
  console.log('[VoiceParticipant] 🎭 Component render:', {
    userId,
    name,
    hasPhoto: !!photo,
    isMuted,
    hasStream: !!stream,
    isLocal,
    nameType: typeof name,
    nameValue: name
  });

  // Setup audio element for remote streams
  useEffect(() => {
    if (!isLocal && stream && audioRef.current) {
      console.log('[AUDIO] ==== SETTING UP AUDIO ELEMENT ====');
      console.log('[AUDIO] For user:', name);
      console.log('[AUDIO] Stream ID:', stream.id);
      console.log('[AUDIO] Stream active:', stream.active);
      console.log('[AUDIO] Stream tracks:', stream.getTracks().map(t => ({
        kind: t.kind,
        enabled: t.enabled,
        muted: t.muted,
        readyState: t.readyState
      })));
      
      const audioElement = audioRef.current;
      
      // CRÍTICO: Forzar que todos los tracks estén enabled
      stream.getTracks().forEach(track => {
        track.enabled = true;
        console.log('[AUDIO] Forcing track enabled:', track.kind, track.enabled);
        
        // NUEVO: Escuchar cambios en el estado muted del track
        track.onmute = () => {
          console.log('[AUDIO] ⚠️ Track muted event!');
        };
        track.onunmute = () => {
          console.log('[AUDIO] ✅ Track UNMUTED! Audio should work now');
        };
      });
      
      audioElement.srcObject = stream;
      audioElement.volume = 1.0;
      audioElement.muted = false;
      audioElement.defaultMuted = false;
      
      console.log('[AUDIO] Audio element properties:', {
        volume: audioElement.volume,
        muted: audioElement.muted,
        paused: audioElement.paused
      });
      
      audioElement.play().then(() => {
        console.log('[AUDIO] ✅✅✅ AUDIO PLAYING for:', name);
        console.log('[AUDIO] Final audio element state:', {
          volume: audioElement.volume,
          muted: audioElement.muted,
          paused: audioElement.paused,
          currentTime: audioElement.currentTime
        });
      }).catch(error => {
        console.error('[AUDIO] ❌❌❌ FAILED TO PLAY:', error.name, error.message);
        console.log('[AUDIO] Audio element at error:', {
          volume: audioElement.volume,
          muted: audioElement.muted,
          readyState: audioElement.readyState
        });
        
        // Try with user interaction
        const playOnClick = () => {
          console.log('[AUDIO] Attempting play on user click...');
          audioElement.play()
            .then(() => console.log('[AUDIO] ✅ Play successful after click'))
            .catch(e => console.error('[AUDIO] ❌ Still failed:', e.message));
        };
        document.addEventListener('click', playOnClick, { once: true });
      });
    }
  }, [stream, isLocal, name]);

  // Audio level detection
  useEffect(() => {
    if (!stream) return;

    const audioContext = new AudioContext();
    const audioSource = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    audioSource.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationFrame: number;

    const detectSpeaking = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      
      // Threshold for speaking detection
      setIsSpeaking(average > 20 && !isMuted);
      
      animationFrame = requestAnimationFrame(detectSpeaking);
    };

    detectSpeaking();

    return () => {
      cancelAnimationFrame(animationFrame);
      audioContext.close();
    };
  }, [stream, isMuted]);

  const truncateName = (name: string, maxLength: number = 12) => {
    if (!name || name.length <= maxLength) return name || 'Usuario';
    return name.substring(0, maxLength) + '...';
  };

  return (
    <div className="relative">
      {/* Hidden audio element for remote streams */}
      {!isLocal && (
        <audio 
          ref={audioRef} 
          autoPlay 
          playsInline
          controls={false}
          style={{ display: 'none' }}
        />
      )}
      
      {/* Participant card */}
      <div
        className={`relative w-40 h-28 bg-(--color-container) rounded-xl overflow-hidden transition-all ${
          isSpeaking ? 'ring-2 ring-(--color-primary) ring-offset-2 ring-offset-(--color-background)' : ''
        }`}
      >
        <img
          src={photo || '/assets/profile-placeholder.jpg'}
          alt={name}
          className="w-full h-full object-cover"
        />

        {/* Name badge */}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded-full max-w-[calc(100%-1rem)] flex items-center gap-1">
          {/* Microphone icon */}
          {isMuted ? (
            <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          )}
          
          <span className="text-xs font-medium text-white truncate block">
            {truncateName(name)}
          </span>
        </div>

        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="absolute top-2 right-2">
            <div className="w-3 h-3 bg-(--color-primary) rounded-full animate-pulse" />
          </div>
        )}

        {/* Local badge */}
        {isLocal && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-(--color-primary) rounded-full">
            <span className="text-xs font-medium text-white">Tú</span>
          </div>
        )}
      </div>
    </div>
  );
};
