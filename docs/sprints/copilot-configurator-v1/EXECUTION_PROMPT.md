# Execution Prompt: Copilot Configurator v1

**Sprint:** copilot-configurator-v1  
**Repository:** C:\GitHub\the-grove-foundation  
**Handoff Date:** 2024-12-26

---

## Context

You are implementing a **Copilot Configurator** - a natural language interface for editing Grove objects embedded in the Object Inspector. Users speak intent ("set title to X"), and the system generates JSON patches with diff preview.

**Key Files to Reference:**
- `src/shared/inspector/ObjectInspector.tsx` - Integration target
- `src/shared/layout/InspectorPanel.tsx` - Wrapper to extend
- `src/core/schema/grove-object.ts` - Object model types

**Strategic Context:**
This demonstrates that local 7B models can reliably handle configuration editing - the proof point for Grove's Ratchet thesis.

---

## Pre-Execution Verification

```bash
cd C:\GitHub\the-grove-foundation
git status  # Should be clean or on feature branch
npm run build  # Baseline compiles
npm test  # Baseline tests pass
```

---

## Epic 1: Core Infrastructure

### Step 1.1: Create Directory Structure

```bash
mkdir -p src/core/copilot
```

### Step 1.2: Create schema.ts

**File:** `src/core/copilot/schema.ts`

```typescript
// src/core/copilot/schema.ts
// Type definitions for the Copilot Configurator

import type { GroveObject, GroveObjectType } from '@core/schema/grove-object';

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
```

### Step 1.3: Create parser.ts

**File:** `src/core/copilot/parser.ts`

```typescript
// src/core/copilot/parser.ts
// Natural language intent parsing

import type { ParsedIntent, IntentPattern, IntentType } from './schema';

const INTENT_PATTERNS: IntentPattern[] = [
  // SET_FIELD patterns
  {
    regex: /^(?:set|change|update)\s+(?:the\s+)?(\w+)\s+to\s+['"]?(.+?)['"]?$/i,
    intent: 'SET_FIELD',
    extract: (match) => ({ field: match[1].toLowerCase(), value: match[2] }),
  },
  {
    regex: /^(?:make|set)\s+(?:the\s+)?(\w+)\s+['"]?(.+?)['"]?$/i,
    intent: 'SET_FIELD',
    extract: (match) => ({ field: match[1].toLowerCase(), value: match[2] }),
  },
  // UPDATE_FIELD patterns (with modifiers)
  {
    regex: /^(?:make|set)\s+(?:the\s+)?(\w+)\s+(shorter|longer|more\s+\w+|less\s+\w+)$/i,
    intent: 'UPDATE_FIELD',
    extract: (match) => ({ field: match[1].toLowerCase(), modifier: match[2].toLowerCase() }),
  },
  // ADD_TAG patterns
  {
    regex: /^add\s+(?:a\s+)?tag\s+['"]?(.+?)['"]?$/i,
    intent: 'ADD_TAG',
    extract: (match) => ({ value: match[1] }),
  },
  {
    regex: /^tag\s+(?:this\s+)?(?:as\s+)?['"]?(.+?)['"]?$/i,
    intent: 'ADD_TAG',
    extract: (match) => ({ value: match[1] }),
  },
  // REMOVE_TAG patterns
  {
    regex: /^remove\s+(?:the\s+)?tag\s+['"]?(.+?)['"]?$/i,
    intent: 'REMOVE_TAG',
    extract: (match) => ({ value: match[1] }),
  },
  {
    regex: /^untag\s+['"]?(.+?)['"]?$/i,
    intent: 'REMOVE_TAG',
    extract: (match) => ({ value: match[1] }),
  },
  // TOGGLE_FAVORITE patterns
  {
    regex: /^(?:mark|set)\s+(?:as\s+)?favorite$/i,
    intent: 'TOGGLE_FAVORITE',
    extract: () => ({ value: true }),
  },
  {
    regex: /^(?:add\s+to|make)\s+favorites?$/i,
    intent: 'TOGGLE_FAVORITE',
    extract: () => ({ value: true }),
  },
  {
    regex: /^(?:unmark|remove)\s+(?:from\s+)?favorites?$/i,
    intent: 'TOGGLE_FAVORITE',
    extract: () => ({ value: false }),
  },
  {
    regex: /^unfavorite$/i,
    intent: 'TOGGLE_FAVORITE',
    extract: () => ({ value: false }),
  },
];

/**
 * Parse natural language input into a structured intent
 */
export function parseIntent(input: string): ParsedIntent {
  const normalized = input.trim();
  
  for (const pattern of INTENT_PATTERNS) {
    const match = normalized.match(pattern.regex);
    if (match) {
      return {
        type: pattern.intent,
        ...pattern.extract(match),
        confidence: 0.9,
      };
    }
  }

  return { type: 'UNKNOWN', confidence: 0 };
}

/**
 * Check if an intent type is supported
 */
export function isSupportedIntent(type: IntentType): boolean {
  return type !== 'UNKNOWN';
}
```

### Step 1.4: Create patch-generator.ts

**File:** `src/core/copilot/patch-generator.ts`

