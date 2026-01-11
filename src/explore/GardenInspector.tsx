// src/explore/GardenInspector.tsx
// Garden Inspector - Research sprout management panel
// Sprint: sprout-research-v1, Phase 4a
//
// Multi-purpose component:
// 1. Confirmation dialog when Prompt Architect is in 'confirming' state
// 2. Status-grouped list of research sprouts
// 3. Pulsing badge indicators for pending/blocked items

import { useState, useMemo, useCallback } from 'react';
import type { EditableManifest, PromptArchitectState } from './hooks/usePromptArchitect';
import type { ResearchBranch, ResearchStrategy } from '@core/schema/research-strategy';
import type { ResearchSprout, ResearchSproutStatus } from '@core/schema/research-sprout';
import {
  RESEARCH_SPROUT_STATUS_LABELS,
  RESEARCH_SPROUT_STATUS_ICONS,
  RESEARCH_SPROUT_STATUS_COLORS,
  FILTER_PRESETS,
  type FilterPresetId,
} from '@core/schema/research-sprout-registry';
import { useResearchSprouts } from './context/ResearchSproutContext';

// =============================================================================
// Types
// =============================================================================

export interface GardenInspectorProps {
  /** Current Prompt Architect state */
  architectState: PromptArchitectState;

  /** Inferred manifest when state is 'confirming' */
  manifest: EditableManifest | null;

  /** Human-readable summary of inference */
  summary: string | null;

  /** Error message when state is 'error' */
  error: string | null;

  /** Update manifest fields */
  onManifestUpdate: (updates: Partial<EditableManifest>) => void;

  /** Add a branch to the manifest */
  onAddBranch: (branch: ResearchBranch) => void;

  /** Remove a branch from the manifest */
  onRemoveBranch: (branchId: string) => void;

  /** Confirm and create the sprout */
  onConfirm: () => void;

  /** Cancel the flow */
  onCancel: () => void;

  /** Clear error state */
  onClearError: () => void;
}

type ViewMode = 'confirmation' | 'list';

// =============================================================================
// Component
// =============================================================================

export function GardenInspector({
  architectState,
  manifest,
  summary,
  error,
  onManifestUpdate,
  onAddBranch,
  onRemoveBranch,
  onConfirm,
  onCancel,
  onClearError,
}: GardenInspectorProps) {
  // Determine view mode based on state
  const viewMode: ViewMode = architectState === 'confirming' ? 'confirmation' : 'list';

  // Filter preset for list view
  const [filterPreset, setFilterPreset] = useState<FilterPresetId>('active');

  return (
    <div className="flex flex-col h-full bg-[var(--glass-solid)]">
      {/* Header */}
      <GardenInspectorHeader
        viewMode={viewMode}
        filterPreset={filterPreset}
        onFilterChange={setFilterPreset}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'confirmation' && manifest && (
          <ConfirmationView
            manifest={manifest}
            summary={summary}
            isProcessing={architectState === 'processing' || architectState === 'creating'}
            onManifestUpdate={onManifestUpdate}
            onAddBranch={onAddBranch}
            onRemoveBranch={onRemoveBranch}
          />
        )}

        {viewMode === 'list' && (
          <SproutListView filterPreset={filterPreset} />
        )}

        {error && (
          <ErrorBanner error={error} onDismiss={onClearError} />
        )}
      </div>

      {/* Footer - Only show in confirmation mode */}
      {viewMode === 'confirmation' && (
        <ConfirmationFooter
          isProcessing={architectState === 'processing' || architectState === 'creating'}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      )}
    </div>
  );
}

// =============================================================================
// Header Component
// =============================================================================

interface HeaderProps {
  viewMode: ViewMode;
  filterPreset: FilterPresetId;
  onFilterChange: (preset: FilterPresetId) => void;
}

