// src/workspace/GroveWorkspace.tsx
// Three-column workspace container

import type { NavigationPath } from '@core/schema/workspace';
import { WorkspaceUIProvider } from './WorkspaceUIContext';
import { WorkspaceHeader } from './WorkspaceHeader';
import { NavigationSidebar } from './NavigationSidebar';
import { ContentRouter } from './ContentRouter';
import { Inspector } from './Inspector';
import { CommandPalette } from './CommandPalette';

interface GroveWorkspaceProps {
  initialPath?: NavigationPath;
}

/**
 * Grove Workspace - Three-column layout for exploring Grove
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  Header                                                                  │
 * ├────────────┬─────────────────────────────────────────┬──────────────────┤
 * │ Navigation │ Content                                 │ Inspector        │
 * │ (240px)    │ (flex-1)                                │ (360px)          │
 * └────────────┴─────────────────────────────────────────┴──────────────────┘
 *
 * Usage:
 * ```tsx
 * <GroveWorkspace />
 * <GroveWorkspace initialPath={['explore', 'chat']} />
 * ```
 */
export function GroveWorkspace({ initialPath }: GroveWorkspaceProps) {
  return (
    <WorkspaceUIProvider initialPath={initialPath}>
      <div className="grove-workspace flex flex-col h-screen bg-[var(--grove-bg)] text-[var(--grove-text)]">
        <WorkspaceHeader />
        <div className="flex-1 flex overflow-hidden">
          <NavigationSidebar />
          <ContentRouter />
          <Inspector />
        </div>
        <CommandPalette />
      </div>
    </WorkspaceUIProvider>
  );
}
