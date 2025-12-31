// src/bedrock/primitives/BedrockInspector.tsx
// Inspector panel primitive for Bedrock consoles
// Sprint: bedrock-foundation-v1

import React, { type ReactNode } from 'react';
import { InspectorPanel, InspectorSection, InspectorDivider } from '../../shared/layout';

// =============================================================================
// Types
// =============================================================================

interface BedrockInspectorProps {
  /** Panel title */
  title: string;
  /** Panel subtitle (can be string or React node for badges, etc.) */
  subtitle?: ReactNode;
  /** Material Symbols icon name */
  icon?: string;
  /** Close handler */
  onClose: () => void;
  /** Panel content */
  children: ReactNode;
  /** Footer actions (buttons, etc.) */
  actions?: ReactNode;
  /** Empty state when no item selected */
  emptyState?: ReactNode;
  /** Whether content is loading */
  loading?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function BedrockInspector({
  title,
  subtitle,
  icon,
  onClose,
  children,
  actions,
  emptyState,
  loading,
}: BedrockInspectorProps) {
  // Show empty state if provided and no children
  if (emptyState && !children) {
    return (
      <div className="flex flex-col h-full">
        <InspectorPanel
          title={title}
          subtitle={subtitle}
          icon={icon}
          onClose={onClose}
        >
          <div className="flex items-center justify-center h-full p-8 text-center">
            {emptyState}
          </div>
        </InspectorPanel>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <InspectorPanel
          title={title}
          subtitle={subtitle}
          icon={icon}
          onClose={onClose}
        >
          <div className="flex items-center justify-center h-full p-8">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-sm text-muted-light dark:text-muted-dark">Loading...</span>
            </div>
          </div>
        </InspectorPanel>
      </div>
    );
  }

  return (
    <InspectorPanel
      title={title}
      subtitle={subtitle}
      icon={icon}
      onClose={onClose}
      actions={actions}
    >
      {children}
    </InspectorPanel>
  );
}

// =============================================================================
// Re-export section helpers
// =============================================================================

export { InspectorSection, InspectorDivider };

// =============================================================================
// Additional Section Components
// =============================================================================

interface MetadataSectionProps {
  items: Array<{ label: string; value: ReactNode }>;
}

export function MetadataSection({ items }: MetadataSectionProps) {
  return (
    <InspectorSection title="Metadata">
      <dl className="space-y-3">
        {items.map(({ label, value }) => (
          <div key={label} className="flex justify-between items-start">
            <dt className="text-sm text-muted-light dark:text-muted-dark">{label}</dt>
            <dd className="text-sm text-foreground-light dark:text-foreground-dark text-right max-w-[60%]">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </InspectorSection>
  );
}

interface ActionsSectionProps {
  title?: string;
  children: ReactNode;
}

export function ActionsSection({ title = 'Actions', children }: ActionsSectionProps) {
  return (
    <InspectorSection title={title}>
      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </InspectorSection>
  );
}

export default BedrockInspector;
