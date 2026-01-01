// src/bedrock/types/copilot.types.ts
// Copilot context and patch types for Bedrock
// Sprint: bedrock-foundation-v1 (Epic 1, Story 1.2)

import type { GroveObject, GroveObjectType } from '../../core/schema/grove-object';
import type { CopilotAction } from './console.types';

// =============================================================================
// Patch Operations (JSON Patch format)
// =============================================================================

export type PatchOperationType = 'replace' | 'add' | 'remove';

export interface PatchOperation {
  op: PatchOperationType;
  path: string;           // JSON Pointer format: /payload/description
  value?: unknown;
}

// =============================================================================
// Schema Definitions (for validation)
// =============================================================================

export type SchemaPropertyType = 'string' | 'number' | 'boolean' | 'array' | 'object';

export interface SchemaProperty {
  type: SchemaPropertyType;
  description?: string;
  enum?: string[];
  maxLength?: number;
  minLength?: number;
  minimum?: number;
  maximum?: number;
  items?: SchemaProperty;     // For array types
  required?: boolean;
}

export interface ObjectSchema {
  type: 'object';
  properties: Record<string, SchemaProperty>;
  required: string[];
}

// =============================================================================
// Copilot Context Protocol
// =============================================================================

export interface CopilotContext {
  // Identity
  consoleId: string;

  // Current selection
  selectedObject?: GroveObject;
  selectedObjectType?: GroveObjectType;

  // View state
  filters?: Record<string, unknown>;
  sortOrder?: { field: string; direction: 'asc' | 'desc' };

  // Schema for validation
  schema?: ObjectSchema;

  // Available actions for this console
  availableActions: CopilotAction[];

  // Related objects for reference resolution
  relatedObjects?: Record<GroveObjectType, GroveObject[]>;
}

// =============================================================================
// Copilot State
// =============================================================================

export interface CopilotState {
  isExpanded: boolean;
  isGenerating: boolean;
  pendingPatch: PatchOperation[] | null;
  error: string | null;
  lastInput: string;
}

// =============================================================================
// Copilot Result
// =============================================================================

export interface CopilotGenerationResult {
  success: boolean;
  patch?: PatchOperation[];
  error?: string;
  confidence?: number;        // 0-1 confidence score
  explanation?: string;       // Human-readable explanation of changes
}

// =============================================================================
// Patch History Entry (for undo/redo)
// =============================================================================

export interface PatchHistoryEntry {
  forward: PatchOperation[];   // What was applied
  inverse: PatchOperation[];   // How to undo it
  timestamp: number;
  source: 'user' | 'copilot';
  objectId: string;
}
