// src/surface/components/GroveObjectCard/HubContent.tsx
// Hub-specific content renderer for GroveObjectCard

import React from 'react';
import { TopicHub } from '@core/schema/narrative';
import { FileText, Tag, Zap } from 'lucide-react';

interface HubContentProps {
  hub: TopicHub;
}

export function HubContent({ hub }: HubContentProps) {
  const fileCount = 1 + (hub.supportingFiles?.length ?? 0);

  return (
    <div className="space-y-3">
      {/* Expert Framing (description) */}
      {hub.expertFraming && (
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
          {hub.expertFraming}
        </p>
      )}

      {/* Key Points */}
      {hub.keyPoints?.length > 0 && (
        <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
          {hub.keyPoints.slice(0, 3).map((point, i) => (
            <li key={i} className="flex items-start gap-2">
              <Zap className="w-3 h-3 mt-1 text-amber-500 flex-shrink-0" />
              <span className="line-clamp-1">{point}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Footer Info */}
      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        {/* File Count */}
        <span className="flex items-center gap-1">
          <FileText className="w-3 h-3" />
          {fileCount} {fileCount === 1 ? 'file' : 'files'}
        </span>

        {/* Priority */}
        <span className="flex items-center gap-1">
          Priority: {hub.priority}
        </span>

        {/* RAG Tags (first 2) */}
        {hub.tags?.length > 0 && (
          <span className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {hub.tags.slice(0, 2).join(', ')}
            {hub.tags.length > 2 && ` +${hub.tags.length - 2}`}
          </span>
        )}
      </div>
    </div>
  );
}
