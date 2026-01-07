// src/core/utils/TitleTransforms.ts
// Title transformation utilities for prompts
// Sprint: prompt-refinement-v1
//
// Transforms internal concept names (e.g., "Observer Dynamic") into
// user-facing prompts (e.g., "What is the Observer Dynamic in AI?")

// ============================================================================
// Types
// ============================================================================

export type TitleFormat =
  | 'concept'     // "Observer Dynamic"
  | 'question'    // "What is the Observer Dynamic?"
  | 'exploration' // "Explore the Observer Dynamic"
  | 'insight'     // "Understanding the Observer Dynamic"
  | 'challenge';  // "The Challenge of Observer Dynamic"

export interface TransformOptions {
  /** Target format for transformation */
  format: TitleFormat;
  /** Domain context for better phrasing */
  domain?: 'ai' | 'technology' | 'philosophy' | 'economics' | 'general';
  /** Whether to include "in AI", "in Grove", etc. */
  includeContext?: boolean;
  /** Custom prefix to use */
  prefix?: string;
}

// ============================================================================
// Constants
// ============================================================================

const QUESTION_PREFIXES = [
  'What is',
  'What are',
  'How does',
  'Why is',
  'When did',
  'Who created',
];

const EXPLORATION_PREFIXES = [
  'Explore',
  'Discover',
  'Learn about',
  'Understand',
  'Investigate',
  'Examine',
];

const INSIGHT_PREFIXES = [
  'Understanding',
  'The Nature of',
  'Insights into',
  'Perspectives on',
  'The Essence of',
];

const CHALLENGE_PREFIXES = [
  'The Challenge of',
  'Navigating',
  'Confronting',
  'Addressing',
  'The Problem of',
];

const DOMAIN_CONTEXTS: Record<string, string> = {
  ai: 'in AI',
  technology: 'in technology',
  philosophy: 'in philosophy',
  economics: 'in economics',
  general: '',
};

// ============================================================================
// Core Transformation Functions
// ============================================================================

/**
 * Transform a concept title into the specified format
 */
export function transformTitle(
  title: string,
  options: TransformOptions
): string {
  const { format, domain = 'general', includeContext = false, prefix } = options;
  const cleanTitle = cleanConceptTitle(title);
  const context = includeContext ? ` ${DOMAIN_CONTEXTS[domain] || ''}`.trimEnd() : '';

  switch (format) {
    case 'concept':
      return cleanTitle;

    case 'question':
      const questionPrefix = prefix || selectBestQuestionPrefix(cleanTitle);
      return `${questionPrefix} ${addArticle(cleanTitle)}${context}?`;

    case 'exploration':
      const explorePrefix = prefix || selectRandomPrefix(EXPLORATION_PREFIXES);
      return `${explorePrefix} ${addArticle(cleanTitle)}${context}`;

    case 'insight':
      const insightPrefix = prefix || selectRandomPrefix(INSIGHT_PREFIXES);
      return `${insightPrefix} ${addArticle(cleanTitle)}${context}`;

    case 'challenge':
      const challengePrefix = prefix || selectRandomPrefix(CHALLENGE_PREFIXES);
      return `${challengePrefix} ${cleanTitle}${context}`;

    default:
      return cleanTitle;
  }
}

/**
 * Detect the current format of a title
 */
export function detectTitleFormat(title: string): TitleFormat {
  const lower = title.toLowerCase().trim();

  // Check for question
  if (title.endsWith('?') || QUESTION_PREFIXES.some(p => lower.startsWith(p.toLowerCase()))) {
    return 'question';
  }

  // Check for exploration prefixes
  if (EXPLORATION_PREFIXES.some(p => lower.startsWith(p.toLowerCase()))) {
    return 'exploration';
  }

  // Check for insight prefixes
  if (INSIGHT_PREFIXES.some(p => lower.startsWith(p.toLowerCase()))) {
    return 'insight';
  }

  // Check for challenge prefixes
  if (CHALLENGE_PREFIXES.some(p => lower.startsWith(p.toLowerCase()))) {
    return 'challenge';
  }

  // Default to concept
  return 'concept';
}

/**
 * Convert any title format back to a clean concept name
 */