```typescript
// src/core/copilot/patch-generator.ts
// Generate JSON patches from parsed intents

import type { ParsedIntent, JsonPatch, JsonPatchOperation } from './schema';
import type { GroveObject } from '@core/schema/grove-object';

/**
 * Map of common field names to JSON paths
 */
const FIELD_PATH_MAP: Record<string, string> = {
  // Meta fields
  title: '/meta/title',
  description: '/meta/description',
  icon: '/meta/icon',
  color: '/meta/color',
  status: '/meta/status',
  favorite: '/meta/favorite',
  // Common payload aliases
  duration: '/payload/estimatedMinutes',
  time: '/payload/estimatedMinutes',
  minutes: '/payload/estimatedMinutes',
  tone: '/payload/toneGuidance',
  vocabulary: '/payload/vocabularyLevel',
};

/**
 * Get a value from an object using JSON pointer path
 */
export function getValueAtPath(obj: unknown, path: string): unknown {
  const parts = path.split('/').filter(Boolean);
  let current: unknown = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  
  return current;
}

/**
 * Apply a modifier to a string value (placeholder for real model)
 */
function applyModifier(currentValue: unknown, modifier: string): string {
  const str = String(currentValue || '');
  
  // Placeholder implementations - real model would do better
  if (modifier === 'shorter') {
    // Truncate to ~half
    const words = str.split(' ');
    return words.slice(0, Math.ceil(words.length / 2)).join(' ') + '...';
  }
  
  if (modifier === 'longer') {
    return str + ' [Extended content would be generated by model]';
  }
  
  if (modifier.startsWith('more ')) {
    const quality = modifier.replace('more ', '');
    return `[A more ${quality} version of: "${str}"]`;
  }
  
  return str;
}

/**
 * Generate a JSON patch from a parsed intent
 */
export function generatePatch(
  intent: ParsedIntent,
  object: GroveObject
): JsonPatch {
  switch (intent.type) {
    case 'SET_FIELD': {
      const path = FIELD_PATH_MAP[intent.field!] || `/meta/${intent.field}`;
      return [{ op: 'replace', path, value: intent.value }];
    }

    case 'UPDATE_FIELD': {
      const path = FIELD_PATH_MAP[intent.field!] || `/meta/${intent.field}`;
      const currentValue = getValueAtPath(object, path);
      const newValue = applyModifier(currentValue, intent.modifier!);
      return [{ op: 'replace', path, value: newValue }];
    }

    case 'ADD_TAG': {
      const currentTags = object.meta.tags || [];
      // Check if tag already exists
      if (currentTags.includes(String(intent.value))) {
        return []; // No-op
      }
      return [{ op: 'add', path: '/meta/tags/-', value: intent.value }];
    }

    case 'REMOVE_TAG': {
      const tags = object.meta.tags || [];
      const index = tags.indexOf(String(intent.value));
      if (index === -1) return []; // Tag not found
      return [{ op: 'remove', path: `/meta/tags/${index}` }];
    }

    case 'TOGGLE_FAVORITE': {
      return [{ op: 'replace', path: '/meta/favorite', value: intent.value }];
    }

    default:
      return [];
  }
}

/**
 * Get field name from path for display
 */
export function getFieldNameFromPath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || path;
}
```

### Step 1.5: Create validator.ts

**File:** `src/core/copilot/validator.ts`

```typescript
// src/core/copilot/validator.ts
// Validate JSON patches against object schema

import type { JsonPatch, ValidationResult, ValidationError } from './schema';
import type { GroveObjectType } from '@core/schema/grove-object';

/**
 * Valid paths for meta fields (all object types)
 */
const VALID_META_PATHS = [
  '/meta/title',
  '/meta/description',
  '/meta/icon',
  '/meta/color',
  '/meta/status',
  '/meta/favorite',
  '/meta/tags',
  '/meta/tags/-', // Add to array
];

/**
 * Valid payload paths by object type
 */
const VALID_PAYLOAD_PATHS: Record<string, string[]> = {
  journey: [
    '/payload/entryNode',
    '/payload/targetAha',
    '/payload/linkedHubId',
    '/payload/estimatedMinutes',
  ],
  lens: [
    '/payload/toneGuidance',
    '/payload/arcEmphasis',
    '/payload/vocabularyLevel',
    '/payload/entryPoints',
  ],
  node: [
    '/payload/label',
    '/payload/contextSnippet',
    '/payload/next',
    '/payload/personas',
  ],
  hub: [
    '/payload/tags',
    '/payload/priority',
    '/payload/commonMisconceptions',
    '/payload/primarySource',
  ],
  sprout: [
    '/payload/type',
    '/payload/hubId',
    '/payload/growthStage',
    '/payload/content',
  ],
};

/**
 * Required fields that cannot be removed
 */
const REQUIRED_FIELDS = ['/meta/id', '/meta/type', '/meta/title'];

/**
 * Validate a patch path
 */
function isValidPath(path: string, objectType: GroveObjectType): boolean {
  // Check meta paths
  if (path.startsWith('/meta/')) {
    // Allow array index paths for tags
    if (path.match(/^\/meta\/tags\/\d+$/)) return true;
    return VALID_META_PATHS.includes(path);
  }
  
  // Check payload paths
  if (path.startsWith('/payload/')) {
    const typePaths = VALID_PAYLOAD_PATHS[objectType] || [];
    return typePaths.some(p => path.startsWith(p));
  }
  
  return false;
}

/**
 * Validate a JSON patch against object schema
 */
export function validatePatch(
  patch: JsonPatch,
  objectType: GroveObjectType
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const op of patch) {
    // Check for required field removal
    if (op.op === 'remove' && REQUIRED_FIELDS.includes(op.path)) {
      errors.push({
        path: op.path,
        message: `Cannot remove required field: ${op.path.split('/').pop()}`,
        code: 'REQUIRED_FIELD',
      });
      continue;
    }

    // Check path validity
    if (!isValidPath(op.path, objectType)) {
      errors.push({
        path: op.path,
        message: `Invalid field path: ${op.path}`,
        code: 'INVALID_PATH',
      });
      continue;
    }

    // Type checking for known fields
    if (op.path === '/meta/favorite' && typeof op.value !== 'boolean') {
      errors.push({
        path: op.path,
        message: 'Favorite must be true or false',
        code: 'TYPE_MISMATCH',
      });
    }

    if (op.path === '/payload/estimatedMinutes' && typeof op.value !== 'number') {
      const parsed = parseInt(String(op.value), 10);
      if (isNaN(parsed)) {
        errors.push({
          path: op.path,
          message: 'Duration must be a number',
          code: 'TYPE_MISMATCH',
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### Step 1.6: Create simulator.ts

**File:** `src/core/copilot/simulator.ts`

```typescript
// src/core/copilot/simulator.ts
// Simulated model responses for MVP

