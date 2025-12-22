// src/workspace/Inspector.tsx
// Right column - contextual detail panel

import { useWorkspaceUI } from './WorkspaceUIContext';
import { X } from 'lucide-react';

export function Inspector() {
  const { inspector, closeInspector } = useWorkspaceUI();

  if (!inspector.isOpen) {
    return null;
  }

  const renderContent = () => {
    switch (inspector.mode.type) {
      case 'none':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="text-4xl mb-4">👀</div>
            <p className="text-[var(--grove-text-muted)]">
              Select an item to view its details
            </p>
          </div>
        );

      case 'node':
        return (
          <div className="p-4">
            <h3 className="font-medium text-[var(--grove-text)] mb-2">Node Details</h3>
            <p className="text-sm text-[var(--grove-text-muted)]">
              Node ID: {inspector.mode.nodeId}
            </p>
            {/* TODO: Fetch and display node details */}
          </div>
        );

      case 'journey':
        return (
          <div className="p-4">
            <h3 className="font-medium text-[var(--grove-text)] mb-2">Journey Details</h3>
            <p className="text-sm text-[var(--grove-text-muted)]">
              Journey ID: {inspector.mode.journeyId}
            </p>
            {/* TODO: Fetch and display journey details */}
          </div>
        );

      case 'lens':
        return (
          <div className="p-4">
            <h3 className="font-medium text-[var(--grove-text)] mb-2">Lens Details</h3>
            <p className="text-sm text-[var(--grove-text-muted)]">
              Lens ID: {inspector.mode.lensId}
            </p>
            {/* TODO: Fetch and display lens details */}
          </div>
        );

      case 'sprout':
        return (
          <div className="p-4">
            <h3 className="font-medium text-[var(--grove-text)] mb-2">Sprout Details</h3>
            <p className="text-sm text-[var(--grove-text-muted)]">
              Sprout ID: {inspector.mode.sproutId}
            </p>
            {/* TODO: Fetch and display sprout details */}
          </div>
        );

      case 'diary-entry':
        return (
          <div className="p-4">
            <h3 className="font-medium text-[var(--grove-text)] mb-2">Diary Entry</h3>
            <p className="text-sm text-[var(--grove-text-muted)]">
              Entry ID: {inspector.mode.entryId}
            </p>
            {/* TODO: Fetch and display entry details */}
          </div>
        );

      case 'chat-context':
        return (
          <div className="p-4">
            <h3 className="font-medium text-[var(--grove-text)] mb-4">Chat Context</h3>

            <div className="space-y-4">
              <div>
                <div className="text-xs text-[var(--grove-text-dim)] uppercase mb-1">Active Lens</div>
                <div className="text-sm text-[var(--grove-text)]">
                  {inspector.mode.context.activeLens || 'None'}
                </div>
              </div>

              <div>
                <div className="text-xs text-[var(--grove-text-dim)] uppercase mb-1">Session</div>
                <div className="text-sm text-[var(--grove-text)]">
                  {inspector.mode.context.sessionMinutes}m • {inspector.mode.context.exchangeCount} exchanges
                </div>
              </div>

              <div>
                <div className="text-xs text-[var(--grove-text-dim)] uppercase mb-1">Loaded Context</div>
                <div className="text-sm text-[var(--grove-text-muted)]">
                  {inspector.mode.context.loadedRagFiles.length > 0
                    ? inspector.mode.context.loadedRagFiles.join(', ')
                    : 'No files loaded'
                  }
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <aside className="w-[360px] flex flex-col bg-[var(--grove-bg)] border-l border-[var(--grove-border)]">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-[var(--grove-border)]">
        <span className="text-sm font-medium text-[var(--grove-text)]">Inspector</span>
        <button
          onClick={closeInspector}
          className="p-1 text-[var(--grove-text-muted)] hover:text-[var(--grove-text)] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </aside>
  );
}
