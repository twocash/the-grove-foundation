// src/shared/inspector/DiffPreview.tsx
// Visual diff display for proposed changes

import type { JsonPatch } from '@core/copilot';
import { getValueAtPath } from '@core/copilot';
import type { GroveObject } from '@core/schema/grove-object';

interface DiffPreviewProps {
  patch: JsonPatch;
  object: GroveObject;
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return JSON.stringify(value);
  return JSON.stringify(value);
}

export function DiffPreview({ patch, object }: DiffPreviewProps) {
  return (
    <div className="mt-2 bg-[var(--copilot-diff-bg)] border border-slate-800 rounded p-2 font-mono text-[10px] overflow-x-auto">
      {patch.map((op, i) => {
        const currentValue = getValueAtPath(object, op.path);

        return (
          <div key={i} className="space-y-1">
            {/* Show old value for replace/remove */}
            {(op.op === 'replace' || op.op === 'remove') && currentValue !== undefined && (
              <div className="flex gap-2 opacity-60 line-through decoration-[var(--copilot-diff-remove)]">
                <span className="text-[var(--copilot-diff-remove)]">-</span>
                <span className="text-slate-400">
                  {truncate(formatValue(currentValue), 60)}
                </span>
              </div>
            )}

            {/* Show new value for add/replace */}
            {(op.op === 'add' || op.op === 'replace') && op.value !== undefined && (
              <div className="flex gap-2">
                <span className="text-[var(--copilot-diff-add)]">+</span>
                <span className="text-[var(--copilot-diff-add)]">
                  {truncate(formatValue(op.value), 60)}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
