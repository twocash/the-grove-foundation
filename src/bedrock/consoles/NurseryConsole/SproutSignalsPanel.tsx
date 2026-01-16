// src/bedrock/consoles/NurseryConsole/SproutSignalsPanel.tsx
// Sprint: S6-SL-ObservableSignals v1
// Epic 8: Signal analytics panel for sprouts in Nursery Console

import React from 'react';
import type { SignalAggregation } from '@core/schema/sprout-signals';
import { useSproutAggregations } from './useSproutAggregations';
import {
  signalAggregationToRenderTree,
  createEmptySignalsTree,
  SignalsRegistry,
} from '../ExperienceConsole/json-render';
import { Renderer } from '@surface/components/modals/SproutFinishingRoom/json-render';
import { InspectorSection } from '../../primitives/BedrockInspector';
import { GlassButton } from '../../primitives/GlassButton';

export interface SproutSignalsPanelProps {
  /** Sprout ID to fetch signals for */
  sproutId: string;
  /** Optional sprout query for context */
  sproutQuery?: string;
  /** Collapsible section behavior */
  collapsible?: boolean;
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
}

interface PeriodSelectorProps {
  period: SignalAggregation['period'];
  onChange: (p: SignalAggregation['period']) => void;
  disabled?: boolean;
}

/**
 * Refresh icon with optional spinning animation.
 */
function RefreshIcon({ spinning }: { spinning: boolean }): React.ReactElement {
  const spinClass = spinning ? 'animate-spin' : '';
  return (
    <span className={`material-symbols-outlined text-base ${spinClass}`}>
      sync
    </span>
  );
}

const PERIODS: Array<{ value: SignalAggregation['period']; label: string }> = [
  { value: 'all_time', label: 'All Time' },
  { value: 'last_30d', label: '30 Days' },
  { value: 'last_7d', label: '7 Days' },
];

/**
 * Period selector tabs
 */
function PeriodSelector({ period, onChange, disabled }: PeriodSelectorProps): React.ReactElement {
  return (
    <div className="flex gap-1 p-1 rounded-lg bg-[var(--glass-solid)]">
      {PERIODS.map((p) => {
        const isActive = period === p.value;
        const baseClasses = 'px-3 py-1 text-xs rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
        const activeClasses = 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]';
        const inactiveClasses = 'text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)]';

        return (
          <button
            key={p.value}
            onClick={() => onChange(p.value)}
            disabled={disabled}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Builds the render tree from aggregation data or creates an empty tree.
 */
function buildRenderTree(
  aggregation: SignalAggregation | null,
  sproutId: string,
  period: SignalAggregation['period'],
  sproutQuery?: string
) {
  if (aggregation) {
    return signalAggregationToRenderTree(aggregation, {
      title: 'Usage Signals',
      sproutQuery,
      showConversionRates: true,
      showThresholds: true,
    });
  }
  return createEmptySignalsTree(sproutId, period, { sproutQuery });
}

/**
 * SproutSignalsPanel - Displays signal analytics for a sprout
 *
 * Uses the json-render signals module to transform aggregation data
 * into a visual representation.
 */
export function SproutSignalsPanel({
  sproutId,
  sproutQuery,
  collapsible = true,
  defaultCollapsed = true,
}: SproutSignalsPanelProps) {
  const {
    aggregation,
    loading,
    error,
    refetch,
    refreshAggregation,
    period,
    setPeriod,
  } = useSproutAggregations(sproutId);

  // Transform aggregation to render tree
  const renderTree = buildRenderTree(aggregation, sproutId, period, sproutQuery);

  return (
    <InspectorSection
      title="Usage Signals"
      collapsible={collapsible}
      defaultCollapsed={defaultCollapsed}
    >
      <div className="space-y-4">
        {/* Header with period selector and refresh */}
        <div className="flex items-center justify-between">
          <PeriodSelector
            period={period}
            onChange={setPeriod}
            disabled={loading}
          />
          <div className="flex items-center gap-2">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={refetch}
              disabled={loading}
              title="Refresh"
            >
              <RefreshIcon spinning={loading} />
            </GlassButton>
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={refreshAggregation}
              disabled={loading}
              title="Recalculate aggregations"
            >
              <span className="material-symbols-outlined text-base">
                calculate
              </span>
            </GlassButton>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && !aggregation && (
          <div className="flex items-center justify-center py-8">
            <span className="material-symbols-outlined text-2xl text-[var(--glass-text-muted)] animate-spin">
              progress_activity
            </span>
          </div>
        )}

        {/* Signals content via json-render */}
        <div className={loading ? 'opacity-50' : ''}>
          <Renderer tree={renderTree} registry={SignalsRegistry} />
        </div>

        {/* Last computed timestamp */}
        {aggregation?.computedAt && (
          <p className="text-xs text-[var(--glass-text-muted)] text-right">
            Last computed: {new Date(aggregation.computedAt).toLocaleString()}
          </p>
        )}
      </div>
    </InspectorSection>
  );
}

export default SproutSignalsPanel;
