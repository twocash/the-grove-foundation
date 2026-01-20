// src/bedrock/primitives/BedrockLayout.tsx
// Main layout primitive for Bedrock consoles
// Sprint: bedrock-foundation-v1, bedrock-alignment-v1 (Quantum Glass)

import React, { type ReactNode } from 'react';
import { ThreeColumnLayout } from '../../shared/layout';

// =============================================================================
// Types
// =============================================================================

interface BedrockLayoutProps {
  /** Unique console identifier for telemetry and context */
  consoleId: string;
  /** Console title displayed in header */
  title: string;
  /** Console description (subtitle) */
  description?: string;
  /** Header actions slot (buttons, search, etc.) */
  header?: ReactNode;
  /** Metrics row content (StatCards, etc.) */
  metrics?: ReactNode;
  /** Left navigation content (optional - omit for simpler layout) */
  navigation?: ReactNode;
  /** Main content area */
  content: ReactNode;
  /** Right inspector panel content */
  inspector?: ReactNode;
  /** Copilot panel content (renders below inspector) */
  copilot?: ReactNode;
  /** Whether inspector panel is open */
  inspectorOpen?: boolean;
  /** Navigation column width */
  navWidth?: number;
  /** Inspector column width */
  inspectorWidth?: number;
}

// =============================================================================
// Component
// =============================================================================

export function BedrockLayout({
  consoleId,
  title,
  description,
  header,
  metrics,
  navigation,
  content,
  inspector,
  copilot,
  inspectorOpen = true,
  navWidth = 240,
  inspectorWidth = 360,
}: BedrockLayoutProps) {
  return (
    <div className="bedrock-app flex flex-col h-screen" data-console-id={consoleId}>
      {/* Console Header */}
      <header className="h-14 px-6 flex items-center justify-between border-b border-[var(--glass-border)] bg-[var(--glass-solid)] flex-shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg font-semibold text-[var(--glass-text-primary)]">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-[var(--glass-text-muted)]">
                {description}
              </p>
            )}
          </div>
        </div>
        {header && (
          <div className="flex items-center gap-3">
            {header}
          </div>
        )}
      </header>

      {/* Metrics Row */}
      {metrics && (
        <div className="px-6 py-4 border-b border-[var(--glass-border)] bg-[var(--glass-solid)] flex-shrink-0">
          {metrics}
        </div>
      )}

      {/* Three Column Layout */}
      <ThreeColumnLayout
        navigation={navigation}
        content={content}
        inspector={
          inspectorOpen && (inspector || copilot) ? (
            <div className="flex flex-col h-full">
              {/* Inspector content */}
              {inspector && (
                <div className="flex-1 overflow-y-auto">
                  {inspector}
                </div>
              )}
              {/* Copilot panel */}
              {copilot && (
                <div className="border-t border-[var(--glass-border)] flex-shrink-0">
                  {copilot}
                </div>
              )}
            </div>
          ) : undefined
        }
        inspectorOpen={inspectorOpen && Boolean(inspector || copilot)}
        navWidth={navWidth}
        inspectorWidth={inspectorWidth}
      />
    </div>
  );
}

export default BedrockLayout;
