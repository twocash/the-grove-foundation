// src/explore/GardenInspector.tsx
// Garden Inspector - Research sprout management panel
// Sprint: sprout-research-v1, Phase 4a
// Sprint: results-display-v1 - Added results view for completed sprouts
//
// Multi-purpose component:
// 1. Confirmation dialog when Prompt Architect is in 'confirming' state
// 2. Status-grouped list of research sprouts
// 3. Pulsing badge indicators for pending/blocked items
// 4. Results display for completed sprouts

import { useState, useMemo, useCallback, useEffect } from 'react';
// Sprint: research-template-wiring-v1 - Import template data hook
import { useOutputTemplateData } from '../bedrock/consoles/ExperienceConsole/useOutputTemplateData';
import type { EditableManifest, PromptArchitectState } from './hooks/usePromptArchitect';
import type { ResearchBranch, ResearchStrategy } from '@core/schema/research-strategy';
import type { ResearchSprout, ResearchSproutStatus } from '@core/schema/research-sprout';
import type { ResearchDocument } from '@core/schema/research-document';
import {
  RESEARCH_SPROUT_STATUS_LABELS,
  RESEARCH_SPROUT_STATUS_ICONS,
  RESEARCH_SPROUT_STATUS_COLORS,
  FILTER_PRESETS,
  type FilterPresetId,
} from '@core/schema/research-sprout-registry';
import { useResearchSprouts } from './context/ResearchSproutContext';
// Sprint: progress-streaming-ui-v1
import { ResearchProgressView } from './components/ResearchProgressView';
import { useResearchExecution } from './context/ResearchExecutionContext';
// Sprint: results-display-v1
import { ResearchResultsView } from './components/ResearchResultsView';
// Sprint: results-wiring-v1 - Real data with fallback converter
import { sproutToResearchDocument } from './utils/sprout-to-document';

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

