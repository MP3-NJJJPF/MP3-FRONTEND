import React from 'react';
import { Link } from 'react-router';

interface PageCardProps {
  /**
   * Page title/name
   */
  title: string;
  /**
   * Description of the page and its actions
   */
  description: string;
  /**
   * SVG icon component
   */
  icon: React.ReactNode;
  /**
   * Optional route path for navigation. If provided, the card becomes clickable.
   */
  to?: string;
}

/**
 * PageCard Component
 * Displays a page card with an icon, title, and description for the sitemap
 * Features a rounded icon container on the left with page details on the right
 * Can be made clickable by providing a 'to' prop for navigation
 */
export const PageCard: React.FC<PageCardProps> = ({ title, description, icon, to }) => {
  const content = (
    <>
      {/* Icon Container */}
      <div className="shrink-0 w-12 h-12 bg-(--color-primary) rounded-lg flex items-center justify-center">
        {icon}
      </div>
      
      {/* Content */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
      </div>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="flex items-center gap-4 p-4 bg-(--color-container) rounded-lg hover:bg-(--color-container)/80 transition-colors cursor-pointer"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-(--color-container) rounded-lg opacity-60">
      {content}
    </div>
  );
};
