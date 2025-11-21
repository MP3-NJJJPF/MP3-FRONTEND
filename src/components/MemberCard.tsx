import React from 'react';

interface MemberCardProps {
  /**
   * Team member's name
   */
  name: string;
  /**
   * Team member's role in the project
   */
  role: string;
  /**
   * Path to the team member's image
   */
  image: string;
}

/**
 * MemberCard Component
 * Displays a team member's card with image, name, and role
 * Features consistent styling with hover effects
 */
export const MemberCard: React.FC<MemberCardProps> = ({ name, role, image }) => {
  return (
    <div className="flex flex-col bg-(--color-container) rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105">
      {/* Image Container */}
      <div className="w-full aspect-3/4 overflow-hidden">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Info Container */}
      <div className="p-4 bg-(--color-container)">
        <h3 className="text-lg font-semibold text-white mb-1">{name}</h3>
        <p className="text-sm text-gray-400">{role}</p>
      </div>
    </div>
  );
};
