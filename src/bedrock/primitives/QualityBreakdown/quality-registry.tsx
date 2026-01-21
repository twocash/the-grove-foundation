// src/bedrock/primitives/QualityBreakdown/quality-registry.tsx
// Quality Breakdown Panel - Registry (React Components)
// Sprint: S10.1-SL-AICuration v2 (Display + Filtering)
//
// DEX: json-render pattern - React components for each catalog element type

import React from 'react';
import type {
  QualityRenderElement,
  QualityHeader,
  DimensionBar,
  DimensionGroup,
  MetadataRow,
  MetadataSection,
  NetworkPercentileBadge,
  ConfidenceIndicator,
  ActionButton,
  Divider,
  EmptyState,
  PendingState,
  ErrorState,
} from './quality-catalog';

// =============================================================================
// Grade Color Mapping
// =============================================================================

const GRADE_COLORS = {
  excellent: {
    color: 'var(--semantic-success)',
    backgroundColor: 'var(--semantic-success-bg)',
    barColor: 'var(--semantic-success)',
  },
  good: {
    color: 'var(--semantic-warning)',
    backgroundColor: 'var(--semantic-warning-bg)',
    barColor: 'var(--semantic-warning)',
  },
  fair: {
    color: 'var(--semantic-warning)',
    backgroundColor: 'var(--semantic-warning-bg)',
    barColor: 'var(--semantic-warning)',
  },
  'needs-improvement': {
    color: 'var(--semantic-error)',
    backgroundColor: 'var(--semantic-error-bg)',
    barColor: 'var(--semantic-error)',
  },
};

// =============================================================================
// Component Props Type
// =============================================================================

interface RegistryComponentProps<T extends QualityRenderElement> {
  element: T;
  onAction?: (action: string) => void;
}

// =============================================================================
// Individual Component Renderers
// =============================================================================

/**
 * Quality Header - Overall score with grade badge
 */
function QualityHeaderRenderer({ element }: RegistryComponentProps<QualityHeader>) {
  const { overall, grade, gradeLabel, gradeIcon } = element.props;
  const colors = GRADE_COLORS[grade];

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-3xl" style={{ color: colors.color }}>
          {gradeIcon}
        </span>
        <div>
          <div className="text-3xl font-bold" style={{ color: colors.color }}>
            {Math.round(overall)}
          </div>
          <div className="text-xs text-[var(--glass-text-muted)]">
            Overall Score
          </div>
        </div>
      </div>
      <div
        className="px-3 py-1.5 rounded-lg text-sm font-medium"
        style={{ backgroundColor: colors.backgroundColor, color: colors.color }}
      >
        {gradeLabel}
      </div>
    </div>
  );
}

/**
 * Dimension Bar - Individual quality dimension with progress
 */
