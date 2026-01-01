// src/bedrock/patterns/console-factory.types.ts
// Type interfaces for the Bedrock Console Factory
// Sprint: hotfix/console-factory

import type { ReactNode } from 'react';
import type { GroveObject } from '../../core/schema/grove-object';
import type { ConsoleConfig } from '../types/console.types';
import type { PatchOperation } from '../types/copilot.types';

// =============================================================================
// Data Hook Interface
// =============================================================================

/**
 * Result shape from useData hooks
 */
export interface CollectionDataResult<T> {
  /** Array of objects */
  objects: GroveObject<T>[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refetch data */
  refetch: () => void;
  /** Create new object */
  create: (defaults?: Partial<T>) => Promise<GroveObject<T>>;
  /** Update object with patch operations */
  update: (id: string, operations: PatchOperation[]) => Promise<void>;
  /** Delete object */
  remove: (id: string) => Promise<void>;
  /** Duplicate object */
  duplicate: (object: GroveObject<T>) => Promise<GroveObject<T>>;
}

// =============================================================================
// Card Component Interface
// =============================================================================

/**
 * Props passed to card components
 */
export interface ObjectCardProps<T> {
  /** The object to render */
  object: GroveObject<T>;
  /** Whether this card is selected */
  selected: boolean;
  /** Whether this card is favorited */
  isFavorite: boolean;
  /** Click handler */
  onClick: () => void;
  /** Favorite toggle handler */
  onFavoriteToggle: () => void;
  /** Optional: additional class names */
  className?: string;
}

// =============================================================================
// Editor Component Interface
// =============================================================================

/**
 * Props passed to editor components
 */
export interface ObjectEditorProps<T> {
  /** The object being edited */
  object: GroveObject<T>;
  /** Handler for field changes - generates patch operations */
  onEdit: (operations: PatchOperation[]) => void;
  /** Save handler */
  onSave: () => void;
  /** Delete handler */
  onDelete: () => void;
  /** Duplicate handler */
  onDuplicate: () => void;
  /** Whether save is in progress */
  loading: boolean;
  /** Whether there are unsaved changes */
  hasChanges: boolean;
}

// =============================================================================
// Factory Options Interface
// =============================================================================

/**
 * Options for createBedrockConsole factory
 */
export interface BedrockConsoleOptions<T> {
  /** Declarative console configuration */
  config: ConsoleConfig;

  /** Data hook - returns objects and CRUD operations */
  useData: () => CollectionDataResult<T>;

  /** Card component for grid/list view */
  CardComponent: React.ComponentType<ObjectCardProps<T>>;

  /** Editor component for inspector panel */
  EditorComponent: React.ComponentType<ObjectEditorProps<T>>;

  /** Optional: Custom empty state for no objects */
  EmptyStateComponent?: React.ComponentType<{ onCreate: () => void }>;

  /** Optional: Custom copilot title */
  copilotTitle?: string;

  /** Optional: Custom copilot placeholder */
  copilotPlaceholder?: string;
}

// =============================================================================
// Inspector Registration Interface
// =============================================================================

/**
 * Config for opening the inspector panel
 */
export interface InspectorConfig {
  /** Panel title */
  title: string;
  /** Panel subtitle (can be ReactNode for badges) */
  subtitle?: ReactNode;
  /** Material Symbols icon name */
  icon?: string;
  /** Inspector content (the editor) */
  content: ReactNode;
  /** Copilot panel content */
  copilot?: ReactNode;
}

// =============================================================================
// Metric Data Interface
// =============================================================================

/**
 * Computed metric values passed to MetricsRow
 */
export interface MetricData {
  id: string;
  value: number | string;
}
