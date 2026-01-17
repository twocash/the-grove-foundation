// src/bedrock/BedrockWorkspace.tsx
// Main Bedrock workspace shell with routing and inspector management
// Sprint: bedrock-foundation-v1, hotfix/console-factory

import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BedrockUIProvider, useBedrockUI } from './context/BedrockUIContext';
import { BedrockCopilotProvider, useBedrockCopilot } from './context/BedrockCopilotContext';
import { BedrockLayout } from './primitives/BedrockLayout';
import { BedrockNav } from './primitives/BedrockNav';
import { BedrockInspector } from './primitives/BedrockInspector';
import { MetricsToggle } from './components/MetricsToggle';
import { BEDROCK_NAV_ITEMS, CONSOLE_METADATA, getCopilotActionsForConsole } from './config';

// =============================================================================
// Inner Workspace (uses contexts)
// =============================================================================

function BedrockWorkspaceInner() {
  const location = useLocation();

  // UI context - includes inspector state
  const {
    inspectorOpen,
    inspectorTitle,
    inspectorSubtitle,
    inspectorIcon,
    inspectorContent,
    copilotContent,
    closeInspector,
    setActiveConsole,
  } = useBedrockUI();

  // Copilot context
  const { setContext, setAvailableActions } = useBedrockCopilot();

  // Determine current console from path
  const currentConsoleId = getConsoleIdFromPath(location.pathname);
  const consoleMetadata = CONSOLE_METADATA[currentConsoleId] ?? CONSOLE_METADATA.dashboard;

  // Update context when console changes
  useEffect(() => {
    setActiveConsole(currentConsoleId);
    setContext({ consoleId: currentConsoleId });
    setAvailableActions(getCopilotActionsForConsole(currentConsoleId));

    // Close inspector when navigating to a different console
    closeInspector();
  }, [currentConsoleId, setActiveConsole, setContext, setAvailableActions, closeInspector]);

  return (
    <BedrockLayout
      consoleId={currentConsoleId}
      title={consoleMetadata.title}
      description={consoleMetadata.description}
      navigation={
        <BedrockNav
          items={BEDROCK_NAV_ITEMS}
          consoleId={currentConsoleId}
          header={
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-primary">hub</span>
              <span className="font-semibold text-foreground-light dark:text-foreground-dark">
                Bedrock
              </span>
            </div>
          }
          footer={<MetricsToggle />}
        />
      }
      content={<Outlet key={location.pathname} />}
      // Inspector from context (registered by consoles)
      inspector={
        inspectorOpen && inspectorContent ? (
          <BedrockInspector
            title={inspectorTitle}
            subtitle={inspectorSubtitle}
            icon={inspectorIcon}
            onClose={closeInspector}
          >
            {inspectorContent}
          </BedrockInspector>
        ) : undefined
      }
      // Copilot from context (registered by consoles)
      copilot={copilotContent}
      inspectorOpen={inspectorOpen}
    />
  );
}

// =============================================================================
// Main Export (wraps with providers)
// =============================================================================

export function BedrockWorkspace() {
  return (
    <BedrockUIProvider>
      <BedrockCopilotProvider>
        <BedrockWorkspaceInner />
      </BedrockCopilotProvider>
    </BedrockUIProvider>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function getConsoleIdFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 1) return 'dashboard';
  return segments[1] || 'dashboard';
}

export default BedrockWorkspace;
