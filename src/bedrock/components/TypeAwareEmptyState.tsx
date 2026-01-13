// src/bedrock/components/TypeAwareEmptyState.tsx
// Type-aware empty state for polymorphic consoles
// Sprint: experience-console-cleanup-v1
//
// DEX: Declarative Sovereignty - messages derived from registry

import React from 'react';
import { NoItemsState } from './EmptyState';
import type { ConsoleConfig } from '../types/console.types';
import type { CreateDropdownOption } from './CreateDropdown';
import { getExperienceTypeDefinition, isExperienceObjectType } from '../types/experience.types';

// =============================================================================
// Types
// =============================================================================

export interface TypeAwareEmptyStateProps {
  /** Console configuration */
  config: ConsoleConfig;
  /** Currently active type filter */
  activeTypeFilter?: string;
  /** Available create options */
  createOptions: CreateDropdownOption[];
  /** Create handler for typed creation */
  onCreateTyped: (type: string) => void;
  /** Default create handler */
  onCreateDefault: () => void;
}

// =============================================================================
// Component
// =============================================================================

export const TypeAwareEmptyState: React.FC<TypeAwareEmptyStateProps> = ({
  config,
  activeTypeFilter,
  createOptions,
  onCreateTyped,
  onCreateDefault,
}) => {
  // =========================================================================
  // If filtering by a specific type, show type-specific empty state
  // =========================================================================
  if (activeTypeFilter && isExperienceObjectType(activeTypeFilter)) {
    const typeDef = getExperienceTypeDefinition(activeTypeFilter);

    return (
      <NoItemsState
        icon={typeDef.icon}
        title={`No ${typeDef.label} configs`}
        description={typeDef.description || `Create a ${typeDef.label} to configure this feature.`}
        action={{
          label: `Create ${typeDef.label}`,
          icon: 'add',
          onClick: () => onCreateTyped(activeTypeFilter),
        }}
      />
    );
  }

  // =========================================================================
  // Default empty state (no type filter or unknown type)
  // =========================================================================
  return (
    <NoItemsState
      title={`No ${config.title.toLowerCase()} yet`}
      description="Create your first experience object to get started."
      action={
        config.primaryAction
          ? {
              label: config.primaryAction.label,
              icon: config.primaryAction.icon,
              onClick: onCreateDefault,
            }
          : undefined
      }
    />
  );
};

export default TypeAwareEmptyState;
