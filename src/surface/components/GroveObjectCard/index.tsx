// src/surface/components/GroveObjectCard/index.tsx
// Generic card renderer for Grove objects (Pattern 7: Object Model)

import React from 'react';
import { GroveObject } from '@core/schema/grove-object';
import { Journey } from '@core/schema/narrative';
import { CardShell } from './CardShell';
import { JourneyContent } from './JourneyContent';
import { GenericContent } from './GenericContent';

// ============================================================================
// CONTENT RENDERER REGISTRY
// ============================================================================

type ContentRenderer<T = unknown> = React.ComponentType<{ object: GroveObject<T> }>;

const CONTENT_RENDERERS: Record<string, ContentRenderer<unknown>> = {
  journey: ({ object }) => <JourneyContent journey={object.payload as Journey} />,
  // Future: hub, sprout, lens, etc.
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface GroveObjectCardProps {
  object: GroveObject;
  isActive?: boolean;
  isInspected?: boolean;
  onSelect?: () => void;
  onView?: () => void;
  onFavorite?: () => void;
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

export function GroveObjectCard({
  object,
  isActive,
  isInspected,
  onSelect,
  onFavorite,
  variant = 'full',
  className,
}: GroveObjectCardProps) {
  const ContentRenderer = CONTENT_RENDERERS[object.meta.type];

  return (
    <CardShell
      meta={object.meta}
      isActive={isActive}
      isInspected={isInspected}
      onClick={onSelect}
      onFavorite={onFavorite}
      className={className}
    >
      {ContentRenderer ? (
        <ContentRenderer object={object} />
      ) : (
        <GenericContent meta={object.meta} />
      )}
    </CardShell>
  );
}

// Re-export for convenience
export { CardShell } from './CardShell';
export { JourneyContent } from './JourneyContent';
export { GenericContent } from './GenericContent';
export type { GroveObjectCardProps };
