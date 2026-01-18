// src/bedrock/consoles/ExperienceConsole/QualityAnalyticsSection.tsx
// Sprint: S10.2-SL-AICuration v3 - Analytics + Override Workflows
// Epic 1: Quality Analytics Dashboard
// Pattern: json-render section component

import React, { useMemo } from 'react';
import { Renderer } from '@surface/components/modals/SproutFinishingRoom/json-render';
import { QualityAnalyticsRegistry } from './json-render/quality-analytics-registry';
import {
  qualityAnalyticsToRenderTree,
  createEmptyAnalyticsTree,
} from './json-render/quality-analytics-transform';
import type { QualityAnalyticsData, TimeRange } from '@core/schema/quality-analytics';
import type { QualityAnalyticsTransformOptions } from './json-render/quality-analytics-transform';

// =============================================================================
// Types
// =============================================================================

export interface QualityAnalyticsSectionProps {
  /** Analytics data from API */
  data: QualityAnalyticsData | null;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Time range selection */
  timeRange?: TimeRange;
  /** Callback when time range changes */
  onTimeRangeChange?: (range: TimeRange) => void;
  /** Show network comparison data */
  showNetworkComparison?: boolean;
  /** Custom title */
  title?: string;
  /** Compact mode (for embedding in sidebars) */
  compact?: boolean;
}

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'all', label: 'All Time' },
];

// =============================================================================
// Loading Skeleton
// =============================================================================

function AnalyticsSkeleton() {
  return (
    <div className="animate-pulse space-y-4" data-testid="analytics-loading">
      {/* Header skeleton */}
      <div className="flex justify-between items-center pb-3 border-b border-ink/10 dark:border-white/10">
        <div className="h-6 w-40 bg-ink/10 dark:bg-white/10 rounded" />
        <div className="h-6 w-24 bg-ink/10 dark:bg-white/10 rounded" />
      </div>
      {/* Metrics skeleton */}
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-3 rounded border border-ink/10 dark:border-white/10">
            <div className="h-4 w-16 bg-ink/10 dark:bg-white/10 rounded mb-2" />
            <div className="h-8 w-12 bg-ink/10 dark:bg-white/10 rounded" />
          </div>
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="h-32 bg-ink/10 dark:bg-white/10 rounded" />
    </div>
  );
}

// =============================================================================
// Error State
// =============================================================================

function AnalyticsError({ message }: { message: string }) {
  return (
    <div className="p-6 text-center" data-testid="analytics-error">
      <div className="text-4xl mb-2">!</div>
      <h4 className="text-lg font-medium text-ink dark:text-paper mb-1">
        Unable to load analytics
      </h4>
      <p className="text-sm text-ink-muted dark:text-paper/60">{message}</p>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function QualityAnalyticsSection({
  data,
  loading = false,
  error = null,
  timeRange = '30d',
  onTimeRangeChange,
  showNetworkComparison = true,
  title = 'Quality Analytics',
  compact = false,
}: QualityAnalyticsSectionProps) {
  // Transform data to render tree
  const renderTree = useMemo(() => {
    if (!data) {
      return createEmptyAnalyticsTree({
        title,
        timeRange,
        compact,
      });
    }

    const options: QualityAnalyticsTransformOptions = {
      title,
      timeRange,
      showNetworkComparison,
      compact,
      columns: compact ? 2 : 4,
    };

    return qualityAnalyticsToRenderTree(data, options);
  }, [data, title, timeRange, showNetworkComparison, compact]);

  // Handle loading state
  if (loading) {
    return (
      <section
        className="bg-paper dark:bg-ink rounded-lg p-4"
        data-testid="quality-analytics-section"
      >
        <AnalyticsSkeleton />
      </section>
    );
  }

  // Handle error state
  if (error) {
    return (
      <section
        className="bg-paper dark:bg-ink rounded-lg p-4"
        data-testid="quality-analytics-section"
      >
        <AnalyticsError message={error} />
      </section>
    );
  }

  return (
    <section
      className="bg-paper dark:bg-ink rounded-lg p-4"
      data-testid="quality-analytics-section"
    >
      {/* Time range selector (if callback provided) */}
      {onTimeRangeChange && !compact && (
        <div className="flex justify-end mb-4">
          <div className="flex gap-1 p-1 rounded-lg bg-ink/5 dark:bg-white/5">
            {TIME_RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onTimeRangeChange(option.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors
                  ${
                    timeRange === option.value
                      ? 'bg-grove-forest text-white'
                      : 'text-ink-muted dark:text-paper/60 hover:text-ink dark:hover:text-paper'
                  }`}
                data-testid={`time-range-${option.value}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Render the json-render tree */}
      <Renderer tree={renderTree} registry={QualityAnalyticsRegistry} />
    </section>
  );
}

export default QualityAnalyticsSection;
