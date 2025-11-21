import React from 'react';
import { Link } from 'react-router';
import { Button } from '../components/Button';
import { MosaicBackground } from '../components/MosaicBackground';

/**
 * HomePage Component
 * Landing page with hero section, mosaic background, and call-to-action buttons
 * Features responsive design for desktop, tablet, and mobile devices
 */
export const HomePage: React.FC = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-(--color-background)">
      {/* Mosaic Background */}
      <MosaicBackground />

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col justify-center items-center py-5">
        {/* Navbar with Logo */}
        <nav className="flex justify-center bg-transparent">
            <img 
              src="/logo.svg" 
              alt="TalkHub Logo" 
              className="h-8 w-auto md:h-14"
            />
        </nav>

        {/* Hero Section */}
        <div className="flex flex-1 flex-col items-center justify-center sm:px-6 lg:px-8">
          <div className="flex flex-col w-full max-w-3xl text-center gap-5">
            {/* Main Heading */}
            <h2 className="text-[40px] font-bold leading-none text-white sm:text-6xl md:text-7xl">
              Bienvenido a<br />TalkHub
            </h2>

            {/* Description */}
            <p className="text-sm text-gray-300 sm:text-lg md:text-xl">
              Tu plataforma para conferencias de video sin<br className="hidden sm:block" />
              interrupciones y colaboraciones fluidas.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button to="/login">Iniciar Sesión</Button>
              <Button to="/register">Registrarse</Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="h-fit bg-transparent">
          <div className="flex gap-12 text-sm font-medium text-white">
              <Link
                to="/about"
                className="text-base transition-colors hover:text-gray-300 focus:outline-none"
              >
                Sobre nosotros
              </Link>
              <Link
                to="/sitemap"
                className="text-base transition-colors hover:text-gray-300 focus:outline-none"
              >
                Mapa del sitio
              </Link>
            </div>
        </footer>
      </div>
    </div>
  );
};
