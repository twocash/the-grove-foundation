// src/shared/inspector/surface/types.ts
// InspectorSurface interface and related types

import type { GroveObject } from '@core/schema/grove-object';
import type { JsonPatch, CopilotMessage } from '@core/copilot/schema';
import type { VersionActor, VersionSource, ObjectVersion } from '@core/versioning';

// ═══════════════════════════════════════════════════════════════════════════
// ACTION TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Actions that can be dispatched to the Inspector surface.
 *
 * A2UI Mapping: These correspond to userAction types in A2UI.
 */
export type InspectorAction =
  | { type: 'SEND_MESSAGE'; content: string }
  | { type: 'APPLY_PATCH'; messageId: string }
  | { type: 'REJECT_PATCH'; messageId: string }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SET_MODEL'; modelId: string };

/**
 * Handler for Inspector actions.
 */
export type ActionHandler = (action: InspectorAction) => void;

// ═══════════════════════════════════════════════════════════════════════════
// INFO TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Version metadata for display.
 */
export interface VersionInfo {
  ordinal: number;
  lastModifiedAt: string;
  lastModifiedBy: VersionActor;
}

/**
 * Current model information for display.
 */
export interface ModelInfo {
  id: string;
  label: string;
  isSimulated: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// INSPECTOR SURFACE INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Abstract surface for Inspector interactions.
 *
 * This interface enables:
 * 1. Current: React implementation via hooks (ReactInspectorSurface)
 * 2. Future: A2UI implementation if protocol matures
 * 3. Testing: Mock implementations for unit tests
 *
 * ## A2UI Compatibility
 *
 * - dataModel → A2UI data model state
 * - getValue/setValue → A2UI JSON Pointer binding
 * - dispatchAction → A2UI userAction dispatch
 * - onAction → A2UI action handler subscription
 *
 * @template T - Payload type of the GroveObject
 */
export interface InspectorSurface<T = unknown> {
  // ═══════════════════════════════════════════════════════════════
  // DATA MODEL (A2UI: dataModel state)
  // ═══════════════════════════════════════════════════════════════

  /** Current object state */
  readonly dataModel: GroveObject<T>;

  /** Replace entire data model */
  setDataModel(model: GroveObject<T>): void;

  /** Get value at JSON Pointer path (RFC 6901) */
  getValue(path: string): unknown;

  /** Set value at JSON Pointer path */
  setValue(path: string, value: unknown): void;

  // ═══════════════════════════════════════════════════════════════
  // ACTIONS (A2UI: userAction)
  // ═══════════════════════════════════════════════════════════════

  /** Dispatch an action */
  dispatchAction(action: InspectorAction): void;

  /** Subscribe to actions. Returns unsubscribe function. */
  onAction(handler: ActionHandler): () => void;

  // ═══════════════════════════════════════════════════════════════
  // VERSIONING (Grove extension)
  // ═══════════════════════════════════════════════════════════════

  /** Current version metadata (null if unsaved) */
  readonly version: VersionInfo | null;

  /** Apply patch with provenance */
  applyPatch(
    patch: JsonPatch,
    actor: VersionActor,
    source: VersionSource,
    message?: string
  ): Promise<ObjectVersion>;

  // ═══════════════════════════════════════════════════════════════
  // COPILOT (Grove extension)
  // ═══════════════════════════════════════════════════════════════

  /** Chat message history */
  readonly messages: CopilotMessage[];

  /** Current model info */
  readonly currentModel: ModelInfo;

  // ═══════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════

  /** Loading state */
  readonly loading: boolean;

  /** Error state */
  readonly error: Error | null;

  /** Initialize surface */
  initialize(): Promise<void>;

  /** Cleanup */
  dispose(): void;
}
