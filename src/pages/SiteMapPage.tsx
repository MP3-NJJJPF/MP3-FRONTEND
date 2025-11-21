import React from 'react';
import { Link } from 'react-router';
import { PageCard } from '../components/PageCard';

/**
 * SiteMapPage Component
 * Displays a complete list of all pages and modules within the application
 * Organized into unprotected and protected views
 */
export const SiteMapPage: React.FC = () => {
  const unprotectedPages = [
    {
      title: 'Página de Inicio',
      description: 'Página de bienvenida que presenta la aplicación a los visitantes, destacando sus características clave y beneficios. Proporciona acceso directo a las opciones de registro e inicio de sesión.',
      to: '/',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      title: 'Inicio de Sesión',
      description: 'Formulario seguro para que los usuarios existentes accedan a sus cuentas. Incluye un enlace para la recuperación de contraseña en caso de olvido.',
      to: '/login',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
      ),
    },
    {
      title: 'Registro de Usuario',
      description: 'Página de registro para nuevos usuarios, donde pueden crear una cuenta proporcionando la información necesaria, como nombre, correo electrónico y contraseña.',
      to: '/register',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
    {
      title: 'Recuperación de Contraseña',
      description: 'Proceso guiado para que los usuarios restablezcan su contraseña de forma segura, generalmente a través de un enlace enviado a su correo electrónico de registro.',
      to: '/forgot-password',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
    },
    {
      title: 'Sobre Nosotros',
      description: 'Página de bienvenida que presenta la aplicación a los visitantes. Proporciona acceso directo a las opciones de registro e inicio de sesión.',
      to: '/about',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Mapa del Sitio',
      description: 'Esta misma página, que proporciona una vista estructurada de todas las páginas disponibles en el sitio web para una navegación clara y sencilla.',
      to: '/sitemap',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
    },
  ];

  const protectedPages = [
    {
      title: 'Dashboard/Home',
      description: 'Panel principal para usuarios autenticados. Acceso rápido para crear o unirse a una llamada.',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
        </svg>
      ),
    },
    {
      title: 'Sala de Reunión/Llamada',
      description: 'Interfaz de la videoconferencia en tiempo real, con controles de audio y vídeo, visualización de participantes, chat en vivo.',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'Perfil de Usuario',
      description: 'Página personal donde el usuario puede visualizar y gestionar su información de perfil, como nombre, foto, y cambiar su contraseña.',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-(--color-background)">
      {/* Header with Logo and Back Button */}
      <header className="w-full py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Volver</span>
          </Link>
          
          <div className="flex-1 flex justify-center">
            <Link to="/">
              <img src="/logo.svg" alt="TalkHub Logo" className="h-8 md:h-12 lg:h-[60px] w-auto" />
            </Link>
          </div>
          
          {/* Spacer to balance the back button */}
          <div className="w-[72px]"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Title Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Mapa del Sitio</h1>
          <p className="text-base md:text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Una lista completa de todas las páginas y modales dentro de la aplicación para una fácil referencia.
          </p>
        </section>

        {/* Unprotected Pages Section */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Vistas Desprotegidas</h2>
          <div className="space-y-4">
            {unprotectedPages.map((page) => (
              <PageCard
                key={page.title}
                title={page.title}
                description={page.description}
                icon={page.icon}
                to={page.to}
              />
            ))}
          </div>
        </section>

        {/* Protected Pages Section */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Vistas Protegidas</h2>
          <div className="space-y-4">
            {protectedPages.map((page) => (
              <PageCard
                key={page.title}
                title={page.title}
                description={page.description}
                icon={page.icon}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
