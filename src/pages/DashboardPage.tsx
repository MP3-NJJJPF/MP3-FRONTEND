import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { useAuthStore } from '../stores/useAuthStore';
import { apiClient } from '../fetch/fetchClient';

/**
 * DashboardPage Component
 * Main dashboard for authenticated users
 * Displays greeting, quick actions for creating/joining meetings
 * Features a floating sidebar on left (desktop/tablet) or bottom (mobile)
 */
export const DashboardPage: React.FC = () => {
  const [meetingCode, setMeetingCode] = useState('');
  const { user } = useAuthStore();
  // const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Get first two words from displayName
  const getFirstTwoWords = (name: string | null | undefined) => {
    if (!name) return 'Usuario';
    const words = name.trim().split(/\s+/);
    return words.slice(0, 2).join(' ');
  };

  const userName = getFirstTwoWords(user?.displayName);

  // const handleCreateMeeting = () => {
  //   // TODO: Implement meeting creation logic
  //   // Generate random room ID and navigate to call room
  //   const roomId = Math.floor(1000000 + Math.random() * 9000000).toString();
  //   console.log('Creating new meeting with ID:', roomId);
  //   navigate(`/call/${roomId}`);
  // };

  const handleCreateMeeting = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.post("/api/v1/meetings/create", { "hostId": user?.uid });

      if (!res.ok) {
        alert("Error al crear la reunión");
        return;
      }

      console.log("Meeting created:", res.meetingId);

      navigate(`/call/${res.meetingId}`);

    } catch (error) {
      console.error("Error creating meeting:", error);
      alert("Hubo un problema creando la reunión.");
    } finally {
      setLoading(false);
    }
  };

  // const handleJoinMeeting = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (meetingCode.trim()) {
  //     // TODO: Implement join meeting logic
  //     console.log('Joining meeting with code:', meetingCode);
  //     navigate(`/call/${meetingCode}`);
  //   }
  // };

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!meetingCode.trim()) return;

    try {
      setLoading(true);

      const res: any = await apiClient.get(`/api/v1/meetings/${meetingCode}`);

      if (!res.ok) {
        alert("La reunión no existe");
        return;
      }

      console.log("Joining meeting:", meetingCode);

      navigate(`/call/${meetingCode}`);

    } catch (error) {
      console.error("Error joining meeting:", error);
      alert("Hubo un error al intentar unirse.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-(--color-background) flex flex-row">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 pb-32 md:pb-12">
        {/* Greeting Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            ¡Hola, {userName}!
          </h1>
          <p className="text-lg md:text-xl text-gray-400">
            ¿Qué te gustaría hacer hoy?
          </p>
        </div>

        {/* Action Cards */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Meeting Card */}
          <div className="bg-(--color-container) rounded-2xl p-8 flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-(--color-primary) rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>

            {/* Content */}
            <h2 className="text-2xl font-bold text-white mb-3">
              Crear Nueva Reunión
            </h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Inicia una nueva videoconferencia al instante.
            </p>

            {/* Button */}
            <button
              onClick={handleCreateMeeting}
              className="w-full h-12 bg-(--color-primary) hover:bg-(--color-primary-hover) text-white font-semibold rounded-xl transition-colors"
            >
              Crear Reunión
            </button>
          </div>

          {/* Join Meeting Card */}
          <div className="bg-(--color-container) rounded-2xl p-8 flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-(--color-primary) rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>

            {/* Content */}
            <h2 className="text-2xl font-bold text-white mb-3">
              Unirse a una Reunión
            </h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Usa un código o enlace para entrar a una reunión.
            </p>

            {/* Form */}
            <form onSubmit={handleJoinMeeting} className="w-full flex gap-2">
              <input
                type="text"
                placeholder="Ingresa Código"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                className="flex-1 h-12 px-4 bg-(--color-input-bg) text-white rounded-xl border border-(--color-border) focus:outline-none focus:border-(--color-primary) transition-colors"
              />
              <button
                type="submit"
                className="w-12 h-12 bg-(--color-primary) hover:bg-(--color-primary-hover) text-white rounded-xl transition-colors flex items-center justify-center shrink-0"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
