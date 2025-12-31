// src/bedrock/BedrockWorkspace.tsx
// Main Bedrock workspace shell with routing
// Sprint: bedrock-foundation-v1

import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BedrockUIProvider, useBedrockUI } from './context/BedrockUIContext';
import { BedrockCopilotProvider, useBedrockCopilot } from './context/BedrockCopilotContext';
import { BedrockLayout } from './primitives/BedrockLayout';
import { BedrockNav } from './primitives/BedrockNav';
import { BedrockCopilot } from './primitives/BedrockCopilot';
import { BEDROCK_NAV_ITEMS, CONSOLE_METADATA, getCopilotActionsForConsole } from './config';

// =============================================================================
// Inner Workspace (uses contexts)
// =============================================================================

function BedrockWorkspaceInner() {
  const location = useLocation();
  const { inspectorOpen, setActiveConsole } = useBedrockUI();
  const { setContext, setAvailableActions } = useBedrockCopilot();

  // Determine current console from path
  const currentConsoleId = getConsoleIdFromPath(location.pathname);
  const consoleMetadata = CONSOLE_METADATA[currentConsoleId] ?? CONSOLE_METADATA.dashboard;

  // Update context when console changes
  useEffect(() => {
    setActiveConsole(currentConsoleId);
    setContext({ consoleId: currentConsoleId });
    setAvailableActions(getCopilotActionsForConsole(currentConsoleId));
  }, [currentConsoleId, setActiveConsole, setContext, setAvailableActions]);

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
        />
      }
      content={<Outlet />}
      inspector={null} // Populated by child routes
      copilot={<BedrockCopilot />}
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
  // /bedrock -> dashboard
  // /bedrock/garden -> garden
  // /bedrock/lenses -> lenses
  if (segments.length <= 1) return 'dashboard';
  return segments[1] || 'dashboard';
}

export default BedrockWorkspace;
