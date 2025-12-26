// src/core/copilot/schema.ts
// Type definitions for the Copilot Configurator

import type { GroveObjectType } from '@core/schema/grove-object';

// ============================================================================
// Message Types
// ============================================================================

export type MessageRole = 'user' | 'assistant' | 'system';

export interface CopilotMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  patch?: JsonPatch;
  patchStatus?: 'pending' | 'applied' | 'rejected';
  suggestions?: SuggestedAction[];
}

// ============================================================================
// Intent Parsing
// ============================================================================

export type IntentType =
  | 'SET_FIELD'
  | 'UPDATE_FIELD'
  | 'ADD_TAG'
  | 'REMOVE_TAG'
  | 'TOGGLE_FAVORITE'
  | 'UNKNOWN';

export interface ParsedIntent {
  type: IntentType;
  field?: string;
  value?: unknown;
  modifier?: string;
  confidence: number;
}

export interface IntentPattern {
  regex: RegExp;
  intent: IntentType;
  extract: (match: RegExpMatchArray) => Partial<ParsedIntent>;
}

// ============================================================================
// JSON Patch (RFC 6902)
// ============================================================================

export interface JsonPatchOperation {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
  path: string;
  value?: unknown;
  from?: string;
}

export type JsonPatch = JsonPatchOperation[];

// ============================================================================
// Suggestions
// ============================================================================

export interface SuggestedAction {
  label: string;
  template: string;
  icon?: string;
}

// ============================================================================
// Validation
// ============================================================================

export type ValidationErrorCode =
  | 'INVALID_PATH'
  | 'TYPE_MISMATCH'
  | 'REQUIRED_FIELD'
  | 'INVALID_VALUE';

export interface ValidationError {
  path: string;
  message: string;
  code: ValidationErrorCode;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// Model Configuration
// ============================================================================

export type ModelType = 'simulated' | 'local' | 'api';

export interface ModelConfig {
  id: string;
  name: string;
  type: ModelType;
  latencyMs: [number, number]; // [min, max]
}

// ============================================================================
// Copilot State
// ============================================================================

export interface CopilotState {
  messages: CopilotMessage[];
  isProcessing: boolean;
  isCollapsed: boolean;
  currentModel: ModelConfig;
}

export type CopilotAction =
  | { type: 'ADD_MESSAGE'; message: CopilotMessage }
  | { type: 'UPDATE_MESSAGE'; id: string; updates: Partial<CopilotMessage> }
  | { type: 'SET_PROCESSING'; value: boolean }
  | { type: 'TOGGLE_COLLAPSE' }
  | { type: 'SET_MODEL'; model: ModelConfig }
  | { type: 'CLEAR_MESSAGES' };

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_MODEL: ModelConfig = {
  id: 'local-7b-simulated',
  name: 'Local 7B (Simulated)',
  type: 'simulated',
  latencyMs: [500, 1500],
};
