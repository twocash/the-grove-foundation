// CTAModal - Generic modal wrapper for conversion CTAs
// Provides consistent styling and close behavior

import React, { useEffect, useCallback } from 'react';

interface CTAModalProps {
  children: React.ReactNode;
  onClose: () => void;
}

const CTAModal: React.FC<CTAModalProps> = ({ children, onClose }) => {
  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md mx-4 bg-paper rounded-lg shadow-xl animate-fade-in">
        {children}
      </div>
    </div>
  );
};

export default CTAModal;
