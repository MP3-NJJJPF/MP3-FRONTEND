import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { LeaveCallModal } from '../components/LeaveCallModal';
import { socket } from '../sockets/socketManager';
import { useAuthStore } from '../stores/useAuthStore';
import { OnlineUser } from '../types/api.types';

/**
 * CallRoomPage Component
 * Video call room interface with streaming player and chat
 * Displays main video feed, participant gallery, call controls, and chat sidebar
 */
export const CallRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<{ userId: string; message: string; timestamp: string; isOwn: boolean; name?: string, photo?: string }[]>([]);
  const [isLeaveCallModalOpen, setIsLeaveCallModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { user } = useAuthStore();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user || !roomId) return;
    const photo = user.photoURL && user.photoURL.length > 5
      ? user.photoURL
      : "/assets/profile-placeholder.jpg";

    console.log("Enviando usuario al socket:", { userId: user.uid, name: user.displayName, photo });

    socket.emit("newUser", {
      userId: user.uid,
      name: user.displayName,
      photo,
      roomId
    });
  }, [user?.uid, user?.displayName, user?.photoURL, roomId]);


  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    const handler = (users: OnlineUser[]) => {
      setOnlineUsers(users);
    };

    socket.on("usersOnline", handler);

    return () => {
      socket.off("usersOnline", handler);
    };
  }, []);

  useEffect(() => {
    const handler = (msg: any) => {
      setMessages(prev => [
        ...prev,
        {
          userId: msg.userId,
          message: msg.message,
          timestamp: msg.timestamp,
          isOwn: msg.userId === user?.uid,
          name: msg.name,
          photo: msg.photo,
        }
      ]);
    };

    socket.on("chat:message", handler);

    return () => {
      socket.off("chat:message", handler);
    };
  }, [user?.uid, user?.displayName]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    socket.emit("chat:message", {
      userId: user?.uid,
      message: chatMessage,
      timestamp: new Date().toISOString(),
      name: user?.displayName,
      photo: user?.photoURL,
    });

    setChatMessage('');
  };

  const handleLeaveCall = () => {
    setIsLeaveCallModalOpen(true);
  };

  const handleConfirmLeave = () => {
    console.log('Leaving call...');
    socket.emit("leave-call", { roomId });
    setIsLeaveCallModalOpen(false);
    navigate('/dashboard');
  };

  // Calculate participants to display
  const totalParticipants = onlineUsers.length;
  const maxVisibleParticipants = 4;
  const visibleParticipants = onlineUsers.slice(0, maxVisibleParticipants);
  const remainingParticipants = Math.max(0, totalParticipants - maxVisibleParticipants);
  const showMoreButton = totalParticipants > 5;

  // Truncate participant name
  const truncateName = (name: string, maxLength: number = 15) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  return (
    <div className="h-screen bg-(--color-background) flex flex-row overflow-hidden">
      {/* Sidebar - Hidden on mobile during call */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main Content - Call Room */}
      <main className="flex-1 flex flex-col pb-20 md:pb-0 min-h-0">
        {/* Header */}
        <header className="px-4 md:px-6 py-4 flex items-center gap-2 shrink-0">
          <h1 className="text-xl font-semibold text-white">Sala</h1>
          <span className="text-xl font-semibold text-gray-400">#{roomId || '1234568'}</span>
        </header>

        {/* Video Area - Different layouts for mobile/tablet/desktop */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 px-4 md:px-6 overflow-hidden min-h-0">
          {/* Main Video + Participants */}
          <div className={`flex flex-col gap-4 transition-all min-h-0 ${isChatOpen ? 'hidden md:flex flex-1' : 'flex-1'}`}>
            {/* Main Video Feed - Only show if there are participants */}
            {totalParticipants > 0 && (
              <div className="flex-1 relative bg-(--color-container) rounded-2xl overflow-hidden min-h-0">
                {/* Video Placeholder */}
                <img
                  src={onlineUsers[0]?.photo || "/assets/profile-placeholder.jpg"}
                  alt={onlineUsers[0]?.name || "Usuario"}
                  className="w-full h-full object-cover"
                />

                {/* Current User in Picture-in-Picture (Mobile Only) */}
                {user && (
                  <div className="md:hidden absolute bottom-4 right-4 w-24 h-32 bg-(--color-container) rounded-xl overflow-hidden border-2 border-(--color-primary)">
                    <img
                      src={user.photoURL || "/assets/profile-placeholder.jpg"}
                      alt={user.displayName || "Yo"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 left-1 right-1 px-2 py-1 bg-black/60 rounded-full">
                      <span className="text-xs font-medium text-white truncate block text-center">
                        Yo
                      </span>
                    </div>
                  </div>
                )}

                {/* Participant Name Badge */}
                <div className="absolute bottom-4 left-4 px-4 py-2 bg-black/60 rounded-full">
                  <span className="text-sm font-medium text-white">
                    {truncateName(onlineUsers[0]?.name || "Usuario")}
                  </span>
                </div>
              </div>
            )}

            {/* Participants Gallery - Hidden on mobile, shown on tablet/desktop */}
            {totalParticipants > 1 && (
              <div className="hidden md:flex items-center gap-3 pb-4 overflow-x-auto shrink-0">
                {/* Show participants from index 1 onwards (excluding the main one) */}
                {visibleParticipants.slice(1).map((u) => (
                  <div
                    key={u.socketId}
                    className="relative w-40 h-28 bg-(--color-container) rounded-xl overflow-hidden shrink-0"
                  >
                    <img
                      src={u.photo || "/assets/profile-placeholder.jpg"}
                      alt={u.name || "Usuario"}
                      className="w-full h-full object-cover"
                    />

                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded-full max-w-[calc(100%-1rem)]">
                      <span className="text-xs font-medium text-white truncate block">
                        {truncateName(u.name || "Usuario", 12)}
                      </span>
                    </div>
                  </div>
                ))}

                {/* More Participants Button - Only show when there are more than 5 participants */}
                {showMoreButton && (
                  <button className="w-40 h-28 bg-(--color-container) rounded-xl flex flex-col items-center justify-center gap-2 shrink-0 hover:bg-(--color-container)/80 transition-colors">
                    <div className="w-12 h-12 bg-(--color-primary) rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="text-xs text-white font-medium">{remainingParticipants} Participantes más</span>
                    <span className="text-xs text-gray-400">Ver todos</span>
                  </button>
                )}
              </div>
            )}

            {/* Mobile: Scrollable Participants List - Only when chat is closed */}
            {totalParticipants > 1 && !isChatOpen && (
              <div className="md:hidden shrink-0 max-h-48 overflow-y-auto space-y-3 pb-4"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(251, 251, 251, 0.7) transparent',
                }}
              >
                {onlineUsers.slice(1).map((u) => (
                  <div
                    key={u.socketId}
                    className="relative h-32 bg-(--color-container) rounded-xl overflow-hidden"
                  >
                    <img
                      src={u.photo || "/assets/profile-placeholder.jpg"}
                      alt={u.name || "Usuario"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-3 py-1 bg-black/60 rounded-full">
                      <span className="text-sm font-medium text-white">
                        {truncateName(u.name || "Usuario", 20)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Sidebar - Desktop: side panel, Tablet: bottom panel, Mobile: fullscreen overlay */}
          {isChatOpen && (
            <>
              {/* Tablet Chat - Bottom Panel */}
              <div className="hidden md:flex lg:hidden w-full h-64 bg-(--color-container) rounded-2xl flex-col shrink-0">
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-(--color-border) shrink-0">
                  <h2 className="text-lg font-semibold text-white">Chat</h2>
                </div>

                {/* Chat Messages */}
                <div 
                  ref={messagesContainerRef}
                  className="flex-1 px-6 py-4 overflow-y-auto space-y-4 min-h-0"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(251, 251, 251, 0.7) transparent',
                  }}
                >
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {!msg.isOwn && (
                          <img
                            src={msg.photo || "/assets/profile-placeholder.jpg"}
                            className="w-6 h-6 rounded-full object-cover"
                            alt={msg.name}
                          />
                        )}

                        <span className="text-xs text-gray-400">
                          {msg.isOwn ? 'Tú' : truncateName(msg.name || msg.userId, 15)} – {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className={`px-4 py-2 rounded-xl max-w-xs wrap-break-word ${msg.isOwn ? 'bg-(--color-primary) text-white' : 'bg-(--color-input-bg) text-white'
                        }`}>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendMessage} className="px-4 py-4 border-t border-(--color-border) shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Escribe un mensaje . . ."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="flex-1 h-10 px-4 bg-(--color-input-bg) text-white text-sm rounded-xl border border-(--color-border) focus:outline-none focus:border-(--color-primary) transition-colors placeholder:text-gray-500"
                    />
                    <button
                      type="submit"
                      className="w-10 h-10 bg-(--color-primary) hover:bg-(--color-primary-hover) text-white rounded-xl transition-colors flex items-center justify-center shrink-0"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>

              {/* Desktop Chat - Side Panel */}
              <div className="hidden lg:flex w-80 h-full bg-(--color-container) rounded-2xl flex-col shrink-0">
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-(--color-border) shrink-0">
                  <h2 className="text-lg font-semibold text-white">Chat</h2>
                </div>

                {/* Chat Messages */}
                <div 
                  className="flex-1 px-6 py-4 overflow-y-auto space-y-4 min-h-0"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(251, 251, 251, 0.7) transparent',
                  }}
                >
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {!msg.isOwn && (
                          <img
                            src={msg.photo || "/assets/profile-placeholder.jpg"}
                            className="w-6 h-6 rounded-full object-cover"
                            alt={msg.name}
                          />
                        )}

                        <span className="text-xs text-gray-400">
                          {msg.isOwn ? 'Tú' : truncateName(msg.name || msg.userId, 15)} – {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className={`px-4 py-2 rounded-xl max-w-xs wrap-break-word ${msg.isOwn ? 'bg-(--color-primary) text-white' : 'bg-(--color-input-bg) text-white'
                        }`}>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendMessage} className="px-4 py-4 border-t border-(--color-border) shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Escribe un mensaje . . ."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="flex-1 h-10 px-4 bg-(--color-input-bg) text-white text-sm rounded-xl border border-(--color-border) focus:outline-none focus:border-(--color-primary) transition-colors placeholder:text-gray-500"
                    />
                    <button
                      type="submit"
                      className="w-10 h-10 bg-(--color-primary) hover:bg-(--color-primary-hover) text-white rounded-xl transition-colors flex items-center justify-center shrink-0"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>

              {/* Mobile Chat - Fullscreen Overlay */}
              <div className="md:hidden fixed inset-0 z-40 bg-(--color-background) flex flex-col pb-20">
                {/* Chat Header with Close Button */}
                <div className="px-4 py-4 border-b border-(--color-border) shrink-0 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Chat</h2>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Chat Messages */}
                <div 
                  className="flex-1 px-4 py-4 overflow-y-auto space-y-4 min-h-0"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(251, 251, 251, 0.7) transparent',
                  }}
                >
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {!msg.isOwn && (
                          <img
                            src={msg.photo || "/assets/profile-placeholder.jpg"}
                            className="w-6 h-6 rounded-full object-cover"
                            alt={msg.name}
                          />
                        )}

                        <span className="text-xs text-gray-400">
                          {msg.isOwn ? 'Tú' : truncateName(msg.name || msg.userId, 15)} – {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className={`px-4 py-2 rounded-xl max-w-xs wrap-break-word ${msg.isOwn ? 'bg-(--color-primary) text-white' : 'bg-(--color-input-bg) text-white'
                        }`}>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendMessage} className="px-4 py-4 border-t border-(--color-border) shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Escribe un mensaje . . ."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="flex-1 h-10 px-4 bg-(--color-input-bg) text-white text-sm rounded-xl border border-(--color-border) focus:outline-none focus:border-(--color-primary) transition-colors placeholder:text-gray-500"
                    />
                    <button
                      type="submit"
                      className="w-10 h-10 bg-(--color-primary) hover:bg-(--color-primary-hover) text-white rounded-xl transition-colors flex items-center justify-center shrink-0"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>

        {/* Call Controls - Fixed at bottom, always visible */}
        <div className="fixed md:relative bottom-0 left-0 right-0 px-4 md:px-6 py-4 md:py-6 bg-(--color-background) md:bg-transparent flex items-center justify-center gap-4 z-50">
          {/* Microphone */}
          <button className="w-12 h-12 bg-(--color-primary) hover:bg-(--color-primary-hover) text-white rounded-full transition-colors flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          {/* Camera */}
          <button className="w-12 h-12 bg-(--color-primary) hover:bg-(--color-primary-hover) text-white rounded-full transition-colors flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Chat Toggle */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`w-12 h-12 ${isChatOpen ? 'bg-(--color-primary)' : 'bg-(--color-primary)'} hover:bg-(--color-primary-hover) text-white rounded-full transition-colors flex items-center justify-center`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>

          {/* End Call */}
          <button
            onClick={handleLeaveCall}
            className="w-12 h-12 bg-(--color-error) hover:bg-(--color-error)/80 text-white rounded-full transition-colors flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>

        {/* Leave Call Modal */}
        <LeaveCallModal
          isOpen={isLeaveCallModalOpen}
          onClose={() => setIsLeaveCallModalOpen(false)}
          onConfirm={handleConfirmLeave}
        />
      </main>
    </div>
  );
};