function DimensionBarRenderer({ element }: RegistryComponentProps<DimensionBar>) {
  const { label, icon, value, color, grade } = element.props;
  const colors = GRADE_COLORS[grade];
  const roundedValue = Math.round(value);

  return (
    <div className="flex items-center gap-3">
      {/* Icon and label */}
      <div className="flex items-center gap-2 w-28">
        <span
          className="material-symbols-outlined text-base"
          style={{ color }}
        >
          {icon}
        </span>
        <span className="text-sm text-[var(--glass-text-secondary)]">
          {label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex-1 h-2.5 bg-[var(--glass-border)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${roundedValue}%`, backgroundColor: colors.barColor }}
        />
      </div>

      {/* Value */}
      <span className="w-10 text-sm text-right font-medium" style={{ color: colors.color }}>
        {roundedValue}
      </span>
    </div>
  );
}

/**
 * Dimension Group - Container for dimension bars
 */
function DimensionGroupRenderer({ element }: RegistryComponentProps<DimensionGroup>) {
  const { title } = element.props;
  const { children } = element;

  return (
    <div className="space-y-3">
      {title && (
        <h4 className="text-xs font-medium text-[var(--glass-text-muted)] uppercase tracking-wider mb-2">
          {title}
        </h4>
      )}
      {children.map((child, idx) => (
        <DimensionBarRenderer key={idx} element={child} />
      ))}
    </div>
  );
}

/**
 * Metadata Row - Key-value pair
 */
function MetadataRowRenderer({ element }: RegistryComponentProps<MetadataRow>) {
  const { icon, label, value } = element.props;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="material-symbols-outlined text-base text-[var(--glass-text-muted)]">
        {icon}
      </span>
      <span className="text-[var(--glass-text-muted)]">{label}:</span>
      <span className="text-[var(--glass-text-secondary)]">{value}</span>
    </div>
  );
}

/**
 * Metadata Section - Container for metadata rows
 */
function MetadataSectionRenderer({ element }: RegistryComponentProps<MetadataSection>) {
  const { title } = element.props;
  const { children } = element;

  return (
    <div className="space-y-2">
      {title && (
        <h4 className="text-xs font-medium text-[var(--glass-text-muted)] uppercase tracking-wider mb-2">
          {title}
        </h4>
      )}
      {children.map((child, idx) => (
        <MetadataRowRenderer key={idx} element={child} />
      ))}
    </div>
  );
}

/**
 * Network Percentile Badge
 */
function NetworkPercentileBadgeRenderer({ element }: RegistryComponentProps<NetworkPercentileBadge>) {
  const { percentile, label } = element.props;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/30">
      <span className="material-symbols-outlined text-base text-[var(--neon-cyan)]">
        trending_up
      </span>
      <span className="text-sm text-[var(--neon-cyan)] font-medium">
        Top {100 - percentile}%
      </span>
      <span className="text-xs text-[var(--glass-text-muted)]">{label}</span>
    </div>
  );
}

/**
 * Confidence Indicator
 */
function ConfidenceIndicatorRenderer({ element }: RegistryComponentProps<ConfidenceIndicator>) {
  const { confidence, label } = element.props;
  const percent = Math.round(confidence * 100);

  return (
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-base text-[var(--glass-text-muted)]">
        verified
      </span>
      <span className="text-sm text-[var(--glass-text-secondary)]">
        {percent}% {label}
      </span>
    </div>
  );
}

/**
 * Action Button
 */
function ActionButtonRenderer({
  element,
  onAction,
}: RegistryComponentProps<ActionButton>) {
  const { label, icon, variant } = element.props;

  const variantStyles = {
    primary: 'bg-[var(--neon-cyan)] text-black hover:bg-[var(--neon-cyan)]/90',
    secondary: 'bg-[var(--glass-elevated)] text-[var(--glass-text-primary)] border border-[var(--glass-border)] hover:border-[var(--neon-cyan)]/50',
    ghost: 'text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/10',
  };

  return (
    <button
      onClick={() => onAction?.('view-details')}
      className={`
        flex items-center justify-center gap-2 px-4 py-2 rounded-lg
        text-sm font-medium transition-all
        ${variantStyles[variant || 'secondary']}
      `}
    >
      <span>{label}</span>
      {icon && (
        <span className="material-symbols-outlined text-base">{icon}</span>
      )}
    </button>
  );
}

/**
 * Divider
 */
function DividerRenderer({ element }: RegistryComponentProps<Divider>) {
  const { spacing } = element.props;

  const spacingStyles = {
    sm: 'my-2',
    md: 'my-4',
    lg: 'my-6',
  };

  return (
    <div className={`border-t border-[var(--glass-border)] ${spacingStyles[spacing || 'md']}`} />
  );
}

/**
 * Empty State
 */
function EmptyStateRenderer({ element }: RegistryComponentProps<EmptyState>) {
  const { icon, title, description } = element.props;

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <span className="material-symbols-outlined text-4xl text-[var(--glass-text-muted)] mb-3">
        {icon}
      </span>
      <h4 className="text-sm font-medium text-[var(--glass-text-secondary)] mb-1">
        {title}
      </h4>
      {description && (
        <p className="text-xs text-[var(--glass-text-muted)]">{description}</p>
      )}
    </div>
  );
}

/**
 * Pending State
 */
function PendingStateRenderer({ element }: RegistryComponentProps<PendingState>) {
  const { icon, title, description } = element.props;

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <span className="material-symbols-outlined text-4xl text-[var(--neon-amber)] mb-3 animate-pulse">
        {icon}
      </span>
      <h4 className="text-sm font-medium text-[var(--glass-text-secondary)] mb-1">
        {title}
      </h4>
      {description && (
        <p className="text-xs text-[var(--glass-text-muted)]">{description}</p>
      )}
    </div>
  );
}

/**
 * Error State
 */
function ErrorStateRenderer({ element }: RegistryComponentProps<ErrorState>) {
  const { icon, title, message } = element.props;

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <span className="material-symbols-outlined text-4xl mb-3" style={{ color: 'var(--semantic-error)' }}>
        {icon}
      </span>
      <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--semantic-error)' }}>
        {title}
      </h4>
      {message && (
        <p className="text-xs text-[var(--glass-text-muted)]">{message}</p>
      )}
    </div>
  );
}

// =============================================================================
// Registry Export
// =============================================================================

/**
 * Component registry mapping element types to React components
 */
export type QualityComponentRegistry = {
  [K in QualityRenderElement['type']]: React.FC<{
    element: Extract<QualityRenderElement, { type: K }>;
    onAction?: (action: string) => void;
  }>;
};

export const QualityRegistry: QualityComponentRegistry = {
  QualityHeader: QualityHeaderRenderer,
  DimensionBar: DimensionBarRenderer,
  DimensionGroup: DimensionGroupRenderer,
  MetadataRow: MetadataRowRenderer,
  MetadataSection: MetadataSectionRenderer,
  NetworkPercentileBadge: NetworkPercentileBadgeRenderer,
  ConfidenceIndicator: ConfidenceIndicatorRenderer,
  ActionButton: ActionButtonRenderer,
  Divider: DividerRenderer,
  EmptyState: EmptyStateRenderer,
  PendingState: PendingStateRenderer,
  ErrorState: ErrorStateRenderer,
};

// =============================================================================
// Render Function
// =============================================================================

interface RenderElementProps {
  element: QualityRenderElement;
  onAction?: (action: string) => void;
}

/**
 * Renders a single element using the registry
 */
export function renderElement({ element, onAction }: RenderElementProps): React.ReactNode {
  const Component = QualityRegistry[element.type] as React.FC<RenderElementProps>;
  if (!Component) {
    console.warn(`[QualityRegistry] Unknown element type: ${element.type}`);
    return null;
  }
  return <Component element={element as never} onAction={onAction} />;
}

export default QualityRegistry;