import type { ParsedIntent, JsonPatch, ModelConfig, ValidationError } from './schema';
import { getFieldNameFromPath } from './patch-generator';

/**
 * Response templates for different intent types
 */
const RESPONSE_TEMPLATES: Record<string, (...args: unknown[]) => string> = {
  SET_FIELD: (field: string, value: unknown) =>
    `I've drafted a change to set **${field}** to "${value}". How does this look?`,
  
  UPDATE_FIELD: (field: string, modifier: string) =>
    `I've made the ${field} ${modifier}. Here's the proposed change:`,
  
  ADD_TAG: (tag: string) =>
    `I'll add the tag "${tag}" to this object.`,
  
  REMOVE_TAG: (tag: string) =>
    `I'll remove the tag "${tag}" from this object.`,
  
  TOGGLE_FAVORITE_TRUE: () =>
    `I'll mark this as a favorite. ⭐`,
  
  TOGGLE_FAVORITE_FALSE: () =>
    `I'll remove this from your favorites.`,
  
  APPLIED: () =>
    `✓ Changes applied successfully.`,
  
  EMPTY_PATCH: () =>
    `No changes needed - the object already has that value.`,
  
  UNKNOWN: () =>
    `I didn't quite understand that. Try something like:\n` +
    `• "Set title to 'New Title'"\n` +
    `• "Add tag 'important'"\n` +
    `• "Make description shorter"\n` +
    `• "Mark as favorite"`,
  
  VALIDATION_ERROR: (errors: ValidationError[]) =>
    `I can't make that change:\n` +
    errors.map(e => `• ${e.message}`).join('\n'),
};

/**
 * Generate a response message for an intent
 */
export function generateResponseMessage(
  intent: ParsedIntent,
  patch: JsonPatch
): string {
  if (patch.length === 0 && intent.type !== 'UNKNOWN') {
    return RESPONSE_TEMPLATES.EMPTY_PATCH();
  }

  switch (intent.type) {
    case 'SET_FIELD':
      return RESPONSE_TEMPLATES.SET_FIELD(intent.field, intent.value);
    
    case 'UPDATE_FIELD':
      return RESPONSE_TEMPLATES.UPDATE_FIELD(intent.field, intent.modifier);
    
    case 'ADD_TAG':
      return RESPONSE_TEMPLATES.ADD_TAG(String(intent.value));
    
    case 'REMOVE_TAG':
      return RESPONSE_TEMPLATES.REMOVE_TAG(String(intent.value));
    
    case 'TOGGLE_FAVORITE':
      return intent.value
        ? RESPONSE_TEMPLATES.TOGGLE_FAVORITE_TRUE()
        : RESPONSE_TEMPLATES.TOGGLE_FAVORITE_FALSE();
    
    default:
      return RESPONSE_TEMPLATES.UNKNOWN();
  }
}

/**
 * Generate error message for validation failures
 */
export function generateValidationErrorMessage(errors: ValidationError[]): string {
  return RESPONSE_TEMPLATES.VALIDATION_ERROR(errors);
}

/**
 * Generate success message after applying patch
 */
export function generateAppliedMessage(): string {
  return RESPONSE_TEMPLATES.APPLIED();
}

/**
 * Simulate model processing delay
 */
export async function simulateDelay(config: ModelConfig): Promise<void> {
  const [min, max] = config.latencyMs;
  const delay = min + Math.random() * (max - min);
  await new Promise(resolve => setTimeout(resolve, delay));
}
```

### Step 1.7: Create suggestions.ts

**File:** `src/core/copilot/suggestions.ts`

```typescript
// src/core/copilot/suggestions.ts
// Type-specific action suggestions

import type { SuggestedAction } from './schema';
import type { GroveObjectType } from '@core/schema/grove-object';

/**
 * Suggestions organized by object type
 */
const SUGGESTIONS_BY_TYPE: Record<string, SuggestedAction[]> = {
  journey: [
    { label: 'Change title', template: "Set title to ''", icon: 'title' },
    { label: 'Set duration', template: 'Set duration to 10 minutes', icon: 'schedule' },
    { label: 'Update description', template: 'Make description shorter', icon: 'description' },
    { label: 'Add tag', template: "Add tag ''", icon: 'label' },
  ],
  lens: [
    { label: 'Adjust tone', template: 'Make tone more conversational', icon: 'record_voice_over' },
    { label: 'Change vocabulary', template: "Set vocabulary to 'technical'", icon: 'menu_book' },
    { label: 'Update description', template: 'Make description more engaging', icon: 'description' },
  ],
  node: [
    { label: 'Edit label', template: "Set title to ''", icon: 'edit' },
    { label: 'Add tag', template: "Add tag ''", icon: 'label' },
    { label: 'Mark favorite', template: 'Mark as favorite', icon: 'star' },
  ],
  hub: [
    { label: 'Add tag', template: "Add tag ''", icon: 'label' },
    { label: 'Change priority', template: 'Set priority to high', icon: 'priority_high' },
    { label: 'Update description', template: 'Make description clearer', icon: 'description' },
  ],
  sprout: [
    { label: 'Change stage', template: "Set status to 'active'", icon: 'eco' },
    { label: 'Add tag', template: "Add tag ''", icon: 'label' },
    { label: 'Mark favorite', template: 'Mark as favorite', icon: 'star' },
  ],
};

/**
 * Default suggestions for unknown types
 */
const DEFAULT_SUGGESTIONS: SuggestedAction[] = [
  { label: 'Change title', template: "Set title to ''", icon: 'title' },
  { label: 'Add tag', template: "Add tag ''", icon: 'label' },
  { label: 'Mark favorite', template: 'Mark as favorite', icon: 'star' },
];

/**
 * Get suggestions for an object type
 */
