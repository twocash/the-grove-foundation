// src/shared/layout/ContentContainer.tsx
// Shared layout wrapper for center-column content
// Ensures consistent max-width, centering, and padding across all views

import { type ReactNode } from 'react';

interface ContentContainerProps {
  /** Content to render */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Disable max-width constraint (for full-bleed content) */
  fullWidth?: boolean;
  /** Vertical padding amount */
  paddingY?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * ContentContainer - Consistent layout for center-column views
 * 
 * Provides:
 * - max-w-4xl (896px) content width
 * - Horizontal centering (mx-auto)
 * - Consistent horizontal padding (px-6)
 * - Configurable vertical padding
 * - Full-height scrollable container
 * 
 * Usage:
 * ```tsx
 * <ContentContainer>
 *   <h1>Page Title</h1>
 *   <div className="grid grid-cols-2 gap-4">...</div>
 * </ContentContainer>
 * ```
 */
export function ContentContainer({ 
  children, 
  className = '',
  fullWidth = false,
  paddingY = 'md'
}: ContentContainerProps) {
  const paddingClasses = {
    none: '',
    sm: 'py-4',
    md: 'py-6',
    lg: 'py-8'
  };

  return (
    <div className={`h-full overflow-y-auto ${paddingClasses[paddingY]} ${className}`}>
      <div className={`px-6 ${fullWidth ? '' : 'max-w-4xl mx-auto'}`}>
        {children}
      </div>
    </div>
  );
}
