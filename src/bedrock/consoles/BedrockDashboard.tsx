// src/bedrock/consoles/BedrockDashboard.tsx
// Bedrock Dashboard - Overview console
// Sprint: bedrock-foundation-v1
// Sprint: S10.2-SL-AICuration v3 - Added Quality Analytics Section

import React, { useState, useMemo } from 'react';
import { QualityAnalyticsSection } from './ExperienceConsole/QualityAnalyticsSection';
import type { QualityAnalyticsData, TimeRange } from '@core/schema/quality-analytics';

// =============================================================================
// Mock Data for Quality Analytics (S10.2)
// In production, this would come from a data hook/API
// =============================================================================

const MOCK_QUALITY_ANALYTICS: QualityAnalyticsData = {
  // Summary metrics
  avgScore: 72.4,
  scoreTrend: { direction: 'up', delta: 5.2, percentage: 7.8 },
  totalAssessed: 156,
  assessedTrend: { direction: 'up', delta: 12, percentage: 8.3 },
  aboveThreshold: 111,
  aboveThresholdTrend: { direction: 'up', delta: 8, percentage: 7.7 },
  overrideCount: 7,
  overrideTrend: { direction: 'neutral', delta: 0, percentage: 0 },

  // Dimension breakdown
  dimensions: [
    { name: 'coherence', label: 'Coherence', score: 78, networkAvg: 72 },
    { name: 'evidence', label: 'Evidence', score: 68, networkAvg: 65 },
    { name: 'novelty', label: 'Novelty', score: 71, networkAvg: 68 },
    { name: 'actionability', label: 'Actionability', score: 65, networkAvg: 70 },
  ],

  // Distribution by score range
  distribution: [
    { range: '<50', minScore: 0, maxScore: 49, count: 17, percentage: 10.9 },
    { range: '50-70', minScore: 50, maxScore: 69, count: 40, percentage: 25.6 },
    { range: '70-85', minScore: 70, maxScore: 84, count: 68, percentage: 43.6 },
    { range: '85+', minScore: 85, maxScore: 100, count: 31, percentage: 19.9 },
  ],

  // Time series data
  trendData: [
    { date: '2024-12-20', groveAvg: 68, networkAvg: 70 },
    { date: '2024-12-25', groveAvg: 70, networkAvg: 70 },
    { date: '2024-12-30', groveAvg: 71, networkAvg: 71 },
    { date: '2025-01-05', groveAvg: 74, networkAvg: 71 },
    { date: '2025-01-10', groveAvg: 73, networkAvg: 72 },
    { date: '2025-01-15', groveAvg: 72, networkAvg: 72 },
  ],

  // Network comparison
  networkPercentile: 72,
  networkAvg: 70.1,

  // Metadata
  lastUpdated: new Date().toISOString(),
  timeRange: '30d',
};

export function BedrockDashboard() {
  // Quality analytics state (S10.2)
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [showAnalytics, setShowAnalytics] = useState(true);

  // Simulate data loading (would be replaced with real data hook)
  const analyticsData = useMemo(() => MOCK_QUALITY_ANALYTICS, []);

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Section */}
      <div className="bg-[var(--glass-solid)] rounded-xl p-6 border border-white/5">
        <h2 className="text-xl font-semibold text-[var(--glass-text-primary)] mb-2">
          Welcome to Bedrock
        </h2>
        <p className="text-[var(--glass-text-muted)]">
          Enterprise-class reference implementation of the Trellis/DEX architecture.
          Manage your knowledge garden, craft exploration lenses, and curate the Grove experience.
        </p>
      </div>

      {/* Quality Analytics Dashboard (S10.2) */}
      {showAnalytics && (
        <QualityAnalyticsSection
          data={analyticsData}
          loading={false}
          error={null}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          showNetworkComparison={true}
          title="Quality Analytics"
          compact={false}
        />
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <QuickActionCard
          icon="rate_review"
          title="Review Sprouts"
          description="Review and curate pending knowledge contributions"
          href="/bedrock/garden"
          disabled
        />
        <QuickActionCard
          icon="auto_awesome"
          title="Create Lens"
          description="Design a new exploration lens for users"
          href="/bedrock/lenses"
          disabled
        />
      </div>
    </div>
  );
}

// Quick action card component
interface QuickActionCardProps {
  icon: string;
  title: string;
  description: string;
  href: string;
  disabled?: boolean;
}

function QuickActionCard({ icon, title, description, href, disabled }: QuickActionCardProps) {
  return (
    <div
      className={`
        bg-[var(--glass-solid)] rounded-xl p-4
        border border-white/5
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/10 hover:bg-[var(--glass-elevated)] cursor-pointer'}
        transition-colors
      `}
    >
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-2xl text-[var(--neon-cyan)]">
          {icon}
        </span>
        <div>
          <h3 className="font-medium text-[var(--glass-text-primary)]">
            {title}
          </h3>
          <p className="text-sm text-[var(--glass-text-muted)] mt-1">
            {description}
          </p>
          {disabled && (
            <span className="text-xs text-[var(--neon-amber)] mt-2 inline-block">
              Coming in future sprint
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default BedrockDashboard;
