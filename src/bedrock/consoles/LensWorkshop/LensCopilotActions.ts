// src/bedrock/consoles/LensWorkshop/LensCopilotActions.ts
// Lens-specific Copilot action handlers
// Sprint: bedrock-foundation-v1 (Epic 7)

import type { Lens, LensPayload, LensFilter } from '../../types/lens';
import type { PatchOperation } from '../../types/copilot.types';

// =============================================================================
// Types
// =============================================================================

export interface LensCopilotContext {
  consoleId: 'lens-workshop';
  selectedLens: Lens | null;
  lenses: Lens[];
}

export interface CopilotActionResult {
  success: boolean;
  message: string;
  operations?: PatchOperation[];
  suggestedLens?: Partial<LensPayload>;
  testResults?: TestResult[];
}

export interface TestResult {
  query: string;
  matched: boolean;
  confidence: number;
  explanation: string;
}

// =============================================================================
// Action Handlers
// =============================================================================

/**
 * Handle "set X to Y" natural language commands
 * Parses field path and value from user input
 */
export function parseSetCommand(input: string): PatchOperation[] | null {
  // Pattern: "set <field> to <value>"
  const setPattern = /^set\s+(.+?)\s+to\s+(.+)$/i;
  const match = input.match(setPattern);

  if (!match) return null;

  const [, fieldPath, value] = match;
  const normalizedPath = normalizeFieldPath(fieldPath);

  if (!normalizedPath) return null;

  // Determine the value type
  const parsedValue = parseValue(value);

  return [
    {
      op: 'replace',
      path: normalizedPath,
      value: parsedValue,
    },
  ];
}

/**
 * Normalize natural language field references to JSON Pointer paths
 */
function normalizeFieldPath(input: string): string | null {
  const fieldMappings: Record<string, string> = {
    name: '/payload/name',
    title: '/payload/name',
    description: '/payload/description',
    category: '/payload/category',
    active: '/payload/isActive',
    status: '/payload/isActive',
    priority: '/payload/sortPriority',
    'sort priority': '/payload/sortPriority',
    icon: '/payload/iconEmoji',
    emoji: '/payload/iconEmoji',
    color: '/payload/color',
  };

  const normalized = input.toLowerCase().trim();
  return fieldMappings[normalized] || null;
}

/**
 * Parse string value to appropriate type
 */
