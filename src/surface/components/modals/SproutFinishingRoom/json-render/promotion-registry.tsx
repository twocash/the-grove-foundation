// src/surface/components/modals/SproutFinishingRoom/json-render/promotion-registry.tsx
// Sprint: S24-SFR sfr-garden-bridge-v1
// Pattern: json-render registry for Garden promotion display
//
// Rule: "Read = json-render. Write = React."
// These components RENDER promotion result data — pure read-only display.
// Design system: GroveSkins (quantum-glass.json) — hex values for reliability.

import React from 'react';
import type { RenderElement } from '@core/json-render';
import type { PromotionStatusProps, PromotionBadgeProps } from './promotion-catalog';

/**
 * Component registry interface (same as Evidence/Research registries)
 */
export interface ComponentRegistry {
  [key: string]: React.FC<{ element: RenderElement }>;
}

/**
 * Format ISO date to readable string
 */
function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Tier display config — icon + color per Garden tier
 * S25-GSE: Migrated from hardcoded hex to semantic CSS variables
 * Mapping: seed→success, sprout→info, sapling→warning, tree→accent-secondary, grove→warning
 */
const TIER_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  seed: { icon: '🌱', color: 'var(--semantic-success, #10b981)', label: 'Seed' },
  sprout: { icon: '🌿', color: 'var(--semantic-info, #06b6d4)', label: 'Sprout' },
  sapling: { icon: '🌳', color: 'var(--semantic-warning, #f59e0b)', label: 'Sapling' },
  tree: { icon: '🏛️', color: 'var(--semantic-accent-secondary, #8b5cf6)', label: 'Tree' },
  grove: { icon: '🏔️', color: 'var(--semantic-warning, #eab308)', label: 'Grove' },
};

/**
 * PromotionRegistry - Maps promotion catalog components to React implementations
 */
export const PromotionRegistry: ComponentRegistry = {
  /**
   * PromotionStatus - Full confirmation card after successful promotion.
   * Shows document identity, tier badge, provenance chain, and metadata.
   * GroveSkins native with hex values for reliability.
   */
  PromotionStatus: ({ element }) => {
    const props = element.props as PromotionStatusProps;
    const tierConfig = TIER_CONFIG[props.tier] || TIER_CONFIG.seed;
    const confidencePercent = Math.round(props.confidenceScore * 100);

    return (
      <div className="rounded-xl border p-6" style={{ borderColor: tierConfig.color + '40', backgroundColor: tierConfig.color + '08' }}>
        {/* Success header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: tierConfig.color + '20' }}>
            {tierConfig.icon}
          </div>
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--glass-text-primary, #fff)' }}>
              Promoted to Garden
            </h3>
            <p className="text-xs font-mono" style={{ color: tierConfig.color }}>
              {tierConfig.label} tier
            </p>
          </div>
        </div>

        {/* Document title */}
        <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--glass-text-body, #e2e8f0)' }}>
          {props.title}
        </p>

        {/* Provenance chain */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-20" style={{ color: 'var(--glass-text-muted, #94a3b8)' }}>Source:</span>
            <span className="font-mono truncate" style={{ color: 'var(--semantic-info, #06b6d4)' }} title={props.sproutId}>
              sprout/{props.sproutId.slice(0, 8)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-20" style={{ color: 'var(--glass-text-muted, #94a3b8)' }}>Template:</span>
            <span style={{ color: 'var(--glass-text-secondary, #cbd5e1)' }}>{props.templateName}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-20" style={{ color: 'var(--glass-text-muted, #94a3b8)' }}>Garden ID:</span>
            <span className="font-mono truncate" style={{ color: 'var(--semantic-info, #06b6d4)' }} title={props.gardenDocId}>
              doc/{props.gardenDocId.slice(0, 8)}
            </span>
          </div>
        </div>

        {/* Footer metadata */}
        <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--glass-border, #1e293b)' }}>
          <span
            className="px-2 py-1 rounded text-xs font-mono"
            style={{
              backgroundColor: confidencePercent >= 70 ? 'var(--semantic-success-bg)' : confidencePercent >= 40 ? 'var(--semantic-warning-bg)' : 'var(--semantic-error-bg)',
              color: confidencePercent >= 70 ? 'var(--semantic-success)' : confidencePercent >= 40 ? 'var(--semantic-warning)' : 'var(--semantic-error)',
            }}
          >
            {confidencePercent}% confidence
          </span>
          <span className="text-xs" style={{ color: 'var(--glass-text-muted, #94a3b8)' }}>
            {formatDate(props.promotedAt)}
          </span>
        </div>
      </div>
    );
  },

  /**
   * PromotionBadge - Compact badge for artifact version tabs.
   * Shows tier icon + label + timestamp.
   * GroveSkins native with hex values.
   */
  PromotionBadge: ({ element }) => {
    const props = element.props as PromotionBadgeProps;
    const tierConfig = TIER_CONFIG[props.tier] || TIER_CONFIG.seed;

    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: tierConfig.color + '15', color: tierConfig.color }}
      >
        <span>{tierConfig.icon}</span>
        <span>{tierConfig.label}</span>
        <span className="font-normal" style={{ color: 'var(--glass-text-muted, #94a3b8)' }}>
          {formatDate(props.promotedAt)}
        </span>
      </span>
    );
  },
};

export default PromotionRegistry;
