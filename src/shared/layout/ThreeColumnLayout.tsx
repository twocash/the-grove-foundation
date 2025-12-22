// src/shared/layout/ThreeColumnLayout.tsx
// Reusable three-column layout primitive for workspace-style pages

import { type ReactNode } from 'react';

interface ThreeColumnLayoutProps {
  /** Left navigation column content */
  navigation: ReactNode;
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
    <div className={`flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark ${className}`}>
      {/* Header */}
      {header}

      {/* Three columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation */}
        <aside
          style={{ width: navWidth }}
          className="flex-shrink-0 border-r border-border-light dark:border-border-dark overflow-y-auto bg-surface-light dark:bg-surface-dark"
        >
          {navigation}
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
          {content}
        </main>

        {/* Inspector */}
        {inspector && inspectorOpen && (
          <aside
            style={{ width: inspectorWidth }}
            className="flex-shrink-0 border-l border-border-light dark:border-border-dark overflow-y-auto bg-surface-light dark:bg-surface-dark"
          >
            {inspector}
          </aside>
        )}
      </div>
    </div>
  );
}
