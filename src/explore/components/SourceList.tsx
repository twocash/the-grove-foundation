// src/explore/components/SourceList.tsx
// Animated source discovery list
// Sprint: progress-streaming-ui-v1

import type { ProgressSource } from '../hooks/useResearchProgress';

interface SourceListProps {
  sources: ProgressSource[];
  maxVisible?: number;
  onSourceClick?: (url: string) => void;
}

const MAX_VISIBLE_DEFAULT = 8;

export function SourceList({
  sources,
  maxVisible = MAX_VISIBLE_DEFAULT,
  onSourceClick,
}: SourceListProps) {
  const visibleSources = sources.slice(-maxVisible);
  const hiddenCount = Math.max(0, sources.length - maxVisible);

  if (sources.length === 0) {
    return (
      <div className="text-sm text-slate-400 dark:text-slate-500 italic py-2">
        No sources discovered yet...
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {/* Source count header */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="material-symbols-outlined text-sm">link</span>
        <span>Found {sources.length} source{sources.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Source list */}
      <div className="space-y-1">
        {visibleSources.map((source, index) => (
          <SourceItem
            key={`${source.url}-${index}`}
            source={source}
            isNew={index === visibleSources.length - 1}
            onClick={() => onSourceClick?.(source.url)}
          />
        ))}
      </div>

      {/* Hidden count indicator */}
      {hiddenCount > 0 && (
        <div className="text-xs text-purple-600 dark:text-purple-400">
          +{hiddenCount} more source{hiddenCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

interface SourceItemProps {
  source: ProgressSource;
  isNew: boolean;
  onClick?: () => void;
}

function SourceItem({ source, isNew, onClick }: SourceItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-2 px-2 py-1.5 rounded-lg
        text-left text-sm transition-all
        hover:bg-slate-100 dark:hover:bg-slate-800
        ${isNew ? 'animate-slide-in-left' : ''}
      `}
    >
      {/* Domain badge */}
      <span className="shrink-0 px-1.5 py-0.5 text-xs font-mono rounded
                       bg-slate-100 dark:bg-slate-800
                       text-slate-600 dark:text-slate-400">
        {source.domain}
      </span>

      {/* Title (truncated) */}
      <span className="flex-1 truncate text-slate-700 dark:text-slate-300">
        {source.title.slice(0, 40)}
        {source.title.length > 40 ? '...' : ''}
      </span>

      {/* External link icon */}
      <span className="material-symbols-outlined text-slate-400 text-sm shrink-0">
        open_in_new
      </span>
    </button>
  );
}

export default SourceList;
