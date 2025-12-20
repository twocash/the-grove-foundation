/**
 * Genesis Metrics Aggregation
 * Calculates metrics from localStorage analytics events
 */

import { getAnalyticsReport } from './funnelAnalytics';

export interface GenesisMetrics {
  // Core funnel metrics
  totalSessions: number;
  uniqueVisitors: number;
  avgSessionDuration: number;

  // Funnel progression
  wizardStarts: number;
  wizardCompletions: number;
  wizardDropoffs: number;
  completionRate: number;

  // Engagement depth
  avgExchangesPerSession: number;
  avgCardsVisited: number;
  avgMinutesActive: number;

  // Variant performance
  variantClicks: Record<string, number>;
  variantConversions: Record<string, number>;

  // Top performing content
  topHooks: Array<{ hookText: string; clicks: number }>;
  topSections: Array<{ sectionId: string; interactions: number }>;
}

export interface VariantPerformance {
  variantId: string;
  experimentId: string;
  clicks: number;
  conversions: number;
  conversionRate: number;
}

/**
 * Aggregate metrics from localStorage analytics events
 */
export function aggregateGenesisMetrics(): GenesisMetrics {
  const report = getAnalyticsReport();
  const events = report.recentEvents;

  // Count event types
  const eventCounts = report.eventsByType;

  // Extract variant data
  const variantClicks: Record<string, number> = {};
  const variantConversions: Record<string, number> = {};
  const hookClicks: Record<string, number> = {};
  const sectionInteractions: Record<string, number> = {};

  events.forEach(event => {
    // Track variant clicks
    if (event.properties?.variantId) {
      const vid = event.properties.variantId as string;
      variantClicks[vid] = (variantClicks[vid] || 0) + 1;
    }

    // Track conversions by variant
    if (event.event === 'conversion_completed' && event.properties?.archetypeId) {
      const vid = event.properties.archetypeId as string;
      variantConversions[vid] = (variantConversions[vid] || 0) + 1;
    }

    // Track hook clicks
    if (event.event === 'prompt_hook_clicked' && event.properties?.hookText) {
      const hook = event.properties.hookText as string;
      hookClicks[hook] = (hookClicks[hook] || 0) + 1;
    }

    // Track section interactions
    if (event.properties?.sectionId) {
      const section = event.properties.sectionId as string;
      sectionInteractions[section] = (sectionInteractions[section] || 0) + 1;
    }
  });

  // Calculate top hooks
  const topHooks = Object.entries(hookClicks)
    .map(([hookText, clicks]) => ({ hookText, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  // Calculate top sections
  const topSections = Object.entries(sectionInteractions)
    .map(([sectionId, interactions]) => ({ sectionId, interactions }))
    .sort((a, b) => b.interactions - a.interactions)
    .slice(0, 5);

  // Funnel metrics
  const wizardStarts = eventCounts['wizard_start'] || 0;
  const wizardCompletions = (eventCounts['lens_selected'] || 0);
  const wizardDropoffs = (eventCounts['wizard_abandoned'] || 0);
  const completionRate = wizardStarts > 0 ? (wizardCompletions / wizardStarts) * 100 : 0;

  // Session metrics (estimated from unique session IDs in events)
  const sessionIds = new Set(events.map(e => e.sessionId));

  return {
    totalSessions: sessionIds.size,
    uniqueVisitors: sessionIds.size, // Approximation
    avgSessionDuration: 0, // Would need timestamp analysis

    wizardStarts,
    wizardCompletions,
    wizardDropoffs,
    completionRate: Math.round(completionRate * 10) / 10,

    avgExchangesPerSession: 0, // Would need session grouping
    avgCardsVisited: 0,
    avgMinutesActive: 0,

    variantClicks,
    variantConversions,

    topHooks,
    topSections
  };
}

/**
 * Get variant performance breakdown
 */
export function getVariantPerformance(): VariantPerformance[] {
  const report = getAnalyticsReport();
  const events = report.recentEvents;

  const variantData: Record<string, { clicks: number; conversions: number; experimentId: string }> = {};

  events.forEach(event => {
    if (event.properties?.variantId) {
      const vid = event.properties.variantId as string;
      const expId = (event.properties.experimentId as string) || 'unknown';

      if (!variantData[vid]) {
        variantData[vid] = { clicks: 0, conversions: 0, experimentId: expId };
      }

      variantData[vid].clicks++;

      if (event.event === 'conversion_completed') {
        variantData[vid].conversions++;
      }
    }
  });

  return Object.entries(variantData)
    .map(([variantId, data]) => ({
      variantId,
      experimentId: data.experimentId,
      clicks: data.clicks,
      conversions: data.conversions,
      conversionRate: data.clicks > 0 ? Math.round((data.conversions / data.clicks) * 1000) / 10 : 0
    }))
    .sort((a, b) => b.clicks - a.clicks);
}

export default {
  aggregateGenesisMetrics,
  getVariantPerformance
};
