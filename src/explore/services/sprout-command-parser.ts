// src/explore/services/sprout-command-parser.ts
// Sprout command detection and parsing
// Sprint: sprout-research-v1, Phase 3a
//
// Detects `sprout:` prefix in user input and extracts the research spark.
// This is the entry point for the Prompt Architect flow.

// =============================================================================
// Types
// =============================================================================

/**
 * Result of parsing user input for sprout command
 */
export interface SproutCommandResult {
  /** Whether input is a sprout command */
  isCommand: boolean;

  /** The research spark (text after "sprout:"), trimmed */
  spark: string;

  /** Original raw input */
  rawInput: string;

  /** Detected command variant (for future extensibility) */
  variant: 'research' | 'capture' | 'none';
}

/**
 * Command prefixes recognized by the parser
 */
export const SPROUT_COMMAND_PREFIXES = [
  'sprout:',
  'research:',
  'investigate:',
] as const;

/**
 * Capture prefixes (legacy, for distinction)
 */
export const CAPTURE_COMMAND_PREFIXES = [
  'capture:',
  'save:',
] as const;

// =============================================================================
// Parser
// =============================================================================

/**
 * Parse user input for sprout command
 *
 * @param input - Raw user input from command console
 * @returns Parsed command result
 *
 * @example
 * parseSproutCommand('sprout: What causes the ratchet effect?')
 * // => { isCommand: true, spark: 'What causes the ratchet effect?', variant: 'research' }
 *
 * @example
 * parseSproutCommand('Tell me about Grove')
 * // => { isCommand: false, spark: '', variant: 'none' }
 */
export function parseSproutCommand(input: string): SproutCommandResult {
  const trimmed = input.trim();
  const lowerInput = trimmed.toLowerCase();

  // Check for research command prefixes
  for (const prefix of SPROUT_COMMAND_PREFIXES) {
    if (lowerInput.startsWith(prefix)) {
      const spark = trimmed.slice(prefix.length).trim();
      return {
        isCommand: true,
        spark,
        rawInput: input,
        variant: 'research',
      };
    }
  }

  // Check for capture command prefixes (legacy distinction)
  for (const prefix of CAPTURE_COMMAND_PREFIXES) {
    if (lowerInput.startsWith(prefix)) {
      const spark = trimmed.slice(prefix.length).trim();
      return {
        isCommand: true,
        spark,
        rawInput: input,
        variant: 'capture',
      };
    }
  }

  // Not a command
  return {
    isCommand: false,
    spark: '',
    rawInput: input,
    variant: 'none',
  };
}

/**
 * Quick check if input is a sprout research command
 * Use this for fast filtering before full parsing
 *
 * @param input - Raw user input
 * @returns true if input starts with a research command prefix
 */
export function isSproutResearchCommand(input: string): boolean {
  const lowerInput = input.trim().toLowerCase();
  return SPROUT_COMMAND_PREFIXES.some(prefix => lowerInput.startsWith(prefix));
}

/**
 * Quick check if input is any sprout command (research or capture)
 *
 * @param input - Raw user input
 * @returns true if input starts with any recognized command prefix
 */
export function isSproutCommand(input: string): boolean {
  const lowerInput = input.trim().toLowerCase();
  return (
    SPROUT_COMMAND_PREFIXES.some(prefix => lowerInput.startsWith(prefix)) ||
    CAPTURE_COMMAND_PREFIXES.some(prefix => lowerInput.startsWith(prefix))
  );
}

/**
 * Validate a spark for minimum requirements
 *
 * @param spark - The extracted spark text
 * @returns Validation result with error message if invalid
 */
export function validateSpark(spark: string): { valid: boolean; error?: string } {
  // Empty spark
  if (!spark || spark.trim().length === 0) {
    return {
      valid: false,
      error: 'Please provide a research question or topic after "sprout:"',
    };
  }

  // Too short (less than 3 words)
  const words = spark.trim().split(/\s+/);
  if (words.length < 3) {
    return {
      valid: false,
      error: 'Please provide more detail for your research spark (at least 3 words)',
    };
  }

  // Too long (over 500 chars)
  if (spark.length > 500) {
    return {
      valid: false,
      error: 'Research spark is too long. Please keep it under 500 characters.',
    };
  }

  return { valid: true };
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Format a spark for display (truncate if needed)
 *
 * @param spark - The spark text
 * @param maxLength - Maximum display length (default 100)
 * @returns Formatted spark with ellipsis if truncated
 */
export function formatSparkForDisplay(spark: string, maxLength = 100): string {
  if (spark.length <= maxLength) return spark;

  const truncated = spark.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  return lastSpace > 50
    ? truncated.slice(0, lastSpace) + '...'
    : truncated + '...';
}
