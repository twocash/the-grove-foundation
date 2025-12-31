// src/bedrock/consoles/BedrockDashboard.tsx
// Bedrock Dashboard - Overview console
// Sprint: bedrock-foundation-v1

import React from 'react';
import { StatCard, MetricsRow } from '../components';

export function BedrockDashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-6 border border-border-light dark:border-border-dark">
        <h2 className="text-xl font-semibold text-foreground-light dark:text-foreground-dark mb-2">
          Welcome to Bedrock
        </h2>
        <p className="text-foreground-muted dark:text-foreground-muted-dark">
          Enterprise-class reference implementation of the Trellis/DEX architecture.
          Manage your knowledge garden, craft exploration lenses, and curate the Grove experience.
        </p>
      </div>

      {/* Metrics Overview */}
      <MetricsRow columns={4}>
        <StatCard
          label="Pending Sprouts"
          value={0}
          icon="eco"
          trend="neutral"
        />
        <StatCard
          label="Active Lenses"
          value={0}
          icon="tune"
          trend="neutral"
        />
        <StatCard
          label="Knowledge Files"
          value={0}
          icon="library_books"
          trend="neutral"
        />
        <StatCard
          label="Today's Sessions"
          value={0}
          icon="group"
          trend="neutral"
        />
      </MetricsRow>

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
        bg-surface-light dark:bg-surface-dark rounded-lg p-4
        border border-border-light dark:border-border-dark
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary cursor-pointer'}
        transition-colors
      `}
    >
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-2xl text-primary">
          {icon}
        </span>
        <div>
          <h3 className="font-medium text-foreground-light dark:text-foreground-dark">
            {title}
          </h3>
          <p className="text-sm text-foreground-muted dark:text-foreground-muted-dark mt-1">
            {description}
          </p>
          {disabled && (
            <span className="text-xs text-amber-600 dark:text-amber-400 mt-2 inline-block">
              Coming in future sprint
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default BedrockDashboard;