function GardenInspectorHeader({ viewMode, filterPreset, onFilterChange }: HeaderProps) {
  return (
    <div className="px-4 py-3 border-b border-border-light dark:border-slate-700">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30
                        border border-border-light dark:border-slate-700
                        flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-lg">
            {viewMode === 'confirmation' ? 'science' : 'park'}
          </span>
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {viewMode === 'confirmation' ? 'New Research Sprout' : 'Research Garden'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {viewMode === 'confirmation'
              ? 'Review and confirm your research plan'
              : `Viewing ${FILTER_PRESETS[filterPreset].label.toLowerCase()}`}
          </p>
        </div>

        {/* Filter Chips (list mode only) */}
        {viewMode === 'list' && (
          <div className="flex gap-1">
            {Object.entries(FILTER_PRESETS).map(([id, preset]) => (
              <button
                key={id}
                onClick={() => onFilterChange(id as FilterPresetId)}
                className={`px-2 py-1 text-xs rounded-full transition-colors
                  ${filterPreset === id
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Confirmation View
// =============================================================================

interface ConfirmationViewProps {
  manifest: EditableManifest;
  summary: string | null;
  isProcessing: boolean;
  onManifestUpdate: (updates: Partial<EditableManifest>) => void;
  onAddBranch: (branch: ResearchBranch) => void;
  onRemoveBranch: (branchId: string) => void;
}

function ConfirmationView({
  manifest,
  summary,
  isProcessing,
  onManifestUpdate,
  onAddBranch,
  onRemoveBranch,
}: ConfirmationViewProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onManifestUpdate({ title: e.target.value });
  }, [onManifestUpdate]);

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onManifestUpdate({ notes: e.target.value });
  }, [onManifestUpdate]);

  const handleTagsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
    onManifestUpdate({ tags });
  }, [onManifestUpdate]);

  return (
    <div className="p-4 space-y-4">
      {/* Spark (Original Query) */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-slate-400 text-base mt-0.5">
            lightbulb
          </span>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Research Spark
            </p>
            <p className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed">
              {manifest.spark}
            </p>
          </div>
        </div>
      </div>

      {/* Summary (if available) */}
      {summary && (
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800/50">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-purple-500 text-base mt-0.5">
              auto_awesome
            </span>
            <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
              {summary}
            </p>
          </div>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
          Title
        </label>
        {isEditingTitle ? (
          <input
            type="text"
            value={manifest.title}
            onChange={handleTitleChange}
            onBlur={() => setIsEditingTitle(false)}
            autoFocus
            disabled={isProcessing}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900
                       border border-slate-300 dark:border-slate-600 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-purple-500/50
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
        ) : (
          <button
            onClick={() => setIsEditingTitle(true)}
            disabled={isProcessing}
            className="w-full px-3 py-2 text-sm text-left bg-white dark:bg-slate-900
                       border border-slate-300 dark:border-slate-600 rounded-lg
                       hover:border-purple-400 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {manifest.title || 'Click to add title...'}
          </button>
        )}
      </div>

      {/* Branches */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Research Branches ({manifest.branches.length})
          </label>
          <button
            onClick={() => onAddBranch({
              id: `branch-${Date.now()}`,
              label: 'New Branch',
              queries: [],
              priority: manifest.branches.length + 1,
              status: 'pending',
            })}
            disabled={isProcessing}
            className="text-xs text-purple-600 dark:text-purple-400 hover:underline
                       disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
          >
            + Add branch
          </button>
        </div>
        <div className="space-y-2">
          {manifest.branches.map((branch, index) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              index={index}
              isProcessing={isProcessing}
              onRemove={() => onRemoveBranch(branch.id)}
            />
          ))}
          {manifest.branches.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic py-2">
              No branches inferred. Add at least one to continue.
            </p>
          )}
        </div>
      </div>

      {/* Strategy Summary */}
      <StrategySummary strategy={manifest.strategy} />

      {/* Tags */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          value={manifest.tags.join(', ')}
          onChange={handleTagsChange}
          placeholder="e.g., ratchet, infrastructure, economics"
          disabled={isProcessing}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900
                     border border-slate-300 dark:border-slate-600 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-purple-500/50
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
          Notes (optional)
        </label>
        <textarea
          value={manifest.notes}
          onChange={handleNotesChange}
          placeholder="Add any additional context for the research agent..."
          rows={3}
          disabled={isProcessing}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900
                     border border-slate-300 dark:border-slate-600 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-purple-500/50
                     resize-none
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}

// =============================================================================
// Branch Card Component
// =============================================================================

interface BranchCardProps {
  branch: ResearchBranch;
  index: number;
  isProcessing: boolean;
  onRemove: () => void;
}

function BranchCard({ branch, index, isProcessing, onRemove }: BranchCardProps) {
  return (
    <div className="flex items-start gap-2 p-2 bg-white dark:bg-slate-900
                    border border-slate-200 dark:border-slate-700 rounded-lg">
      {/* Priority Badge */}
      <div className="w-5 h-5 rounded bg-purple-100 dark:bg-purple-900/50
                      flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
          {index + 1}
        </span>
      </div>

      {/* Branch Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
          {branch.label}
        </p>
        {branch.queries.length > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {branch.queries.length} {branch.queries.length === 1 ? 'query' : 'queries'} planned
          </p>
        )}
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        disabled={isProcessing}
        className="p-1 text-slate-400 hover:text-red-500 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
        title="Remove branch"
      >
        <span className="material-symbols-outlined text-base">close</span>
      </button>
    </div>
  );
}

// =============================================================================
// Strategy Summary Component
// =============================================================================

interface StrategySummaryProps {
  strategy: ResearchStrategy;
}

function StrategySummary({ strategy }: StrategySummaryProps) {
  return (
    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
        Research Strategy
      </p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {strategy.depth}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Depth</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 capitalize">
            {strategy.mode}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Mode</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {strategy.maxSpawns}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Max Spawns</p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Confirmation Footer
// =============================================================================

interface ConfirmationFooterProps {
  isProcessing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationFooter({ isProcessing, onConfirm, onCancel }: ConfirmationFooterProps) {
  return (
    <div className="px-4 py-3 border-t border-border-light dark:border-slate-700
                    flex items-center justify-end gap-2">
      <button
        onClick={onCancel}
        disabled={isProcessing}
        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400
                   hover:text-slate-900 dark:hover:text-slate-100
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={isProcessing}
        className="px-4 py-2 text-sm font-medium text-white
                   bg-purple-600 hover:bg-purple-700
                   rounded-lg shadow-sm
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors flex items-center gap-2"
      >
        {isProcessing ? (
          <>
            <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
            Creating...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-base">add_circle</span>
            Start Research
          </>
        )}
      </button>
    </div>
  );
}

// =============================================================================
// Sprout List View (Phase 4b - Status Grouping)
// =============================================================================

interface SproutListViewProps {
  filterPreset: FilterPresetId;
}

function SproutListView({ filterPreset }: SproutListViewProps) {
  // Import here to avoid circular dependency issues
  const { query, getStatusCounts, selectSprout, selectedSproutId, isLoading } =
    useResearchSprouts();

  // Get filtered sprouts and status counts
  const { sprouts, total, hasMore } = query({ filterPreset });
  const statusCounts = getStatusCounts();

  // Calculate active count (non-archived, non-completed)
  const activeCount = statusCounts.pending + statusCounts.active + statusCounts.paused + statusCounts.blocked;

  // Empty state
  if (sprouts.length === 0 && !isLoading) {
    return (
      <div className="p-6 text-center">
        <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 block mb-3">
          potted_plant
        </span>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {filterPreset === 'active' && activeCount === 0
            ? 'No active research sprouts'
            : filterPreset === 'attention'
              ? 'Nothing needs attention'
              : filterPreset === 'completed'
                ? 'No completed research yet'
                : 'No research sprouts yet'}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Use <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">sprout:</code> to start a research investigation
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <span className="material-symbols-outlined text-4xl text-purple-400 animate-pulse block mb-3">
          science
        </span>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading research sprouts...
        </p>
      </div>
    );
  }

  // Group sprouts by status for display
  const groupedSprouts = groupSproutsByStatus(sprouts);

  return (
    <div className="p-4 space-y-4">
      {/* Status Overview */}
      <StatusOverview counts={statusCounts} />

      {/* Sprout Groups */}
      {Object.entries(groupedSprouts).map(([status, statusSprouts]) => {
        if (statusSprouts.length === 0) return null;
        return (
          <SproutStatusGroup
            key={status}
            status={status as ResearchSproutStatus}
            sprouts={statusSprouts}
            selectedId={selectedSproutId}
            onSelect={selectSprout}
          />
        );
      })}

      {/* Load more indicator */}
      {hasMore && (
        <div className="text-center py-2">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Showing {sprouts.length} of {total} sprouts
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Group sprouts by their status
 */
function groupSproutsByStatus(sprouts: ResearchSprout[]): Record<ResearchSproutStatus, ResearchSprout[]> {
  const groups: Record<ResearchSproutStatus, ResearchSprout[]> = {
    pending: [],
    active: [],
    paused: [],
    blocked: [],
    completed: [],
    archived: [],
  };

  for (const sprout of sprouts) {
    groups[sprout.status].push(sprout);
  }

  return groups;
}

// =============================================================================
// Status Overview Component
// =============================================================================

interface StatusOverviewProps {
  counts: Record<ResearchSproutStatus, number>;
}

function StatusOverview({ counts }: StatusOverviewProps) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  // Only show non-zero counts
  const nonZero = (Object.entries(counts) as [ResearchSproutStatus, number][])
    .filter(([_, count]) => count > 0);

  // Determine which statuses should pulse (attention-grabbing states)
  const shouldPulse = (status: ResearchSproutStatus): boolean => {
    return status === 'pending' || status === 'blocked' || status === 'active';
  };

  return (
    <div className="flex flex-wrap gap-2">
      {nonZero.map(([status, count]) => (
        <StatusBadge
          key={status}
          status={status}
          count={count}
          pulsing={shouldPulse(status)}
        />
      ))}
    </div>
  );
}

interface StatusBadgeProps {
  status: ResearchSproutStatus;
  count: number;
  /** Enable pulsing animation for attention-grabbing states */
  pulsing?: boolean;
}

function StatusBadge({ status, count, pulsing = false }: StatusBadgeProps) {
  const color = RESEARCH_SPROUT_STATUS_COLORS[status];
  const icon = RESEARCH_SPROUT_STATUS_ICONS[status];
  const label = RESEARCH_SPROUT_STATUS_LABELS[status];

  // Color classes mapping
  const colorClasses: Record<string, string> = {
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  };

  // Animation class based on status (Phase 4c)
  const getAnimationClass = (): string => {
    if (!pulsing || count === 0) return '';
    switch (status) {
      case 'pending':
        return 'animate-pulse-pending';
      case 'blocked':
        return 'animate-pulse-attention';
      case 'active':
        return 'animate-pulse-active';
      default:
        return '';
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${colorClasses[color]} ${getAnimationClass()}`}>
      <span className="material-symbols-outlined text-sm">{icon}</span>
      <span className="font-medium">{count}</span>
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}

// =============================================================================
// Pulsing Badge Component (Phase 4c)
// =============================================================================

interface PulsingBadgeProps {
  /** Number to display */
  count: number;
  /** Badge type determines color and animation */
  type: 'pending' | 'attention' | 'active';
  /** Size variant */
  size?: 'sm' | 'md';
  /** Show if count is zero */
  showWhenZero?: boolean;
}

/**
 * Standalone pulsing badge for header/navigation indicators
 * Used to draw attention to pending or blocked items
 */
export function PulsingBadge({
  count,
  type,
  size = 'sm',
  showWhenZero = false,
}: PulsingBadgeProps) {
  if (count === 0 && !showWhenZero) return null;

  const typeConfig = {
    pending: {
      bg: 'bg-amber-500',
      animation: 'animate-pulse-pending',
      ring: 'ring-amber-300',
    },
    attention: {
      bg: 'bg-red-500',
      animation: 'animate-pulse-attention',
      ring: 'ring-red-300',
    },
    active: {
      bg: 'bg-blue-500',
      animation: 'animate-pulse-active',
      ring: 'ring-blue-300',
    },
  };

  const sizeConfig = {
    sm: 'min-w-4 h-4 text-[10px]',
    md: 'min-w-5 h-5 text-xs',
  };

  const config = typeConfig[type];

  return (
    <span
      className={`
        inline-flex items-center justify-center
        ${sizeConfig[size]}
        ${config.bg} ${config.animation}
        text-white font-medium rounded-full
        px-1 ring-2 ${config.ring} ring-opacity-30
      `}
    >
      {count}
    </span>
  );
}

// =============================================================================
// Sprout Status Group Component
// =============================================================================

interface SproutStatusGroupProps {
  status: ResearchSproutStatus;
  sprouts: ResearchSprout[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function SproutStatusGroup({ status, sprouts, selectedId, onSelect }: SproutStatusGroupProps) {
  const label = RESEARCH_SPROUT_STATUS_LABELS[status];
  const icon = RESEARCH_SPROUT_STATUS_ICONS[status];

  return (
    <div className="space-y-2">
      {/* Group Header */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-slate-400 text-base">{icon}</span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {label} ({sprouts.length})
        </span>
      </div>

      {/* Sprout Cards */}
      <div className="space-y-2">
        {sprouts.map(sprout => (
          <SproutCard
            key={sprout.id}
            sprout={sprout}
            isSelected={sprout.id === selectedId}
            onSelect={() => onSelect(sprout.id)}
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Sprout Card Component
// =============================================================================

interface SproutCardProps {
  sprout: ResearchSprout;
  isSelected: boolean;
  onSelect: () => void;
}

function SproutCard({ sprout, isSelected, onSelect }: SproutCardProps) {
  const color = RESEARCH_SPROUT_STATUS_COLORS[sprout.status];
  const icon = RESEARCH_SPROUT_STATUS_ICONS[sprout.status];

  // Format relative time
  const relativeTime = formatRelativeTime(sprout.updatedAt);

  // Border color based on status
  const borderClasses: Record<string, string> = {
    amber: 'border-l-amber-400',
    blue: 'border-l-blue-400',
    slate: 'border-l-slate-400',
    red: 'border-l-red-400',
    green: 'border-l-green-400',
    gray: 'border-l-gray-400',
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border-l-4 transition-colors
        ${borderClasses[color]}
        ${isSelected
          ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50'
          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
    >
      {/* Title */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
          {sprout.title || sprout.spark.slice(0, 50)}
        </p>
        <span className="material-symbols-outlined text-slate-400 text-base shrink-0">
          {icon}
        </span>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
        {/* Branches */}
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">account_tree</span>
          {sprout.branches.length}
        </span>

        {/* Tags */}
        {sprout.tags.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">label</span>
            {sprout.tags.length}
          </span>
        )}

        {/* Time */}
        <span className="ml-auto">{relativeTime}</span>
      </div>

      {/* Progress indicator for active sprouts */}
      {sprout.status === 'active' && sprout.execution && (
        <div className="mt-2 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 animate-pulse"
            style={{
              width: `${Math.min((sprout.execution.apiCallCount / 10) * 100, 90)}%`,
            }}
          />
        </div>
      )}
    </button>
  );
}

/**
 * Format a timestamp as relative time (e.g., "2h ago", "yesterday")
 */
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// =============================================================================
// Error Banner
// =============================================================================

interface ErrorBannerProps {
  error: string;
  onDismiss: () => void;
}

function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  return (
    <div className="mx-4 my-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg
                    border border-red-200 dark:border-red-800/50">
      <div className="flex items-start gap-2">
        <span className="material-symbols-outlined text-red-500 text-base mt-0.5">
          error
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 text-red-400 hover:text-red-600 transition-colors"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Export
// =============================================================================

export default GardenInspector;