export function getSuggestionsForType(type: GroveObjectType): SuggestedAction[] {
  return SUGGESTIONS_BY_TYPE[type] || DEFAULT_SUGGESTIONS;
}

/**
 * Get the welcome message with suggestions
 */
export function getWelcomeMessage(type: GroveObjectType): string {
  const suggestions = getSuggestionsForType(type);
  const examples = suggestions.slice(0, 2).map(s => `"${s.template}"`).join(' or ');
  
  return `I can help you modify this ${type}. Try saying ${examples}.`;
}
```

### Step 1.8: Create index.ts

**File:** `src/core/copilot/index.ts`

```typescript
// src/core/copilot/index.ts
// Public exports for Copilot module

export * from './schema';
export { parseIntent, isSupportedIntent } from './parser';
export { generatePatch, getValueAtPath, getFieldNameFromPath } from './patch-generator';
export { validatePatch } from './validator';
export { 
  generateResponseMessage, 
  generateValidationErrorMessage,
  generateAppliedMessage,
  simulateDelay 
} from './simulator';
export { getSuggestionsForType, getWelcomeMessage } from './suggestions';
```

### Build Gate 1

```bash
npm run build
# Verify no TypeScript errors
```

---

## Epic 2: UI Components

### Step 2.1: Add CSS Tokens

**File:** `src/app/globals.css` (append to existing)

```css
/* ============================================================================
   Copilot Configurator Tokens
   ============================================================================ */

:root {
  /* Panel */
  --copilot-bg: rgba(15, 23, 42, 0.95);
  --copilot-border: rgba(99, 102, 241, 0.3);
  --copilot-header-bg: linear-gradient(to right, rgba(67, 56, 202, 0.4), rgba(15, 23, 42, 1));
  
  /* Messages */
  --copilot-msg-assistant-bg: rgba(67, 56, 202, 0.2);
  --copilot-msg-assistant-border: rgba(99, 102, 241, 0.2);
  --copilot-msg-user-bg: rgba(51, 65, 85, 1);
  --copilot-msg-user-border: rgba(71, 85, 105, 1);
  
  /* Buttons */
  --copilot-btn-primary: rgb(79, 70, 229);
  --copilot-btn-primary-hover: rgb(99, 102, 241);
  --copilot-btn-secondary: rgba(51, 65, 85, 1);
  --copilot-btn-secondary-hover: rgba(71, 85, 105, 1);
  
  /* Diff */
  --copilot-diff-add: rgb(74, 222, 128);
  --copilot-diff-remove: rgb(248, 113, 113);
  --copilot-diff-bg: rgba(8, 12, 20, 1);
  
  /* Model indicator */
  --copilot-model-ready: rgb(34, 197, 94);
  --copilot-model-processing: rgb(251, 191, 36);
}
```

### Step 2.2: Create CopilotMessage.tsx

**File:** `src/shared/inspector/CopilotMessage.tsx`

```typescript
// src/shared/inspector/CopilotMessage.tsx
// Individual message component for Copilot chat

import type { CopilotMessage as CopilotMessageType, JsonPatch } from '@core/copilot';
import { DiffPreview } from './DiffPreview';
import type { GroveObject } from '@core/schema/grove-object';

interface CopilotMessageProps {
  message: CopilotMessageType;
  object: GroveObject;
  onApply?: () => void;
  onRetry?: () => void;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function CopilotMessage({ message, object, onApply, onRetry }: CopilotMessageProps) {
  const isAssistant = message.role === 'assistant';
  const hasPendingPatch = message.patch && message.patchStatus === 'pending';

  return (
    <div className={`flex gap-2 ${isAssistant ? '' : 'justify-end'}`}>
      {isAssistant && (
        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5 shadow-lg shadow-indigo-500/20">
          <span className="material-symbols-outlined text-white text-xs">smart_toy</span>
        </div>
      )}
      
      <div className={`flex flex-col gap-1 ${isAssistant ? 'max-w-[90%]' : 'items-end max-w-[90%]'}`}>
        <div
          className={`rounded-lg p-2.5 text-xs leading-relaxed shadow-sm ${
            isAssistant
              ? 'bg-[var(--copilot-msg-assistant-bg)] border border-[var(--copilot-msg-assistant-border)] rounded-tl-none text-slate-300'
              : 'bg-[var(--copilot-msg-user-bg)] border border-[var(--copilot-msg-user-border)] rounded-tr-none text-white'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
          
          {/* Diff Preview */}
          {message.patch && message.patch.length > 0 && (
            <DiffPreview patch={message.patch} object={object} />
          )}
          
          {/* Action Buttons */}
          {hasPendingPatch && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={onApply}
                className="flex items-center gap-1 bg-[var(--copilot-btn-primary)] hover:bg-[var(--copilot-btn-primary-hover)] text-white px-2 py-1 rounded text-[10px] transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-xs">check</span>
                Apply
              </button>
              <button
                onClick={onRetry}
                className="flex items-center gap-1 bg-[var(--copilot-btn-secondary)] hover:bg-[var(--copilot-btn-secondary-hover)] text-slate-300 px-2 py-1 rounded text-[10px] border border-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-xs">refresh</span>
                Retry
              </button>
            </div>
          )}
          
          {/* Applied indicator */}
          {message.patchStatus === 'applied' && (
            <div className="flex items-center gap-1 mt-2 text-green-400 text-[10px]">
              <span className="material-symbols-outlined text-xs">check_circle</span>
              Applied
            </div>
          )}
        </div>
        
        <div className="text-[10px] text-slate-600">
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
      
      {!isAssistant && (
        <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-slate-300 text-xs">person</span>
        </div>
      )}
    </div>
  );
}
```

### Step 2.3: Create DiffPreview.tsx

**File:** `src/shared/inspector/DiffPreview.tsx`

```typescript
// src/shared/inspector/DiffPreview.tsx
// Visual diff display for proposed changes

import type { JsonPatch } from '@core/copilot';
import { getValueAtPath } from '@core/copilot';
import type { GroveObject } from '@core/schema/grove-object';

interface DiffPreviewProps {
  patch: JsonPatch;
  object: GroveObject;
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return JSON.stringify(value);
  return JSON.stringify(value);
}

export function DiffPreview({ patch, object }: DiffPreviewProps) {
  return (
    <div className="mt-2 bg-[var(--copilot-diff-bg)] border border-slate-800 rounded p-2 font-mono text-[10px] overflow-x-auto">
      {patch.map((op, i) => {
        const currentValue = getValueAtPath(object, op.path);
        
        return (
          <div key={i} className="space-y-1">
            {/* Show old value for replace/remove */}
            {(op.op === 'replace' || op.op === 'remove') && currentValue !== undefined && (
              <div className="flex gap-2 opacity-60 line-through decoration-[var(--copilot-diff-remove)]">
                <span className="text-[var(--copilot-diff-remove)]">-</span>
                <span className="text-slate-400">
                  {truncate(formatValue(currentValue), 60)}
                </span>
              </div>
            )}
            
            {/* Show new value for add/replace */}
            {(op.op === 'add' || op.op === 'replace') && op.value !== undefined && (
              <div className="flex gap-2">
                <span className="text-[var(--copilot-diff-add)]">+</span>
                <span className="text-[var(--copilot-diff-add)]">
                  {truncate(formatValue(op.value), 60)}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

### Step 2.4: Create SuggestedActions.tsx

**File:** `src/shared/inspector/SuggestedActions.tsx`

```typescript
// src/shared/inspector/SuggestedActions.tsx
// Clickable suggestion chips

import type { SuggestedAction } from '@core/copilot';

interface SuggestedActionsProps {
  suggestions: SuggestedAction[];
  onSelect: (template: string) => void;
}

export function SuggestedActions({ suggestions, onSelect }: SuggestedActionsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          onClick={() => onSelect(suggestion.template)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] 
                     bg-indigo-900/40 text-indigo-300 border border-indigo-500/20
                     hover:bg-indigo-800/50 hover:border-indigo-500/40 
                     transition-colors cursor-pointer"
        >
          {suggestion.icon && (
            <span className="material-symbols-outlined text-xs">{suggestion.icon}</span>
          )}
          {suggestion.label}
        </button>
      ))}
    </div>
  );
}
```

### Build Gate 2

```bash
npm run build
# Components compile (not yet wired)
```

---

## Epic 3: State Management

### Step 3.1: Create useCopilot Hook

**File:** `src/shared/inspector/hooks/useCopilot.ts`

```typescript
// src/shared/inspector/hooks/useCopilot.ts
// State management for Copilot Configurator

