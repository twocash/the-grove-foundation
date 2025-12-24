// src/workspace/Inspector.tsx
// Right column - contextual detail panel

import { useWorkspaceUI } from './WorkspaceUIContext';
import { LensInspector } from '../explore/LensInspector';
import { JourneyInspector } from '../explore/JourneyInspector';
import { DiaryInspector } from '../explore/DiaryInspector';
import { SproutInspector } from '../cultivate/SproutInspector';

export function Inspector() {
  const { inspector, closeInspector } = useWorkspaceUI();

  if (!inspector.isOpen) {
    return null;
  }

  const getTitle = () => {
    switch (inspector.mode.type) {
      case 'lens': return 'Lens Inspector';
      case 'node': return 'Node Inspector';
      case 'journey': return 'Journey Inspector';
      case 'sprout': return 'Sprout Inspector';
      case 'diary': return 'Diary Inspector';
      case 'diary-entry': return 'Diary Entry';
      case 'chat-context': return 'Chat Context';
      default: return 'Inspector';
    }
  };

  const renderContent = () => {
    switch (inspector.mode.type) {
      case 'none':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <span className="material-symbols-outlined text-4xl text-slate-400 mb-4">visibility</span>
            <p className="text-slate-500 dark:text-slate-400">
              Select an item to view its details
            </p>
          </div>
        );

      case 'lens':
        return <LensInspector personaId={inspector.mode.lensId} />;

      case 'node':
        return (
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-slate-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">account_tree</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Node</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{inspector.mode.nodeId}</p>
              </div>
            </div>
            <div className="p-4 bg-stone-50 dark:bg-slate-900 rounded-lg border border-border-light dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Node details coming soon
              </p>
            </div>
          </div>
        );

      case 'journey':
        return <JourneyInspector journeyId={inspector.mode.journeyId} />;

      case 'sprout':
        return <SproutInspector sproutId={inspector.mode.sproutId} />;

      case 'diary':
        return <DiaryInspector entryId={inspector.mode.entryId} />;

      case 'diary-entry':
        return (
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-slate-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">book</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Diary Entry</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{inspector.mode.entryId}</p>
              </div>
            </div>
            <div className="p-4 bg-stone-50 dark:bg-slate-900 rounded-lg border border-border-light dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Entry details coming soon
              </p>
            </div>
          </div>
        );

      case 'chat-context':
        return (
          <div className="p-5 space-y-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">chat</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Chat Context</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Current session info</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-stone-50 dark:bg-slate-900 rounded-lg border border-border-light dark:border-slate-700">
                <div className="text-xs text-slate-500 uppercase mb-1">Active Lens</div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {inspector.mode.context.activeLens || 'None'}
                </div>
              </div>

              <div className="p-4 bg-stone-50 dark:bg-slate-900 rounded-lg border border-border-light dark:border-slate-700">
                <div className="text-xs text-slate-500 uppercase mb-1">Session</div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {inspector.mode.context.sessionMinutes}m • {inspector.mode.context.exchangeCount} exchanges
                </div>
              </div>

              <div className="p-4 bg-stone-50 dark:bg-slate-900 rounded-lg border border-border-light dark:border-slate-700">
                <div className="text-xs text-slate-500 uppercase mb-1">Loaded Context</div>
                <div className="text-sm text-slate-700 dark:text-slate-300">
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
    <aside className="w-80 flex flex-col bg-surface-light dark:bg-background-dark/50 border-l border-border-light dark:border-border-dark flex-shrink-0">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border-light dark:border-border-dark">
        <span className="font-medium text-sm text-slate-700 dark:text-slate-200">{getTitle()}</span>
        <button
          onClick={closeInspector}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </aside>
  );
}
