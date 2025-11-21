import React from "react";
import { Link } from "react-router";

interface ButtonProps {
  /**
   * The destination URL for the button link
   */
  to: string;
  /**
   * The text content to display inside the button
   */
  children: React.ReactNode;
  /**
   * Optional additional CSS classes
   */
  className?: string;
}

/**
 * Button Component
 * Reusable button component with consistent styling across the application
 * Features responsive design with different sizes for mobile, tablet, and desktop
 *
 * @param to - Route destination
 * @param children - Button label text
 * @param className - Additional CSS classes (optional)
 */
export const Button: React.FC<ButtonProps> = ({
  to,
  children,
  className = "",
}) => {
  return (
    <Link
      to={to}
      className={`
        w-full max-w-[288px] sm:w-auto
        h-10 sm:h-12
        px-6 sm:px-10
        flex items-center justify-center
        rounded-lg
        bg-(--color-primary)
        text-base font-normal text-white
        shadow-lg
        transition-all
        hover:bg-(--color-primary-hover)
        focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent
        ${className}
      `}
      style={{ borderRadius: "8px" }}
    >
      {children}
    </Link>
  );
};
