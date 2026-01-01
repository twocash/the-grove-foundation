// src/shared/layout/ThreeColumnLayout.tsx
// Reusable three-column layout primitive for workspace-style pages

import { type ReactNode } from 'react';

interface ThreeColumnLayoutProps {
  /** Left navigation column content (optional - omit for two-column layout) */
  navigation?: ReactNode;
  /** Center content area */
  content: ReactNode;
  /** Right inspector panel content (optional) */
  inspector?: ReactNode;
  /** Whether inspector is open */
  inspectorOpen?: boolean;
  /** Navigation column width in pixels */
  navWidth?: number;
  /** Inspector column width in pixels */
  inspectorWidth?: number;
  /** Additional className for the container */
  className?: string;
  /** Header content (rendered above the columns) */
  header?: ReactNode;
}

export function ThreeColumnLayout({
  navigation,
  content,
  inspector,
  inspectorOpen = true,
  navWidth = 240,
  inspectorWidth = 320,
  className = '',
  header,
}: ThreeColumnLayoutProps) {
  return (
    <div className={`flex flex-col h-screen overflow-hidden bg-[var(--glass-void)] ${className}`}>
      {/* Header */}
      {header}

      {/* Three columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation (optional) */}
        {navigation && (
          <aside
            style={{ width: navWidth }}
            className="flex-shrink-0 border-r border-[var(--glass-border)] overflow-y-auto bg-[var(--glass-solid)]"
          >
            {navigation}
          </aside>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-[var(--glass-void)]">
          {content}
        </main>

        {/* Inspector */}
        {inspector && inspectorOpen && (
          <aside
            style={{ width: inspectorWidth }}
            className="flex-shrink-0 border-l border-[var(--glass-border)] overflow-y-auto bg-[var(--glass-solid)]"
          >
            {inspector}
          </aside>
        )}
      </div>
    </div>
  );
}
