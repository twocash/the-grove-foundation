// src/bedrock/consoles/ExperienceConsole/json-render/signals-transform.ts
// Sprint: S6-SL-ObservableSignals v1
// Epic 7: json-render Signals Transform
// Pattern: json-render transform (converts SignalAggregation to renderable tree)

import type { SignalAggregation, SproutUsageEvent } from '@core/schema/sprout-signals';
import type { RenderTree, RenderElement } from './signals-catalog';

/**
 * Transform options for customizing the render output
 */
export interface SignalsTransformOptions {
  /** Show conversion rates in funnel chart */
  showConversionRates?: boolean;
  /** Maximum recent events to show in timeline */
  timelineLimit?: number;
  /** Show quality thresholds in gauge */
  showThresholds?: boolean;
  /** Custom title for the header */
  title?: string;
  /** Sprout query for subtitle context */
  sproutQuery?: string;
  /** Number of columns for metric rows (default 4, use 2 for compact) */
  columns?: 2 | 3 | 4;
  /** Compact mode - hides less essential components */
  compact?: boolean;
}

const DEFAULT_OPTIONS: SignalsTransformOptions = {
  showConversionRates: true,
  timelineLimit: 10,
  showThresholds: true,
  title: 'Usage Signals',
  columns: 4,
  compact: false,
};

/**
 * Returns color based on view count threshold.
 */
function getViewsColor(count: number): 'green' | 'default' {
  if (count >= 50) {
    return 'green';
  }
  return 'default';
}

/**
 * Returns the specified color if count is positive, otherwise 'default'.
 */
function getPositiveCountColor(
  count: number,
  activeColor: 'green' | 'blue' | 'red'
): 'green' | 'blue' | 'red' | 'default' {
  if (count > 0) {
    return activeColor;
  }
  return 'default';
}

/**
 * Transforms a SignalAggregation into a json-render tree structure.
 *
 * The tree follows the signals catalog component vocabulary:
 * - SignalHeader: title, subtitle, period, lastUpdated
 * - MetricRow: primary metrics (views, retrievals, refs, searches)
 * - MetricRow: utility metrics (exports, promotions, refinements)
 * - QualityGauge: quality score visualization
 * - DiversityBadge: diversity index with breakdown
 * - EventBreakdown: event type distribution
 * - FunnelChart: engagement funnel stages
 * - AdvancementIndicator: eligibility status
 */