import { useReducer, useCallback, useEffect, useMemo } from 'react';
import { applyPatch as applyJsonPatch } from 'fast-json-patch';
import type { GroveObject } from '@core/schema/grove-object';
import {
  type CopilotState,
  type CopilotAction,
  type CopilotMessage,
  type ModelConfig,
  type JsonPatch,
  DEFAULT_MODEL,
  parseIntent,
  generatePatch,
  validatePatch,
  generateResponseMessage,
  generateValidationErrorMessage,
  simulateDelay,
  getSuggestionsForType,
  getWelcomeMessage,
} from '@core/copilot';

// ============================================================================
// Reducer
// ============================================================================

function copilotReducer(state: CopilotState, action: CopilotAction): CopilotState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.message],
      };

    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(m =>
          m.id === action.id ? { ...m, ...action.updates } : m
        ),
      };

    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.value };

    case 'TOGGLE_COLLAPSE':
      return { ...state, isCollapsed: !state.isCollapsed };

    case 'SET_MODEL':
      return { ...state, currentModel: action.model };

    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };

    default:
      return state;
  }
}

// ============================================================================
// Initial State
// ============================================================================

function createInitialState(objectType: string): CopilotState {
  const welcomeMessage: CopilotMessage = {
    id: 'welcome',
    role: 'assistant',
    content: getWelcomeMessage(objectType),
    timestamp: new Date(),
    suggestions: getSuggestionsForType(objectType),
  };

  return {
    messages: [welcomeMessage],
    isProcessing: false,
    isCollapsed: sessionStorage.getItem('copilot-collapsed') === 'true',
    currentModel: DEFAULT_MODEL,
  };
}

// ============================================================================
// Hook
// ============================================================================

interface UseCopilotReturn {
  messages: CopilotMessage[];
  isProcessing: boolean;
  isCollapsed: boolean;
  currentModel: ModelConfig;
  sendMessage: (content: string) => Promise<void>;
  applyPatch: (messageId: string) => JsonPatch | null;
  rejectPatch: (messageId: string) => void;
  toggleCollapse: () => void;
  suggestions: { label: string; template: string; icon?: string }[];
}

