// src/surface/components/modals/SproutFinishingRoom/SproutFinishingRoom.tsx
// Sprint: S1-SFR-Shell - US-A001 Modal Container Shell
// Three-column modal workspace for inspecting and refining research artifacts

import React, { useEffect, useRef, useCallback } from 'react';
import type { Sprout } from '@core/schema/sprout';
import { FinishingRoomHeader } from './FinishingRoomHeader';
import { FinishingRoomStatus } from './FinishingRoomStatus';
import { ProvenancePanel } from './ProvenancePanel';
import { DocumentViewer } from './DocumentViewer';
import { ActionPanel } from './ActionPanel';

export interface SproutFinishingRoomProps {
  sprout: Sprout;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * SproutFinishingRoom - Three-column modal workspace
 *
 * US-A001: Modal opens with proper overlay
 * US-A002: Three-column layout renders
 * US-A003: Close via button or Escape
 * US-A004: Status bar displays metadata
 */
export const SproutFinishingRoom: React.FC<SproutFinishingRoomProps> = ({
  sprout,
  isOpen,
  onClose
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // US-A003: Escape key closes modal
  // Hook must be called unconditionally per Rules of Hooks
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // US-A001: Prevent body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // US-A003: Focus trap - focus close button on mount
  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
  }, [isOpen]);

  // US-A001: Modal respects isOpen prop - early return AFTER hooks
  if (!isOpen) {
    return null;
  }

  // US-A003: Focus trap implementation
  const handleKeyDownTrap = useCallback((event: React.KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift+Tab: if on first element, go to last
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: if on last element, go to first
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, []);

  // US-A001: Clicking backdrop calls onClose
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const headerId = 'finishing-room-title';

  return (
    // US-A001: Modal overlay with semi-transparent backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDownTrap}
      role="presentation"
    >
      {/* Modal container - centered in viewport */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headerId}
        className="relative flex flex-col w-[95vw] max-w-[1400px] h-[90vh] bg-paper dark:bg-ink rounded-lg shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <FinishingRoomHeader
          sprout={sprout}
          headerId={headerId}
          onClose={onClose}
          closeButtonRef={closeButtonRef}
        />

        {/* US-A002: Three-column layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left column - Provenance Panel (280px fixed) */}
          <ProvenancePanel sprout={sprout} />

          {/* Center column - Document Viewer (flex: 1) */}
          <DocumentViewer sprout={sprout} />

          {/* Right column - Action Panel (320px fixed) */}
          <ActionPanel sprout={sprout} />
        </div>

        {/* US-A004: Status bar footer */}
        <FinishingRoomStatus sprout={sprout} />
      </div>
    </div>
  );
};

export default SproutFinishingRoom;
