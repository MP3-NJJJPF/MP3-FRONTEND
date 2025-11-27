import React, { useState, useEffect } from 'react';
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

  const { user } = useAuthStore();

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

  // Mock data for participants
  const mainParticipant = {
    name: 'Valentina Rojas',
    videoUrl: '/assets/participant-placeholder.jpg',
  };

  // const participants = [
  //   { id: 1, name: 'Camila Herrera', videoUrl: '/assets/participant-1.jpg' },
  //   { id: 2, name: 'Alejandro Cas...', videoUrl: '/assets/participant-2.jpg' },
  //   { id: 3, name: 'Daniela Torres', videoUrl: '/assets/participant-3.jpg' },
  //   { id: 4, name: 'Sebastián Me...', videoUrl: '/assets/participant-4.jpg' },
  // ];

  const additionalParticipants = 5;

  // Mock chat messages
  // const chatMessages = [
  //   { id: 1, sender: 'Yo', time: '12:00 am', message: 'Buenos días a todos!', isOwn: true },
  //   { id: 2, sender: 'Yo', time: '00:00 am', message: 'Como están?', isOwn: true },
  //   { id: 3, sender: 'Alexandra', time: '12:04 am', message: 'Recien voy entrando, me ponen al día?', isOwn: false },
  // ];

  // const handleSendMessage = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (chatMessage.trim()) {
  //     // TODO: Implement send message logic
  //     console.log('Sending message:', chatMessage);
  //     setChatMessage('');
  //   }
  // };

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

  return (
    <div className="min-h-screen bg-(--color-background) flex flex-row">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content - Call Room */}
      <main className="flex-1 flex flex-col pb-32 md:pb-0">
        {/* Header */}
        <header className="px-6 py-4 flex items-center gap-2">
          <h1 className="text-xl font-semibold text-white">Sala</h1>
          <span className="text-xl font-semibold text-gray-400">#{roomId || '1234568'}</span>
        </header>

        {/* Video Area */}
        <div className="flex-1 flex flex-row gap-4 px-6 overflow-hidden">
          {/* Main Video + Participants */}
          <div className={`flex flex-col gap-4 transition-all ${isChatOpen ? 'flex-1' : 'flex-1'}`}>
            {/* Main Video Feed */}
            <div className="flex-1 relative bg-(--color-container) rounded-2xl overflow-hidden">
              {/* Video Placeholder */}
              <img
                src={mainParticipant.videoUrl}
                alt={mainParticipant.name}
                className="w-full h-full object-cover"
              />

              {/* Participant Name Badge */}
              <div className="absolute bottom-4 left-4 px-4 py-2 bg-black/60 rounded-full">
                <span className="text-sm font-medium text-white">{mainParticipant.name}</span>
              </div>
            </div>

            {/* Participants Gallery */}
            <div className="flex items-center gap-3 pb-4">
              {/* {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="relative w-40 h-28 bg-(--color-container) rounded-xl overflow-hidden shrink-0"
                >
                  <img
                    src={participant.videoUrl}
                    alt={participant.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded-full">
                    <span className="text-xs font-medium text-white">{participant.name}</span>
                  </div>
                </div>
              ))} */}

              {onlineUsers.map((u) => (
                <div
                  key={u.socketId}   // llave correcta
                  className="relative w-40 h-28 bg-(--color-container) rounded-xl overflow-hidden shrink-0"
                >
                  <img
                    src={u.photo || "/assets/profile-placeholder.jpg"}
                    alt={u.name || "Usuario"}
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded-full">
                    <span className="text-xs font-medium text-white">{u.name}</span>
                  </div>
                </div>
              ))}

              {/* More Participants Button */}
              <button className="w-40 h-28 bg-(--color-container) rounded-xl flex flex-col items-center justify-center gap-2 shrink-0 hover:bg-(--color-container)/80 transition-colors">
                <div className="w-12 h-12 bg-(--color-primary) rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-xs text-white font-medium">{additionalParticipants} Participantes mas</span>
                <span className="text-xs text-gray-400">Ver todos</span>
              </button>
            </div>
          </div>

          {/* Chat Sidebar */}
          {isChatOpen && (
            <div className="w-80 bg-(--color-container) rounded-2xl flex flex-col shrink-0">
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-(--color-border)">
                <h2 className="text-lg font-semibold text-white">Chat</h2>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 px-6 py-4 overflow-y-auto space-y-4">
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
                        {msg.isOwn ? 'Tú' : (msg.name || msg.userId)} – {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className={`px-4 py-2 rounded-xl max-w-xs ${msg.isOwn ? 'bg-(--color-primary) text-white' : 'bg-(--color-input-bg) text-white'
                      }`}>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="px-4 py-4 border-t border-(--color-border)">
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
          )}
        </div>

        {/* Call Controls */}
        <div className="px-6 py-6 flex items-center justify-center gap-4">
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