export function useCopilot(
  object: GroveObject,
  onApplyPatch: (patch: JsonPatch) => void
): UseCopilotReturn {
  const [state, dispatch] = useReducer(
    copilotReducer,
    object.meta.type,
    createInitialState
  );

  // Persist collapse state
  useEffect(() => {
    sessionStorage.setItem('copilot-collapsed', String(state.isCollapsed));
  }, [state.isCollapsed]);

  // Generate unique ID
  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Send a message and process response
  const sendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: CopilotMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_MESSAGE', message: userMessage });
    dispatch({ type: 'SET_PROCESSING', value: true });

    // Parse intent
    const intent = parseIntent(content);

    // Simulate processing delay
    await simulateDelay(state.currentModel);

    if (intent.type === 'UNKNOWN') {
      // Unknown intent
      const errorMessage: CopilotMessage = {
        id: generateId(),
        role: 'assistant',
        content: generateResponseMessage(intent, []),
        timestamp: new Date(),
        suggestions: getSuggestionsForType(object.meta.type),
      };
      dispatch({ type: 'ADD_MESSAGE', message: errorMessage });
    } else {
      // Generate and validate patch
      const patch = generatePatch(intent, object);
      const validation = validatePatch(patch, object.meta.type);

      if (!validation.valid) {
        // Validation failed
        const errorMessage: CopilotMessage = {
          id: generateId(),
          role: 'assistant',
          content: generateValidationErrorMessage(validation.errors),
          timestamp: new Date(),
        };
        dispatch({ type: 'ADD_MESSAGE', message: errorMessage });
      } else if (patch.length === 0) {
        // No changes needed
        const noChangeMessage: CopilotMessage = {
          id: generateId(),
          role: 'assistant',
          content: 'No changes needed - the object already has that value.',
          timestamp: new Date(),
        };
        dispatch({ type: 'ADD_MESSAGE', message: noChangeMessage });
      } else {
        // Valid patch - show preview
        const previewMessage: CopilotMessage = {
          id: generateId(),
          role: 'assistant',
          content: generateResponseMessage(intent, patch),
          timestamp: new Date(),
          patch,
          patchStatus: 'pending',
        };
        dispatch({ type: 'ADD_MESSAGE', message: previewMessage });
      }
    }

    dispatch({ type: 'SET_PROCESSING', value: false });
  }, [object, state.currentModel]);

  // Apply a pending patch
  const applyPatch = useCallback((messageId: string): JsonPatch | null => {
    const message = state.messages.find(m => m.id === messageId);
    if (!message?.patch || message.patchStatus !== 'pending') return null;

    // Update message status
    dispatch({
      type: 'UPDATE_MESSAGE',
      id: messageId,
      updates: { patchStatus: 'applied' },
    });

    // Add confirmation message
    const confirmMessage: CopilotMessage = {
      id: generateId(),
      role: 'assistant',
      content: '✓ Changes applied successfully.',
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_MESSAGE', message: confirmMessage });

    // Notify parent to apply
    onApplyPatch(message.patch);
    
    return message.patch;
  }, [state.messages, onApplyPatch]);

  // Reject a pending patch
  const rejectPatch = useCallback((messageId: string) => {
    dispatch({
      type: 'UPDATE_MESSAGE',
      id: messageId,
      updates: { patchStatus: 'rejected' },
    });
  }, []);

  // Toggle collapse state
  const toggleCollapse = useCallback(() => {
    dispatch({ type: 'TOGGLE_COLLAPSE' });
  }, []);

  // Memoized suggestions
  const suggestions = useMemo(
    () => getSuggestionsForType(object.meta.type),
    [object.meta.type]
  );

  return {
    messages: state.messages,
    isProcessing: state.isProcessing,
    isCollapsed: state.isCollapsed,
    currentModel: state.currentModel,
    sendMessage,
    applyPatch,
    rejectPatch,
    toggleCollapse,
    suggestions,
  };
}
```

### Step 3.2: Create CopilotPanel.tsx

**File:** `src/shared/inspector/CopilotPanel.tsx`

```typescript
// src/shared/inspector/CopilotPanel.tsx
// Main Copilot Configurator panel

import { useState, useRef, useEffect } from 'react';
import type { GroveObject } from '@core/schema/grove-object';
import type { JsonPatch } from '@core/copilot';
import { useCopilot } from './hooks/useCopilot';
import { CopilotMessage } from './CopilotMessage';
import { SuggestedActions } from './SuggestedActions';

interface CopilotPanelProps {
  object: GroveObject;
  onApplyPatch: (patch: JsonPatch) => void;
}

export function CopilotPanel({ object, onApplyPatch }: CopilotPanelProps) {
  const {
    messages,
    isProcessing,
    isCollapsed,
    currentModel,
    sendMessage,
    applyPatch,
    rejectPatch,
    toggleCollapse,
    suggestions,
  } = useCopilot(object, onApplyPatch);

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 80)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionSelect = (template: string) => {
    setInput(template);
    textareaRef.current?.focus();
  };

  // Collapsed state
  if (isCollapsed) {
    return (
      <button
        onClick={toggleCollapse}
        className="w-full h-10 flex items-center justify-center gap-2 
                   bg-gradient-to-r from-indigo-900/40 to-slate-900
                   border-t border-[var(--copilot-border)]
                   text-indigo-300 text-xs hover:bg-indigo-900/50 transition-colors"
      >
        <span className="material-symbols-outlined text-sm animate-pulse">auto_awesome</span>
        <span>Copilot Configurator</span>
        <span className="material-symbols-outlined text-sm">expand_less</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col max-h-[45vh] bg-[var(--copilot-bg)] border-t border-[var(--copilot-border)] shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
      {/* Header */}
      <div
        className="h-8 flex items-center justify-between px-3 
                   bg-gradient-to-r from-indigo-900/40 to-slate-900
                   border-b border-white/5 cursor-pointer"
        onClick={toggleCollapse}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-400 text-sm animate-pulse">
            auto_awesome
          </span>
          <span className="text-xs font-medium text-indigo-100">Copilot Configurator</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20">
            Beta
          </span>
          <button className="text-slate-500 hover:text-white">
            <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#0b1120]">
        {messages.map((message) => (
          <div key={message.id}>
            <CopilotMessage
              message={message}
              object={object}
              onApply={() => applyPatch(message.id)}
              onRetry={() => {
                rejectPatch(message.id);
                // Could trigger retry logic here
              }}
            />
            {/* Show suggestions on welcome message */}
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="ml-8 mt-1">
                <SuggestedActions
                  suggestions={message.suggestions}
                  onSelect={handleSuggestionSelect}
                />
              </div>
            )}
          </div>
        ))}
        
        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex gap-2 items-center text-indigo-400 text-xs">
            <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
            <span>Thinking...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-[#0f172a] border-t border-slate-800">
        <div className="relative flex items-end gap-2 bg-[#1e293b] border border-slate-700 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 rounded-lg p-2 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Copilot to edit configuration..."
            disabled={isProcessing}
            rows={1}
            className="w-full bg-transparent border-none text-xs text-white placeholder-slate-500 focus:ring-0 resize-none py-1 max-h-20"
          />
          <div className="flex gap-1 shrink-0 pb-0.5">
            <button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 disabled:hover:scale-100"
            >
              <span className="material-symbols-outlined text-sm">arrow_upward</span>
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-between items-center mt-1.5 px-1">
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isProcessing
                  ? 'bg-[var(--copilot-model-processing)]'
                  : 'bg-[var(--copilot-model-ready)]'
              }`}
            />
            Model: {currentModel.name}
          </div>
          <div className="text-[10px] text-slate-600">
            Press <span className="bg-slate-800 border border-slate-700 px-1 rounded text-slate-400">Enter</span> to send
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Build Gate 3

```bash
npm run build
npm test
```

---

## Epic 4: Integration

### Step 4.1: Install Dependency

```bash
npm install fast-json-patch
```

### Step 4.2: Modify ObjectInspector.tsx

**File:** `src/shared/inspector/ObjectInspector.tsx`

Replace the entire file with:

```typescript
// src/shared/inspector/ObjectInspector.tsx
// JSON inspector for GroveObjects with Copilot integration