export function signalAggregationToRenderTree(
  aggregation: SignalAggregation,
  options: SignalsTransformOptions = {}
): RenderTree {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const children: RenderElement[] = [];

  // 1. Header with period and timestamp
  children.push({
    type: 'SignalHeader',
    props: {
      title: opts.title || 'Usage Signals',
      subtitle: opts.sproutQuery,
      period: aggregation.period,
      sproutId: aggregation.sproutId,
      lastUpdated: aggregation.computedAt,
    },
  });

  // 2. Primary metrics row (retrieval signals)
  children.push({
    type: 'MetricRow',
    props: {
      columns: opts.columns || 4,
      metrics: [
        {
          label: 'Views',
          value: aggregation.viewCount,
          format: 'number' as const,
          color: getViewsColor(aggregation.viewCount),
        },
        {
          label: 'Retrievals',
          value: aggregation.retrievalCount,
          format: 'number' as const,
          color: getPositiveCountColor(aggregation.retrievalCount, 'blue'),
        },
        {
          label: 'References',
          value: aggregation.referenceCount,
          format: 'number' as const,
          color: getPositiveCountColor(aggregation.referenceCount, 'green'),
        },
        {
          label: 'Searches',
          value: aggregation.searchAppearances,
          format: 'number' as const,
        },
      ],
    },
  });

  // 3. Utility metrics row
  const totalVotes = aggregation.upvotes + aggregation.downvotes;
  children.push({
    type: 'MetricRow',
    props: {
      columns: opts.columns || 4,
      metrics: [
        {
          label: 'Upvotes',
          value: aggregation.upvotes,
          format: 'number' as const,
          color: 'green',
        },
        {
          label: 'Downvotes',
          value: aggregation.downvotes,
          format: 'number' as const,
          color: getPositiveCountColor(aggregation.downvotes, 'red'),
        },
        {
          label: 'Exports',
          value: aggregation.exportCount,
          format: 'number' as const,
          color: getPositiveCountColor(aggregation.exportCount, 'blue'),
        },
        {
          label: 'Promotions',
          value: aggregation.promotionCount,
          format: 'number' as const,
          color: getPositiveCountColor(aggregation.promotionCount, 'green'),
        },
      ],
    },
  });

  // 4. Quality gauge
  children.push({
    type: 'QualityGauge',
    props: {
      score: aggregation.qualityScore,
      label: 'Quality Score',
      ...(opts.showThresholds && {
        thresholds: {
          low: 0.3,
          medium: 0.6,
          high: 0.8,
        },
      }),
    },
  });

  // 5. Diversity badge (skip in compact mode - takes too much width)
  if (!opts.compact) {
    const diversityBreakdown = {
      uniqueSessions: aggregation.uniqueSessions,
      uniqueLenses: aggregation.uniqueLenses,
      uniqueHubs: aggregation.uniqueHubs,
      uniqueUsers: aggregation.uniqueUsers > 0 ? aggregation.uniqueUsers : undefined,
    };

    children.push({
      type: 'DiversityBadge',
      props: {
        index: aggregation.diversityIndex,
        breakdown: diversityBreakdown,
      },
    });
  }

  // 6. Event breakdown (skip in compact mode)
  if (!opts.compact) {
    const events = [
      { type: 'sprout_viewed', count: aggregation.viewCount },
      { type: 'sprout_retrieved', count: aggregation.retrievalCount },
      { type: 'sprout_referenced', count: aggregation.referenceCount },
      { type: 'sprout_searched', count: aggregation.searchAppearances },
      { type: 'sprout_rated', count: totalVotes },
      { type: 'sprout_exported', count: aggregation.exportCount },
      { type: 'sprout_promoted', count: aggregation.promotionCount },
      { type: 'sprout_refined', count: aggregation.refinementCount },
    ].filter(e => e.count > 0);

    const totalEvents = events.reduce((sum, e) => sum + e.count, 0);

    if (totalEvents > 0) {
      children.push({
        type: 'EventBreakdown',
        props: {
          events: events.map(e => ({
            type: e.type,
            count: e.count,
            percentage: (e.count / totalEvents) * 100,
          })),
          total: totalEvents,
          showLabels: true,
        },
      });
    }
  }

  // 7. Funnel chart (skip in compact mode)
  if (!opts.compact) {
    const funnelStages = [
      { stage: 'viewed', label: 'Viewed', count: aggregation.viewCount },
      { stage: 'engaged', label: 'Engaged', count: aggregation.retrievalCount + aggregation.referenceCount },
      { stage: 'rated', label: 'Rated', count: totalVotes },
      { stage: 'actioned', label: 'Actioned', count: aggregation.exportCount + aggregation.promotionCount + aggregation.refinementCount },
    ];

    const maxFunnelCount = Math.max(...funnelStages.map(s => s.count), 1);

    children.push({
      type: 'FunnelChart',
      props: {
        stages: funnelStages.map(s => ({
          stage: s.stage,
          label: s.label,
          count: s.count,
          percentage: (s.count / maxFunnelCount) * 100,
        })),
        showConversionRates: opts.showConversionRates,
      },
    });
  }

  // 8. Advancement indicator
  children.push({
    type: 'AdvancementIndicator',
    props: {
      eligible: aggregation.advancementEligible,
      qualityScore: aggregation.qualityScore,
      criteria: {
        viewCountMet: aggregation.viewCount >= 10,
        qualityScoreMet: aggregation.qualityScore >= 0.6,
        diversityMet: aggregation.diversityIndex >= 0.3,
        daysActiveMet: aggregation.daysActive >= 7,
      },
      nextTier: aggregation.advancementEligible ? 'sapling' : undefined,
    },
  });

  return {
    type: 'root',
    children,
  };
}

/**
 * Creates a minimal render tree for sprouts with no events.
 * Shows empty state with helpful message.
 */
export function createEmptySignalsTree(
  sproutId: string,
  period: SignalAggregation['period'] = 'all_time',
  options: SignalsTransformOptions = {}
): RenderTree {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return {
    type: 'root',
    children: [
      {
        type: 'SignalHeader',
        props: {
          title: opts.title || 'Usage Signals',
          subtitle: opts.sproutQuery || 'No activity recorded yet',
          period,
          sproutId,
        },
      },
      {
        type: 'MetricRow',
        props: {
          columns: opts.columns || 4,
          metrics: [
            { label: 'Views', value: 0, format: 'number' as const },
            { label: 'Retrievals', value: 0, format: 'number' as const },
            { label: 'References', value: 0, format: 'number' as const },
            { label: 'Searches', value: 0, format: 'number' as const },
          ],
        },
      },
      {
        type: 'QualityGauge',
        props: {
          score: 0,
          label: 'Quality Score',
        },
      },
      {
        type: 'AdvancementIndicator',
        props: {
          eligible: false,
          qualityScore: 0,
          criteria: {
            viewCountMet: false,
            qualityScoreMet: false,
          },
        },
      },
    ],
  };
}

/**
 * Transforms recent events into an ActivityTimeline render element.
 * Use this when you have raw event data to display.
 */
export function eventsToTimelineElement(
  events: Array<Pick<SproutUsageEvent, 'eventType' | 'createdAt' | 'sproutId'>>,
  limit = 10
): RenderElement {
  return {
    type: 'ActivityTimeline',
    props: {
      events: events.map(e => ({
        type: e.eventType,
        timestamp: e.createdAt,
        sproutId: e.sproutId,
      })),
      limit,
    },
  };
}

export default signalAggregationToRenderTree;
