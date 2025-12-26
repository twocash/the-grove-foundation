// src/shared/inspector/CopilotMessage.tsx
// Individual message component for Copilot chat

import type { CopilotMessage as CopilotMessageType } from '@core/copilot';
import { DiffPreview } from './DiffPreview';
import type { GroveObject } from '@core/schema/grove-object';

interface CopilotMessageProps {
  message: CopilotMessageType;
  object: GroveObject;
  onApply?: () => void;
  onRetry?: () => void;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function CopilotMessage({ message, object, onApply, onRetry }: CopilotMessageProps) {
  const isAssistant = message.role === 'assistant';
  const hasPendingPatch = message.patch && message.patchStatus === 'pending';

  return (
    <div className={`flex gap-2 ${isAssistant ? '' : 'justify-end'}`}>
      {isAssistant && (
        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5 shadow-lg shadow-indigo-500/20">
          <span className="material-symbols-outlined text-white text-xs">smart_toy</span>
        </div>
      )}

      <div className={`flex flex-col gap-1 ${isAssistant ? 'max-w-[90%]' : 'items-end max-w-[90%]'}`}>
        <div
          className={`rounded-lg p-2.5 text-xs leading-relaxed shadow-sm ${
            isAssistant
              ? 'bg-[var(--copilot-msg-assistant-bg)] border border-[var(--copilot-msg-assistant-border)] rounded-tl-none text-slate-300'
              : 'bg-[var(--copilot-msg-user-bg)] border border-[var(--copilot-msg-user-border)] rounded-tr-none text-white'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>

          {/* Diff Preview */}
          {message.patch && message.patch.length > 0 && (
            <DiffPreview patch={message.patch} object={object} />
          )}

          {/* Action Buttons */}
          {hasPendingPatch && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={onApply}
                className="flex items-center gap-1 bg-[var(--copilot-btn-primary)] hover:bg-[var(--copilot-btn-primary-hover)] text-white px-2 py-1 rounded text-[10px] transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-xs">check</span>
                Apply
              </button>
              <button
                onClick={onRetry}
                className="flex items-center gap-1 bg-[var(--copilot-btn-secondary)] hover:bg-[var(--copilot-btn-secondary-hover)] text-slate-300 px-2 py-1 rounded text-[10px] border border-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-xs">refresh</span>
                Retry
              </button>
            </div>
          )}

          {/* Applied indicator */}
          {message.patchStatus === 'applied' && (
            <div className="flex items-center gap-1 mt-2 text-green-400 text-[10px]">
              <span className="material-symbols-outlined text-xs">check_circle</span>
              Applied
            </div>
          )}
        </div>

        <div className="text-[10px] text-slate-600">
          {formatTimestamp(message.timestamp)}
        </div>
      </div>

      {!isAssistant && (
        <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-slate-300 text-xs">person</span>
        </div>
      )}
    </div>
  );
}
