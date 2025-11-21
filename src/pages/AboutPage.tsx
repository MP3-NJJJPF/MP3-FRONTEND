import React from 'react';
import { Link } from 'react-router';
import { MemberCard } from '../components/MemberCard';

/**
 * AboutPage Component
 * Displays information about CodeGoat (TalkHub) and the team members
 * Features responsive grid layout for team cards
 */
export const AboutPage: React.FC = () => {
  const teamMembers = [
    { name: 'Jean Pierre Cardenas', role: 'Frontend', image: '/images/team/jean.jpg' },
    { name: 'Nathalia Ortiz', role: 'Product Owner', image: '/images/team/nathalia.jpg' },
    { name: 'Juan Esteban Ortiz', role: 'Pruebas', image: '/images/team/juan-esteban.jpg' },
    { name: 'Juan David Olaya', role: 'Backend', image: '/images/team/juan-david.jpg' },
    { name: 'Fernando Cardona', role: 'Backend y BD', image: '/images/team/fernando.jpg' },
    { name: 'Pablo Esteban Becerra', role: 'Backend', image: '/images/team/pablo.jpg' },
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
        {/* About Section */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Sobre CodeGoat</h1>
          <p className="text-base md:text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Una breve y atractiva introducción a la marca CodeGoat, destacando nuestra misión, valores y nuestro compromiso de revolucionar las videoconferencias con TalkHub.
          </p>
        </section>

        {/* Divider */}
        <hr className="border-t border-(--color-border) mb-16" />

        {/* Team Section */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">Nuestro Equipo</h2>
          <p className="text-base text-gray-400 text-center mb-12 max-w-3xl mx-auto">
            Conoce a los individuos talentosos y dedicados que forman la columna vertebral de CodeGoat. Nuestro diverso equipo de expertos trabaja en colaboración para hacer realidad la visión de TalkHub.
          </p>

          {/* Team Grid - 3 columns on desktop, 2 on tablet, 1 on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {teamMembers.map((member) => (
              <MemberCard
                key={member.name}
                name={member.name}
                role={member.role}
                image={member.image}
              />
            ))}
          </div>
        </section>

        {/* Bottom Divider */}
        <hr className="border-t border-(--color-border) mt-16" />
      </main>
    </div>
  );
};