function parseValue(input: string): unknown {
  const trimmed = input.trim();

  // Remove quotes if present
  const unquoted = trimmed.replace(/^["']|["']$/g, '');

  // Boolean check
  if (unquoted.toLowerCase() === 'true') return true;
  if (unquoted.toLowerCase() === 'false') return false;
  if (unquoted.toLowerCase() === 'yes') return true;
  if (unquoted.toLowerCase() === 'no') return false;
  if (unquoted.toLowerCase() === 'active') return true;
  if (unquoted.toLowerCase() === 'inactive') return false;
  if (unquoted.toLowerCase() === 'draft') return false;

  // Number check
  const num = Number(unquoted);
  if (!isNaN(num) && unquoted !== '') return num;

  // Default to string
  return unquoted;
}

// =============================================================================
// Suggestion Generators
// =============================================================================

/**
 * Generate lens suggestions based on existing data patterns
 */
export function suggestLens(context: LensCopilotContext): Partial<LensPayload> {
  const existingCategories = new Set(
    context.lenses.map((l) => l.payload.category)
  );

  // Suggest a category that's underrepresented
  const categoryPriority: Array<LensPayload['category']> = [
    'role',
    'interest',
    'context',
    'custom',
  ];

  const suggestedCategory =
    categoryPriority.find((c) => !existingCategories.has(c)) || 'custom';

  return {
    name: 'Suggested Lens',
    description: `A ${suggestedCategory}-based lens for filtering content`,
    category: suggestedCategory,
    filters: [],
    sortPriority: 50,
    isActive: false,
  };
}

/**
 * Suggest filter improvements for a lens
 */
export function suggestFilters(lens: Lens): LensFilter[] {
  const suggestions: LensFilter[] = [];

  // If no filters, suggest adding one based on category
  if (!lens.payload.filters || lens.payload.filters.length === 0) {
    switch (lens.payload.category) {
      case 'role':
        suggestions.push({
          field: 'audience',
          operator: 'equals',
          value: 'suggested-audience',
        });
        break;
      case 'interest':
        suggestions.push({
          field: 'tags',
          operator: 'contains',
          value: 'suggested-topic',
        });
        break;
      case 'context':
        suggestions.push({
          field: 'context',
          operator: 'equals',
          value: 'suggested-context',
        });
        break;
    }
  }

  return suggestions;
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate a lens configuration
 */
export function validateLens(lens: Lens): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!lens.payload.name?.trim()) {
    errors.push('Name is required');
  }

  if (lens.payload.name && lens.payload.name.length > 100) {
    errors.push('Name must be 100 characters or less');
  }

  if (lens.payload.description && lens.payload.description.length > 500) {
    errors.push('Description must be 500 characters or less');
  }

  // Category validation
  const validCategories = ['role', 'interest', 'context', 'custom'];
  if (!validCategories.includes(lens.payload.category)) {
    errors.push(`Invalid category: ${lens.payload.category}`);
  }

  // Sort priority validation
  if (
    lens.payload.sortPriority !== undefined &&
    (lens.payload.sortPriority < 0 || lens.payload.sortPriority > 100)
  ) {
    errors.push('Sort priority must be between 0 and 100');
  }

  // Filter validation
  if (lens.payload.filters) {
    lens.payload.filters.forEach((filter, index) => {
      if (!filter.field?.trim()) {
        errors.push(`Filter ${index + 1}: Field is required`);
      }
      if (!filter.operator) {
        errors.push(`Filter ${index + 1}: Operator is required`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =============================================================================
// Test Runner (Simulated)
// =============================================================================

/**
 * Simulate testing a lens against sample queries
 */
export function testLens(lens: Lens): TestResult[] {
  // In a real implementation, this would run actual queries
  // For now, generate simulated results based on lens configuration

  const sampleQueries = [
    `Show me ${lens.payload.category}-focused content`,
    `Find items matching ${lens.payload.name}`,
    `List relevant ${lens.payload.filters?.length || 0} filtered items`,
  ];

  return sampleQueries.map((query) => ({
    query,
    matched: lens.payload.isActive && (lens.payload.filters?.length || 0) > 0,
    confidence: lens.payload.isActive ? 0.85 : 0.3,
    explanation: lens.payload.isActive
      ? 'Lens is active and has configured filters'
      : 'Lens is in draft mode - activate to enable matching',
  }));
}

// =============================================================================
// Action Dispatcher
// =============================================================================

/**
 * Main dispatcher for copilot actions
 */
export async function handleCopilotAction(
  actionId: string,
  context: LensCopilotContext,
  userInput?: string
): Promise<CopilotActionResult> {
  switch (actionId) {
    case 'suggest-lens':
      return {
        success: true,
        message: 'Here are suggested settings for a new lens',
        suggestedLens: suggestLens(context),
      };

    case 'optimize-prompt':
      if (!context.selectedLens) {
        return {
          success: false,
          message: 'Please select a lens first',
        };
      }
      // In real implementation, would call AI to optimize
      return {
        success: true,
        message: 'Prompt optimization suggestions generated',
        operations: [
          {
            op: 'replace',
            path: '/payload/description',
            value: `${context.selectedLens.payload.description} [Optimized by Copilot]`,
          },
        ],
      };

    case 'test-lens':
      if (!context.selectedLens) {
        return {
          success: false,
          message: 'Please select a lens to test',
        };
      }
      return {
        success: true,
        message: 'Test results generated',
        testResults: testLens(context.selectedLens),
      };

    case 'validate':
      if (!context.selectedLens) {
        return {
          success: false,
          message: 'Please select a lens to validate',
        };
      }
      const validation = validateLens(context.selectedLens);
      return {
        success: validation.valid,
        message: validation.valid
          ? 'Lens configuration is valid'
          : `Validation failed: ${validation.errors.join(', ')}`,
      };

    default:
      // Try to parse as a natural language command
      if (userInput) {
        const operations = parseSetCommand(userInput);
        if (operations) {
          return {
            success: true,
            message: 'Patch generated from command',
            operations,
          };
        }
      }

      return {
        success: false,
        message: `Unknown action: ${actionId}`,
      };
  }
}

export default handleCopilotAction;
