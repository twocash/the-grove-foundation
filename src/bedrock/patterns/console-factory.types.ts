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
  /**
   * Create an object of a specific type (polymorphic consoles only)
   * Sprint: experience-console-cleanup-v1
   */
  createTyped?: (type: string, defaults?: Partial<T>) => Promise<GroveObject<T>>;
}

// =============================================================================
// Polymorphic Console Types
// Sprint: experience-console-cleanup-v1
// =============================================================================

/**
 * Option for the create dropdown in polymorphic consoles
 */
export interface CreateOption {
  /** Unique type identifier */
  type: string;
  /** Human-readable label */
  label: string;
  /** Material Symbols icon name */
  icon: string;
  /** Optional accent color */
  color?: string;
  /** Optional description */
  description?: string;
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
  /** Handler to populate Copilot input (for Fix/Refine flows) */
  onSetCopilotInput?: (input: string) => void;
  /** Handler to change selected object (e.g., after version creation) */
  onSelectObject?: (id: string) => void;
}

// =============================================================================
// Action Handler Interface
// =============================================================================

/**
 * Result from copilot action handler
 * Sprint: copilot-suggestions-hotfix-v1 - added suggestions for clickable actions
 */
export interface CopilotActionResult {
  success: boolean;
  message: string;
  operations?: PatchOperation[];
  suggestions?: SuggestedAction[];
}

/** Clickable suggestion button for Copilot responses */
export interface SuggestedAction {
  label: string;
  template: string;
  icon?: string;
}

/**
 * Context passed to copilot action handler
 */
export interface CopilotActionContext<T> {
  consoleId: string;
  selectedObject: GroveObject<T> | null;
  objects: GroveObject<T>[];
}

/**
 * Async action handler for slash commands (e.g., /make-compelling)
 */
export type CopilotActionHandler<T> = (
  actionId: string,
  userInput: string,
  context: CopilotActionContext<T>
) => Promise<CopilotActionResult | null>;

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

  /** Optional: Async action handler for slash commands */
  actionHandler?: CopilotActionHandler<T>;

  /**
   * Options for create dropdown in polymorphic consoles.
   * If provided, +New button becomes a dropdown menu.
   * Sprint: experience-console-cleanup-v1
   */
  createOptions?: CreateOption[];
}

// =============================================================================
// Console Component Props Interface
// Sprint: extraction-pipeline-integration-v1
// =============================================================================

/**
 * Props accepted by factory-generated console components
 * These allow parent components to control console behavior.
 */
export interface BedrockConsoleProps {
  /**
   * External filters that override/extend internal filter state.
   * Applied in addition to user-selected filters.
   * Useful for review queues, scoped views, etc.
   */
  externalFilters?: Record<string, string | string[]>;

  /**
   * Custom header content to render alongside the primary action button.
   * Rendered to the left of the primary action.
   */
  headerContent?: ReactNode;

  /**
   * External selection control - when set, opens the inspector for this ID.
   * Useful for review queues or other external navigation that needs to
   * trigger inspector for a specific item.
   * Sprint: extraction-pipeline-integration-v1
   */
  externalSelectedId?: string | null;
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