type ViewMode = 'confirmation' | 'list' | 'progress' | 'results';

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
  // Filter preset for list view
  const [filterPreset, setFilterPreset] = useState<FilterPresetId>('active');

  // Sprint: research-template-wiring-v1 - Template selection state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Get templates to find default for initialization
  const { getDefault } = useOutputTemplateData();

  // Handler for template changes - updates both local state and manifest
  const handleTemplateChange = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    // Sync to manifest for sprout creation
    onManifestUpdate({ templateId });
  }, [onManifestUpdate]);

  // Initialize template selection with default when entering confirmation mode
  useEffect(() => {
    if (architectState === 'confirming' && !selectedTemplateId) {
      const defaultTemplate = getDefault('research');
      if (defaultTemplate) {
        const templateId = defaultTemplate.meta.id;
        setSelectedTemplateId(templateId);
        // Also sync default to manifest
        onManifestUpdate({ templateId });
      }
    }
  }, [architectState, selectedTemplateId, getDefault, onManifestUpdate]);

  // Reset template selection when leaving confirmation mode
  useEffect(() => {
    if (architectState !== 'confirming') {
      setSelectedTemplateId('');
    }
  }, [architectState]);

  // Progress state for active sprouts (Sprint: progress-streaming-ui-v1)
  const { progressState, resetProgress } = useResearchExecution();

  // Get selected sprout from context
  const { selectedSproutId, sprouts, selectSprout } = useResearchSprouts();
  const selectedSprout = useMemo(
    () => sprouts.find(s => s.id === selectedSproutId),
    [sprouts, selectedSproutId]
  );

  // Determine view mode based on state
  const viewMode: ViewMode = useMemo(() => {
    if (architectState === 'confirming') return 'confirmation';
    if (selectedSprout?.status === 'active') return 'progress';
    if (selectedSprout?.status === 'completed') return 'results';
    return 'list';
  }, [architectState, selectedSprout?.status]);

  // Real research document from sprout or fallback conversion (Sprint: results-wiring-v1)
  const researchDocument: ResearchDocument | null = useMemo(() => {
    if (selectedSprout?.status === 'completed') {
      // Use stored document, or convert legacy sprout
      return selectedSprout.researchDocument ?? sproutToResearchDocument(selectedSprout);
    }
    return null;
  }, [selectedSprout]);

  // Handler for returning to list view
  const handleBackToList = useCallback(() => {
    selectSprout(null);
  }, [selectSprout]);

  return (
    <div className="flex flex-col h-full bg-glass-solid">
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
            selectedTemplateId={selectedTemplateId}
            onTemplateChange={handleTemplateChange}
          />
        )}

        {viewMode === 'list' && (
          <SproutListView filterPreset={filterPreset} />
        )}

        {/* Progress view for active sprouts (Sprint: progress-streaming-ui-v1) */}
        {viewMode === 'progress' && selectedSprout && (
          <ResearchProgressView
            state={progressState}
            onRetry={() => {
              resetProgress();
              // TODO: Trigger retry via context
            }}
            onSourceClick={(url) => window.open(url, '_blank')}
          />
        )}

        {/* Results view for completed sprouts (Sprint: results-display-v1) */}
        {/* Sprint: knowledge-base-integration-v1 - Added sprout prop for KB provenance */}
        {viewMode === 'results' && researchDocument && selectedSprout && (
          <ResearchResultsView
            document={researchDocument}
            sprout={{
              id: selectedSprout.id,
              spark: selectedSprout.spark,
              groveConfigSnapshot: selectedSprout.groveConfigSnapshot,
            }}
            onBack={handleBackToList}
            onCopy={() => {
              console.log('[GardenInspector] Document copied to clipboard');
            }}
          />
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
  // Get icon and title based on view mode
  const getHeaderContent = () => {
    switch (viewMode) {
      case 'confirmation':
        return {
          icon: 'science',
          title: 'New Research Sprout',
          subtitle: 'Review and confirm your research plan',
          bgColor: 'bg-neon-violet/10',
          iconColor: 'text-neon-violet',
        };
      case 'progress':
        return {
          icon: 'monitoring',
          title: 'Research in Progress',
          subtitle: 'Collecting and analyzing evidence...',
          bgColor: 'bg-neon-cyan/10',
          iconColor: 'text-neon-cyan',
        };
      case 'results':
        return {
          icon: 'article',
          title: 'Research Results',
          subtitle: 'View and export your findings',
          bgColor: 'bg-neon-green/10',
          iconColor: 'text-neon-green',
        };
      default:
        return {
          icon: 'park',
          title: 'Research Garden',
          subtitle: `Viewing ${FILTER_PRESETS[filterPreset].label.toLowerCase()}`,
          bgColor: 'bg-neon-violet/10',
          iconColor: 'text-neon-violet',
        };
    }
  };

  const { icon, title, subtitle, bgColor, iconColor } = getHeaderContent();

  return (
    <div className="px-4 py-3 border-b border-white/5">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`w-8 h-8 rounded-lg ${bgColor}
                        border border-white/10
                        flex items-center justify-center shrink-0`}>
          <span className={`material-symbols-outlined ${iconColor} text-lg`}>
            {icon}
          </span>
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-glass-text-primary">
            {title}
          </h3>
          <p className="text-xs text-glass-text-muted truncate">
            {subtitle}
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
                    ? 'bg-neon-violet/20 text-neon-violet'
                    : 'text-glass-text-muted hover:bg-white/5'
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
  /** Sprint: research-template-wiring-v1 - Selected template ID for research style */
  selectedTemplateId: string;
  /** Sprint: research-template-wiring-v1 - Handler for template selection change */
  onTemplateChange: (templateId: string) => void;
}

function ConfirmationView({
  manifest,
  summary,
  isProcessing,
  onManifestUpdate,
  onAddBranch: _onAddBranch,
  onRemoveBranch: _onRemoveBranch,
  selectedTemplateId,
  onTemplateChange,
}: ConfirmationViewProps) {
  // MVP: Simplified to title + prompt only
  // TODO: Restore branches, strategy, tags when prompt patterns validated

  // Sprint: research-template-wiring-v1 - Get research templates
  const { objects: templates, loading: templatesLoading } = useOutputTemplateData();

  // Filter to active research templates
  const researchTemplates = useMemo(() => {
    return templates.filter(
      (t) => t.payload.agentType === 'research' && t.payload.status === 'active'
    );
  }, [templates]);

  // Get selected template for description hint
  const selectedTemplate = useMemo(() => {
    return researchTemplates.find((t) => t.meta.id === selectedTemplateId);
  }, [researchTemplates, selectedTemplateId]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onManifestUpdate({ title: e.target.value });
  }, [onManifestUpdate]);

  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Store prompt in notes field for MVP
    onManifestUpdate({ notes: e.target.value });
  }, [onManifestUpdate]);

  return (
    <div className="p-4 space-y-4">
      {/* ZONE 1: SPARK ORIGIN (The Past) - Amber accent */}
      {/* The spark is the moment of curiosity that started this journey */}
      <div className="p-3 bg-[var(--glass-panel)] rounded-lg
                      border border-[var(--neon-amber)]/30
                      shadow-[0_0_12px_rgba(245,158,11,0.15)]">
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-[var(--neon-amber)] text-base mt-0.5">
            lightbulb
          </span>
          <div>
            <p className="text-xs font-medium text-[var(--neon-amber)] mb-1">
              Research Spark
            </p>
            <p className="text-sm text-[var(--glass-text-primary)] leading-relaxed">
              {manifest.spark}
            </p>
          </div>
        </div>
      </div>

      {/* ZONE 2: AI INTERPRETATION (The Bridge) - Violet accent */}
      {/* AI's contribution with visible provenance marker */}
      {summary && (
        <div className="p-3 bg-[var(--neon-violet)]/10 rounded-lg
                        border border-[var(--neon-violet)]/30
                        shadow-[0_0_8px_rgba(139,92,246,0.1)]">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[var(--neon-violet)] text-base mt-0.5">
              auto_awesome
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-[var(--neon-violet)]/70 uppercase tracking-wide mb-1">
                AI Suggested
              </p>
              <p className="text-xs text-[var(--glass-text-secondary)] leading-relaxed">
                {summary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ZONE 3: HUMAN SHAPING (The Future) - Neutral glass */}
      {/* Where human attention shapes the research direction */}

      {/* Title */}
      <div>
        <label className="block text-xs font-medium text-[var(--glass-text-muted)] mb-1.5">
          Title
        </label>
        <input
          type="text"
          value={manifest.title}
          onChange={handleTitleChange}
          placeholder="Give your research a descriptive title..."
          disabled={isProcessing}
          className="w-full px-3 py-2 text-sm bg-[var(--glass-solid)]
                     text-[var(--glass-text-primary)]
                     placeholder:text-[var(--glass-text-muted)]
                     border border-[var(--glass-border)] rounded-lg
                     focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 focus:border-[var(--neon-cyan)]/50
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        />
      </div>

      {/* Sprint: research-template-wiring-v1 - Research Style selector */}
      {!templatesLoading && researchTemplates.length > 0 && (
        <div>
          <label
            htmlFor="research-style-select"
            className="block text-xs font-medium text-[var(--glass-text-muted)] mb-1.5"
          >
            Research Style
          </label>
          <select
            id="research-style-select"
            value={selectedTemplateId}
            onChange={(e) => onTemplateChange(e.target.value)}
            disabled={isProcessing}
            className="w-full px-3 py-2 text-sm bg-[var(--glass-solid)]
                       text-[var(--glass-text-primary)]
                       border border-[var(--glass-border)] rounded-lg
                       focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 focus:border-[var(--neon-cyan)]/50
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors cursor-pointer"
            aria-label="Select research style"
          >
            {researchTemplates.map((template) => (
              <option key={template.meta.id} value={template.meta.id}>
                {template.payload.name}
                {template.payload.isDefault ? ' (Default)' : ''}
              </option>
            ))}
          </select>
          {/* Description hint - updates on selection (Progressive Disclosure) */}
          {selectedTemplate && (
            <p className="mt-1.5 text-xs text-[var(--glass-text-muted)]">
              {selectedTemplate.payload.description || 'Research template for AI-guided investigation.'}
            </p>
          )}
        </div>
      )}

      {/* Prompt / Instructions (MVP: maps to notes field, will become system prompt) */}
      <div>
        <label className="block text-xs font-medium text-[var(--glass-text-muted)] mb-1.5">
          Instructions / Prompt
        </label>
        <textarea
          value={manifest.notes}
          onChange={handlePromptChange}
          placeholder="Provide specific instructions for how the AI should approach this research..."
          rows={5}
          disabled={isProcessing}
          className="w-full px-3 py-2 text-sm bg-[var(--glass-solid)]
                     text-[var(--glass-text-primary)]
                     placeholder:text-[var(--glass-text-muted)]
                     border border-[var(--glass-border)] rounded-lg
                     focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 focus:border-[var(--neon-cyan)]/50
                     resize-none font-mono
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        />
        <p className="text-xs text-[var(--glass-text-muted)] mt-1">
          This will guide the research agent's behavior and focus areas.
        </p>
      </div>

      {/* MVP: Branches section commented out
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Research Branches ({manifest.branches.length})
          </label>
          <button
            onClick={() => _onAddBranch({
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
              onRemove={() => _onRemoveBranch(branch.id)}
            />
          ))}
          {manifest.branches.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic py-2">
              No branches inferred. Add at least one to continue.
            </p>
          )}
        </div>
      </div>
      */}

      {/* MVP: Strategy summary commented out
      <StrategySummary strategy={manifest.strategy} />
      */}

      {/* MVP: Tags commented out
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
      */}
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
    <div className="px-4 py-3 border-t border-white/5
                    flex items-center justify-end gap-2">
      <button
        onClick={onCancel}
        disabled={isProcessing}
        className="px-4 py-2 text-sm font-medium text-[var(--glass-text-secondary)]
                   hover:text-[var(--glass-text-primary)]
                   border border-[var(--glass-border)] rounded-lg
                   hover:border-[var(--glass-text-muted)]
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={isProcessing}
        className="px-4 py-2 text-sm font-medium text-white
                   bg-neon-violet hover:bg-neon-violet/80
                   rounded-lg shadow-sm shadow-neon-violet/25
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
        <span className="material-symbols-outlined text-4xl text-glass-text-muted/50 block mb-3">
          potted_plant
        </span>
        <p className="text-sm text-glass-text-muted">
          {filterPreset === 'active' && activeCount === 0
            ? 'No active research sprouts'
            : filterPreset === 'attention'
              ? 'Nothing needs attention'
              : filterPreset === 'completed'
                ? 'No completed research yet'
                : 'No research sprouts yet'}
        </p>
        <p className="text-xs text-glass-text-muted/70 mt-1">
          Use <code className="font-mono bg-glass-panel px-1 rounded">sprout:</code> to start a research investigation
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <span className="material-symbols-outlined text-4xl text-neon-violet animate-pulse block mb-3">
          science
        </span>
        <p className="text-sm text-glass-text-muted">
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
          <span className="text-xs text-glass-text-muted/70">
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

  // Color classes mapping - using Quantum Glass variables
  const colorClasses: Record<string, string> = {
    amber: 'bg-neon-amber/20 text-neon-amber',
    blue: 'bg-neon-cyan/20 text-neon-cyan',
    slate: 'bg-glass-panel text-glass-text-muted',
    red: 'bg-red-500/20 text-red-400',
    green: 'bg-neon-green/20 text-neon-green',
    gray: 'bg-glass-panel text-glass-text-muted',
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
        <span className="material-symbols-outlined text-glass-text-muted text-base">{icon}</span>
        <span className="text-xs font-medium text-glass-text-muted uppercase tracking-wide">
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

  // Border color based on status - using Quantum Glass variables
  const borderClasses: Record<string, string> = {
    amber: 'border-l-[var(--neon-amber)]',
    blue: 'border-l-[var(--neon-cyan)]',
    slate: 'border-l-[var(--glass-text-muted)]',
    red: 'border-l-red-400',
    green: 'border-l-[var(--neon-green)]',
    gray: 'border-l-[var(--glass-text-muted)]',
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border-l-4 transition-colors
        ${borderClasses[color]}
        ${isSelected
          ? 'bg-neon-violet/10 border border-neon-violet/30'
          : 'bg-glass-panel border border-white/5 hover:bg-glass-elevated'
        }`}
    >
      {/* Title */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-glass-text-primary line-clamp-2">
          {sprout.title || sprout.spark.slice(0, 50)}
        </p>
        <span className="material-symbols-outlined text-glass-text-muted text-base shrink-0">
          {icon}
        </span>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-3 mt-2 text-xs text-glass-text-muted">
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
        <div className="mt-2 h-1 bg-glass-panel rounded-full overflow-hidden">
          <div
            className="h-full bg-neon-cyan animate-pulse"
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
    <div className="mx-4 my-2 p-3 bg-red-500/10 rounded-lg
                    border border-red-500/30">
      <div className="flex items-start gap-2">
        <span className="material-symbols-outlined text-red-400 text-base mt-0.5">
          error
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-400">{error}</p>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 text-red-400/70 hover:text-red-400 transition-colors"
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