import { useState } from 'react';
import { applyPatch } from 'fast-json-patch';
import type { GroveObject } from '@core/schema/grove-object';
import type { JsonPatch } from '@core/copilot';
import { InspectorPanel, InspectorDivider } from '../layout/InspectorPanel';
import { CopilotPanel } from './CopilotPanel';

interface ObjectInspectorProps {
  object: GroveObject;
  title?: string;
  onClose: () => void;
}

export function ObjectInspector({ object, title, onClose }: ObjectInspectorProps) {
  const [localObject, setLocalObject] = useState<GroveObject>(object);
  const [metaExpanded, setMetaExpanded] = useState(true);
  const [payloadExpanded, setPayloadExpanded] = useState(true);

  const handleApplyPatch = (patch: JsonPatch) => {
    try {
      // Deep clone to avoid mutation
      const cloned = JSON.parse(JSON.stringify(localObject));
      const result = applyPatch(cloned, patch);
      setLocalObject(result.newDocument);
    } catch (error) {
      console.error('Failed to apply patch:', error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(localObject, null, 2));
  };

  const displayTitle = title || localObject.meta.title || 'Object';

  return (
    <InspectorPanel
      title="Object Inspector"
      subtitle={displayTitle}
      icon="data_object"
      iconColor="text-cyan-500"
      iconBg="bg-cyan-950"
      onClose={onClose}
      actions={
        <button
          onClick={copyToClipboard}
          className="w-full py-2 px-3 rounded-lg bg-[var(--glass-elevated)] hover:bg-[var(--glass-border-hover)] border border-[var(--glass-border)] text-sm text-[var(--glass-text-secondary)] flex items-center justify-center gap-2 transition-all hover:border-[var(--neon-cyan)]"
        >
          <span className="material-symbols-outlined text-base">content_copy</span>
          Copy Full JSON
        </button>
      }
      bottomPanel={
        <CopilotPanel object={localObject} onApplyPatch={handleApplyPatch} />
      }
    >
      {/* Meta Section */}
      <CollapsibleSection
        title="META"
        expanded={metaExpanded}
        onToggle={() => setMetaExpanded(!metaExpanded)}
      >
        <JsonBlock data={localObject.meta} />
      </CollapsibleSection>

      <InspectorDivider />

      {/* Payload Section */}
      <CollapsibleSection
        title="PAYLOAD"
        expanded={payloadExpanded}
        onToggle={() => setPayloadExpanded(!payloadExpanded)}
      >
        <JsonBlock data={localObject.payload} />
      </CollapsibleSection>
    </InspectorPanel>
  );
}

// Collapsible section component (unchanged)
interface CollapsibleSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, expanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="px-4 py-3">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full text-left group"
      >
        <span
          className={`material-symbols-outlined text-sm text-slate-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
        >
          chevron_right
        </span>
        <span className="glass-section-header group-hover:text-[var(--glass-text-muted)]">
          {title}
        </span>
      </button>
      {expanded && (
        <div className="mt-3 pl-5 font-mono text-xs leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

// JSON renderer (unchanged)
interface JsonBlockProps {
  data: unknown;
  depth?: number;
}

function JsonBlock({ data, depth = 0 }: JsonBlockProps) {
  if (data === null) {
    return <span className="json-null">null</span>;
  }

  if (typeof data === 'boolean') {
    return <span className="json-boolean">{String(data)}</span>;
  }

  if (typeof data === 'number') {
    return <span className="json-number">{data}</span>;
  }

  if (typeof data === 'string') {
    const display = data.length > 80 ? data.substring(0, 80) + '...' : data;
    return <span className="json-string">"{display}"</span>;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-slate-500">[]</span>;
    return (
      <div className="space-y-1">
        <span className="text-slate-500">[</span>
        <div className="pl-4 border-l border-slate-700/50">
          {data.map((item, i) => (
            <div key={i}>
              <JsonBlock data={item} depth={depth + 1} />
              {i < data.length - 1 && <span className="text-slate-500">,</span>}
            </div>
          ))}
        </div>
        <span className="text-slate-500">]</span>
      </div>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-slate-500">{'{}'}</span>;
    return (
      <div className="space-y-1">
        {entries.map(([key, value], i) => (
          <div key={key} className="flex flex-wrap">
            <span className="json-key">{key}</span>
            <span className="text-slate-500 mr-2">:</span>
            <JsonBlock data={value} depth={depth + 1} />
            {i < entries.length - 1 && <span className="text-slate-500">,</span>}
          </div>
        ))}
      </div>
    );
  }

  return <span className="text-slate-500">{String(data)}</span>;
}

export default ObjectInspector;
```

### Step 4.3: Modify InspectorPanel.tsx

**File:** `src/shared/layout/InspectorPanel.tsx`

Add the `bottomPanel` prop:

```typescript
// src/shared/layout/InspectorPanel.tsx
// Reusable inspector panel wrapper with header and close button

import { type ReactNode } from 'react';

interface InspectorPanelProps {
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  iconBg?: string;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
  bottomPanel?: ReactNode;  // NEW
}

export function InspectorPanel({
  title,
  subtitle,
  icon,
  iconColor = 'text-slate-600 dark:text-slate-300',
  iconBg = 'bg-stone-100 dark:bg-slate-700',
  onClose,
  children,
  actions,
  bottomPanel,  // NEW
}: InspectorPanelProps) {
  return (
    <div className="flex flex-col h-full glass-panel-solid">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--glass-border)] flex-shrink-0 bg-black/20">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
              <span className={`material-symbols-outlined text-lg ${iconColor}`}>{icon}</span>
            </div>
          )}
          <div>
            <span className="font-medium text-sm text-[var(--glass-text-primary)]">{title}</span>
            {subtitle && (
              <p className="text-xs text-[var(--glass-text-muted)]">{subtitle}</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-[var(--glass-text-subtle)] hover:text-[var(--glass-text-secondary)] hover:bg-[var(--glass-elevated)] rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>

      {/* Actions footer */}
      {actions && (
        <div className="p-4 border-t border-[var(--glass-border)] flex-shrink-0 bg-black/20">
          {actions}
        </div>
      )}

      {/* Bottom Panel (Copilot) - NEW */}
      {bottomPanel && (
        <div className="flex-shrink-0">
          {bottomPanel}
        </div>
      )}
    </div>
  );
}

// Reusable section within inspector (unchanged)
interface InspectorSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function InspectorSection({ title, children, className = '' }: InspectorSectionProps) {
  return (
    <div className={`p-5 space-y-4 ${className}`}>
      {title && (
        <h4 className="glass-section-header">
          {title}
        </h4>
      )}
      {children}
    </div>
  );
}

// Divider between sections (unchanged)
export function InspectorDivider() {
  return <div className="border-t border-[var(--glass-border)]" />;
}
```

### Build Gate 4

```bash
npm install
npm run build
npm test
npx playwright test
```

---

## Epic 5: Testing & Polish

### Step 5.1: Create Unit Tests

**File:** `tests/unit/copilot/parser.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { parseIntent } from '../../../src/core/copilot/parser';

describe('parseIntent', () => {
  describe('SET_FIELD', () => {
    it('parses "set title to X"', () => {
      const result = parseIntent("set title to 'New Title'");
      expect(result.type).toBe('SET_FIELD');
      expect(result.field).toBe('title');
      expect(result.value).toBe('New Title');
    });

    it('parses "change description to X"', () => {
      const result = parseIntent('change description to Something new');
      expect(result.type).toBe('SET_FIELD');
      expect(result.field).toBe('description');
      expect(result.value).toBe('Something new');
    });
  });

  describe('ADD_TAG', () => {
    it('parses "add tag X"', () => {
      const result = parseIntent("add tag 'important'");
      expect(result.type).toBe('ADD_TAG');
      expect(result.value).toBe('important');
    });
  });

  describe('TOGGLE_FAVORITE', () => {
    it('parses "mark as favorite"', () => {
      const result = parseIntent('mark as favorite');
      expect(result.type).toBe('TOGGLE_FAVORITE');
      expect(result.value).toBe(true);
    });

    it('parses "unfavorite"', () => {
      const result = parseIntent('unfavorite');
      expect(result.type).toBe('TOGGLE_FAVORITE');
      expect(result.value).toBe(false);
    });
  });

  describe('UNKNOWN', () => {
    it('returns UNKNOWN for gibberish', () => {
      const result = parseIntent('asdfasdf');
      expect(result.type).toBe('UNKNOWN');
      expect(result.confidence).toBe(0);
    });
  });
});
```

### Step 5.2: Manual QA Checklist

Execute these checks manually:

- [ ] Navigate to /explore/journeys
- [ ] Click a journey card to open inspector
- [ ] Verify Copilot panel visible at bottom
- [ ] Verify welcome message with suggestions
- [ ] Type "set title to 'Test Journey'"
- [ ] Verify diff preview shows
- [ ] Click [Apply]
- [ ] Verify JSON updates
- [ ] Type "add tag 'featured'"
- [ ] Verify diff preview
- [ ] Click [Apply]
- [ ] Verify tags array updates
- [ ] Click collapse button
- [ ] Verify panel collapses
- [ ] Refresh page, verify collapse state persisted
- [ ] Click suggestion chip
- [ ] Verify input populated

### Final Build Gate

```bash
npm run build
npm test
npx playwright test
```

---

## Commit Template

```
feat(copilot): add Copilot Configurator to Object Inspector

- Add core infrastructure: parser, patch-generator, validator, simulator
- Add UI components: CopilotPanel, CopilotMessage, DiffPreview
- Add useCopilot hook for state management
- Integrate into ObjectInspector with bottomPanel slot
- Add --copilot-* CSS tokens

Demonstrates local AI can handle configuration editing.

Sprint: copilot-configurator-v1
```

---

## Troubleshooting

### fast-json-patch not found

```bash
npm install fast-json-patch
```

### TypeScript path errors

Ensure `@core/*` alias is configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["./src/core/*"]
    }
  }
}
```

### Material Symbols not rendering

Ensure Google Fonts link in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
```

### Copilot not visible

Check ObjectInspector is receiving a valid GroveObject with `meta.type` field.

---

## Success Verification

Sprint is complete when:

1. ✅ `npm run build` passes
2. ✅ `npm test` passes
3. ✅ Manual QA checklist complete
4. ✅ Copilot panel renders in all inspector types
5. ✅ Edit flow works end-to-end
