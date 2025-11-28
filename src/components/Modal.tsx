import React, { useEffect, useRef } from 'react';

interface ModalProps {
  /**
   * Whether the modal is open or closed
   */
  isOpen: boolean;
  /**
   * Function to close the modal
   */
  onClose: () => void;
  /**
   * Modal content
   */
  children: React.ReactNode;
  /**
   * Aria label for accessibility
   */
  ariaLabel?: string;
}

/**
 * Modal Component
 * Base modal component with backdrop and centered content
 * Provides consistent styling for all modal dialogs
 * Implements WCAG accessibility with keyboard navigation and focus trapping
 */
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, ariaLabel = "Diálogo modal" }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!isOpen) {
      isInitialMount.current = true;
      return;
    }

    // Only save focus and focus modal on initial open
    if (isInitialMount.current) {
      // Save the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the modal container (but not force focus away from inputs)
      // We use a small timeout to allow the modal to render first
      setTimeout(() => {
        if (modalRef.current && !modalRef.current.contains(document.activeElement)) {
          modalRef.current.focus();
        }
      }, 0);
      
      isInitialMount.current = false;
    }

    // Handle Escape key to close modal
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Trap focus within modal
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTabKey);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTabKey);
      
      // Restore focus to previous element only when closing
      if (!isOpen && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        ref={modalRef}
        className="bg-(--color-container) rounded-2xl max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
};