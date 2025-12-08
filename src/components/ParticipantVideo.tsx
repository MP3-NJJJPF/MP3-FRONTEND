import React, { useEffect, useRef } from 'react';

interface ParticipantVideoProps {
  participant: {
    userId: string;
    name: string;
    photo?: string;
    isMuted: boolean;
    isSpeaking: boolean;
    volumeLevel?: 'low' | 'medium' | 'high';
    isInVoiceCall: boolean;
    isVideoEnabled?: boolean;
    videoStream?: MediaStream;
  };
  currentUserId?: string;
  size?: 'small' | 'large';
}

/**
 * ParticipantVideo Component
 * Displays participant video or photo with proper stream management
 */
export const ParticipantVideo: React.FC<ParticipantVideoProps> = ({ 
  participant, 
  currentUserId,
  size = 'small'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Setup video stream
  useEffect(() => {
    console.log('[ParticipantVideo] Video stream effect:', {
      name: participant.name,
      userId: participant.userId,
      hasVideoRef: !!videoRef.current,
      hasVideoStream: !!participant.videoStream,
      isVideoEnabled: participant.isVideoEnabled,
      streamId: participant.videoStream?.id,
      videoTracks: participant.videoStream?.getVideoTracks().length || 0
    });
    
    if (videoRef.current) {
      if (participant.videoStream && participant.isVideoEnabled) {
        console.log('[ParticipantVideo] ✅ Setting video stream for:', participant.name);
        videoRef.current.srcObject = participant.videoStream;
      } else {
        console.log('[ParticipantVideo] 🧹 Clearing video stream for:', participant.name);
        videoRef.current.srcObject = null;
      }
    } else if (!videoRef.current) {
      console.warn('[ParticipantVideo] ❌ No video ref for:', participant.name);
    }
  }, [participant.videoStream, participant.userId, participant.name, participant.isVideoEnabled]);

  const truncateName = (name: string, maxLength: number = 12) => {
    if (!name || name.length <= maxLength) return name || 'Usuario';
    return name.substring(0, maxLength) + '...';
  };

  const isSmall = size === 'small';
  
  const showVideo = participant.isVideoEnabled && participant.videoStream;
  console.log('[ParticipantVideo] Render decision:', {
    name: participant.name,
    showVideo,
    isVideoEnabled: participant.isVideoEnabled,
    hasVideoStream: !!participant.videoStream
  });

  return (
    <div
      className={`relative ${
        isSmall ? 'w-40 h-28' : 'w-full h-full'
      } bg-(--color-container) rounded-xl shrink-0 transition-all overflow-hidden ${
        participant.isSpeaking ? 'border-2 border-green-500' : ''
      }`}
    >
      {/* Show video if enabled, otherwise show image */}
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.userId === currentUserId}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className={`relative ${
            participant.isSpeaking ? `animate-speaking-pulse-${participant.volumeLevel || 'low'}` : ''
          }`}>
            <img
              src={participant.photo || "/assets/profile-placeholder.jpg"}
              alt={participant.name || "Usuario"}
              className={`${isSmall ? 'w-20 h-20' : 'w-48 h-48 md:w-64 md:h-64'} rounded-full object-cover`}
            />
          </div>
        </div>
      )}

      {/* Voice indicator badge - only for small size */}
      {isSmall && participant.isInVoiceCall && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
          {participant.isMuted ? (
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              <line x1="4" y1="4" x2="16" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      )}

      {/* Name badge */}
      <div className={`absolute ${isSmall ? 'bottom-2 left-2' : 'bottom-4 left-4'} px-2 py-1 bg-black/60 rounded-full max-w-[calc(100%-1rem)]`}>
        {isSmall ? (
          <span className="text-xs font-medium text-white truncate block">
            {truncateName(participant.name || "Usuario", 12)}
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">
              {truncateName(participant.name || "Usuario", 15)}
            </span>
            {participant.isInVoiceCall && (
              <div className="flex items-center">
                {participant.isMuted ? (
                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    <line x1="4" y1="4" x2="16" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