export function toConceptName(title: string): string {
  let result = title.trim();

  // Remove question mark
  result = result.replace(/\?$/, '');

  // Remove known prefixes
  const allPrefixes = [
    ...QUESTION_PREFIXES,
    ...EXPLORATION_PREFIXES,
    ...INSIGHT_PREFIXES,
    ...CHALLENGE_PREFIXES,
  ];

  for (const prefix of allPrefixes) {
    const regex = new RegExp(`^${prefix}\\s+`, 'i');
    result = result.replace(regex, '');
  }

  // Remove articles at the start
  result = result.replace(/^(the|a|an)\s+/i, '');

  // Remove domain context
  for (const context of Object.values(DOMAIN_CONTEXTS)) {
    if (context) {
      const regex = new RegExp(`\\s+${context}$`, 'i');
      result = result.replace(regex, '');
    }
  }

  // Capitalize first letter of each word
  return result
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate multiple title variants for A/B testing
 */
export function generateVariants(
  conceptTitle: string,
  count: number = 3
): { format: TitleFormat; title: string }[] {
  const formats: TitleFormat[] = ['question', 'exploration', 'insight', 'challenge'];
  const variants: { format: TitleFormat; title: string }[] = [];

  // Shuffle formats for variety
  const shuffled = formats.sort(() => Math.random() - 0.5);

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    variants.push({
      format: shuffled[i],
      title: transformTitle(conceptTitle, { format: shuffled[i] }),
    });
  }

  return variants;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Clean a concept title by removing common artifacts
 */
function cleanConceptTitle(title: string): string {
  let result = title.trim();

  // Remove trailing punctuation
  result = result.replace(/[.!?,:;]+$/, '');

  // Remove common prefixes that shouldn't be in concept names
  result = result.replace(/^(concept:|topic:|idea:|note:)\s*/i, '');

  // Trim whitespace
  return result.trim();
}

/**
 * Add appropriate article (the/a/an) before a title
 */
function addArticle(title: string): string {
  const lower = title.toLowerCase();

  // Don't add article if title already has one
  if (/^(the|a|an)\s+/i.test(title)) {
    return title;
  }

  // Check if title starts with a vowel sound
  const startsWithVowelSound = /^[aeiou]/i.test(lower) ||
    // Special cases like "hour", "honest"
    /^(hour|honest|heir|herb)/i.test(lower);

  // Proper nouns and acronyms typically don't need articles
  if (/^[A-Z]{2,}/.test(title)) {
    return title;
  }

  // Use "the" for most concepts
  return `the ${title}`;
}

/**
 * Select the best question prefix based on the concept
 */
function selectBestQuestionPrefix(concept: string): string {
  const lower = concept.toLowerCase();

  // Plural concepts
  if (lower.endsWith('s') && !lower.endsWith('ss') && !lower.endsWith('ness')) {
    return 'What are';
  }

  // Process/action concepts
  if (lower.includes('process') || lower.includes('method') || lower.includes('approach')) {
    return 'How does';
  }

  // Effect/impact concepts
  if (lower.includes('effect') || lower.includes('impact') || lower.includes('dynamic')) {
    return 'What is';
  }

  // Reason/cause concepts
  if (lower.includes('why') || lower.includes('reason')) {
    return 'Why is';
  }

  // Default
  return 'What is';
}

/**
 * Select a random prefix from a list
 */
function selectRandomPrefix(prefixes: string[]): string {
  return prefixes[Math.floor(Math.random() * prefixes.length)];
}

/**
 * Check if a title is a good user-facing prompt
 * Returns issues if found
 */
export function validatePromptTitle(title: string): string[] {
  const issues: string[] = [];

  // Check length
  if (title.length < 10) {
    issues.push('Title is too short - add more context');
  }
  if (title.length > 100) {
    issues.push('Title is too long - consider shortening');
  }

  // Check for jargon
  const jargonTerms = ['impl', 'impl.', 'todo', 'wip', 'fixme', 'tbd'];
  if (jargonTerms.some(j => title.toLowerCase().includes(j))) {
    issues.push('Title contains developer jargon');
  }

  // Check for internal naming patterns
  if (/^[a-z-]+$/.test(title)) {
    issues.push('Title looks like a slug/ID - needs proper formatting');
  }

  // Check for action words in concept format
  const format = detectTitleFormat(title);
  if (format === 'concept' && /^(the|a|an)\s/i.test(title)) {
    // Concept starting with article is usually fine
  } else if (format === 'concept' && !/[A-Z]/.test(title)) {
    issues.push('Title may need capitalization');
  }

  return issues;
}
