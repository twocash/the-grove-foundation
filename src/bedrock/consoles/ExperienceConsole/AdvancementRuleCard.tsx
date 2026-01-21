// src/bedrock/consoles/ExperienceConsole/AdvancementRuleCard.tsx
// Card component for Advancement Rule in grid/list view
// Sprint: S7-SL-AutoAdvancement v1
//
// DEX: Organic Scalability - follows established card component pattern

import React from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import type { AdvancementRulePayload } from '@core/schema/advancement';

// Tier style mapping for visual hierarchy (semantic CSS variables)
const TIER_STYLES: Record<string, React.CSSProperties> = {
  seed: { backgroundColor: 'var(--semantic-warning-bg)', color: 'var(--semantic-warning)' },
  sprout: { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' },
  sapling: { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' },
  tree: { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' },
  grove: { backgroundColor: 'var(--semantic-info-bg)', color: 'var(--semantic-info)' },
};

/**
 * Get tier styles with fallback for unknown tiers
 */
function getTierStyle(tier: string): React.CSSProperties {
  return TIER_STYLES[tier] || { backgroundColor: 'var(--glass-panel)', color: 'var(--glass-text-muted)' };
}

/**
 * Card component for displaying an advancement rule in grid/list view
 */
export function AdvancementRuleCard({
  object: rule,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
  className = '',
}: ObjectCardProps<AdvancementRulePayload>) {
  const isEnabled = rule.payload.isEnabled;
  const fromTier = rule.payload.fromTier;
  const toTier = rule.payload.toTier;
  const criteriaCount = rule.payload.criteria.length;
  const logicOperator = rule.payload.logicOperator;

  const fromStyle = getTierStyle(fromTier);
  const toStyle = getTierStyle(toTier);

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl border p-4 cursor-pointer transition-all
        ${selected
          ? 'border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/5 ring-1 ring-[var(--neon-cyan)]/50'
          : 'border-[var(--glass-border)] bg-[var(--glass-solid)] hover:border-[var(--glass-border-bright)] hover:bg-[var(--glass-elevated)]'
        }
        ${className}
      `}
      data-testid="advancement-rule-card"
    >
      {/* Status bar at top */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ backgroundColor: isEnabled ? 'var(--semantic-success)' : 'var(--glass-text-muted)' }}
      />

      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFavoriteToggle();
        }}
        className={`
          absolute top-3 right-3 p-1 rounded-lg transition-colors
          ${isFavorite
            ? 'text-[var(--neon-amber)]'
            : 'text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)]'
          }
        `}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <span className="material-symbols-outlined text-lg">
          {isFavorite ? 'star' : 'star_outline'}
        </span>
      </button>

      {/* Icon and title */}
      <div className="flex items-start gap-3 mb-3 pr-8 mt-2">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: isEnabled ? 'var(--semantic-success-bg)' : 'var(--glass-panel)' }}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ color: isEnabled ? 'var(--semantic-success)' : 'var(--glass-text-muted)' }}
          >
            trending_up
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
            {rule.meta.title}
          </h3>
          {/* Tier transition visualization */}
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded text-xs font-medium" style={fromStyle}>
              {fromTier}
            </span>
            <span className="material-symbols-outlined text-sm text-[var(--glass-text-muted)]">
              arrow_forward
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-medium" style={toStyle}>
              {toTier}
            </span>
          </div>
        </div>
      </div>

      {/* Description preview */}
      {rule.meta.description && (
        <p className="text-sm text-[var(--glass-text-secondary)] line-clamp-2 mb-3">
          {rule.meta.description}
        </p>
      )}

      {/* Criteria indicator */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
          style={criteriaCount > 0
            ? { backgroundColor: 'var(--semantic-info-bg)', color: 'var(--semantic-info)' }
            : { backgroundColor: 'var(--glass-panel)', color: 'var(--glass-text-muted)' }
          }
        >
          <span className="material-symbols-outlined text-xs">checklist</span>
          {criteriaCount} {criteriaCount === 1 ? 'criterion' : 'criteria'}
        </span>

        {criteriaCount > 1 && (
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
            style={logicOperator === 'AND'
              ? { backgroundColor: 'var(--semantic-accent-secondary-bg)', color: 'var(--semantic-accent-secondary)' }
              : { backgroundColor: 'var(--semantic-warning-bg)', color: 'var(--semantic-warning)' }
            }
          >
            {logicOperator}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span
          className="px-2 py-0.5 rounded-full"
          style={isEnabled
            ? { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }
            : { backgroundColor: 'var(--glass-panel)', color: 'var(--glass-text-muted)' }
          }
        >
          {isEnabled ? 'Enabled' : 'Disabled'}
        </span>
        <span className="text-[var(--glass-text-muted)]">
          {rule.payload.lifecycleModelId}
        </span>
      </div>
    </div>
  );
}

export default AdvancementRuleCard;
