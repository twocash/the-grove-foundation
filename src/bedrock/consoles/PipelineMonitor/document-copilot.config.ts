// src/bedrock/consoles/PipelineMonitor/document-copilot.config.ts
// Copilot configuration for document enrichment commands
// Sprint: pipeline-inspector-v1 (Epic 5)

import { CANONICAL_TIERS, type Document, type DocumentTier } from './types';

// =============================================================================
// Types
// =============================================================================

export interface CopilotCommand {
  id: string;
  pattern: RegExp;
  description: string;
  requiresDocument: boolean;
  handler: string;
  preview: boolean;
  compound?: string[];
}

export interface CopilotConfig {
  context: string;
  commands: CopilotCommand[];
  placeholder: string;
  quickActions: Array<{
    id: string;
    label: string;
    icon: string;
    command: string;
  }>;
}

// =============================================================================
// Command Definitions
// =============================================================================

const COMMANDS: CopilotCommand[] = [
  // Extraction commands (require preview)
  {
    id: 'extract-keywords',
    pattern: /^extract\s*keywords?$/i,
    description: 'Extract keywords from document content',
    requiresDocument: true,
    handler: 'handleExtractKeywords',
    preview: true,
  },
  {
    id: 'summarize',
    pattern: /^summar(ize|y)$/i,
    description: 'Generate 2-3 sentence summary',
    requiresDocument: true,
    handler: 'handleSummarize',
    preview: true,
  },
  {
    id: 'extract-entities',
    pattern: /^extract\s*entit(ies|y)$/i,
    description: 'Extract people, organizations, concepts, technologies',
    requiresDocument: true,
    handler: 'handleExtractEntities',
    preview: true,
  },
  {
    id: 'suggest-questions',
    pattern: /^suggest\s*questions?$/i,
    description: 'Suggest questions this document answers',
    requiresDocument: true,
    handler: 'handleSuggestQuestions',
    preview: true,
  },
  {
    id: 'classify-type',
    pattern: /^classify\s*type$/i,
    description: 'Classify document type based on structure',
    requiresDocument: true,
    handler: 'handleClassifyType',
    preview: true,
  },
  {
    id: 'check-freshness',
    pattern: /^check\s*freshness$/i,
    description: 'Analyze temporal markers and suggest temporal class',
    requiresDocument: true,
    handler: 'handleCheckFreshness',
    preview: true,
  },
  // Compound command
  {
    id: 'enrich',
    pattern: /^enrich$/i,
    description: 'Run all extractions (keywords, summary, entities, type)',
    requiresDocument: true,
    handler: 'handleEnrich',
    preview: true,
    compound: ['extract-keywords', 'summarize', 'extract-entities', 'classify-type'],
  },
  // Action commands (no preview)
  {
    id: 'promote',
    pattern: /^promote\s*to\s*(seed|sprout|sapling|tree|grove)$/i,
    description: 'Promote document to specified tier',
    requiresDocument: true,
    handler: 'handlePromote',
    preview: false,
  },
  {
    id: 're-embed',
    pattern: /^re-?embed$/i,
    description: 'Trigger re-embedding with current enrichment',
    requiresDocument: true,
    handler: 'handleReEmbed',
    preview: false,
  },
  // Analysis commands
  {
    id: 'analyze-utility',
    pattern: /^analyze\s*utility$/i,
    description: 'Examine retrieval patterns and utility trends',
    requiresDocument: true,
    handler: 'handleAnalyzeUtility',
    preview: false,
  },
  {
    id: 'find-related',
    pattern: /^find\s*related$/i,
    description: 'Find semantically similar documents',
    requiresDocument: true,
    handler: 'handleFindRelated',
    preview: false,
  },
  // Help command
  {
    id: 'help',
    pattern: /^help$/i,
    description: 'Show available commands',
    requiresDocument: false,
    handler: 'handleHelp',
    preview: false,
  },
];

// =============================================================================
// Configuration Builder
// =============================================================================

export function buildDocumentCopilot(doc: Document | null): CopilotConfig {
  return {
    context: doc ? `Document: ${doc.title}` : 'No document selected',
    commands: COMMANDS,
    placeholder: doc
      ? 'Try: "extract keywords", "summarize", "enrich"'
      : 'Select a document to enable Copilot commands',
    quickActions: doc
      ? [
          { id: 'enrich', label: 'Enrich', icon: 'auto_fix_high', command: 'enrich' },
          { id: 'summarize', label: 'Summarize', icon: 'summarize', command: 'summarize' },
          { id: 'keywords', label: 'Keywords', icon: 'tag', command: 'extract keywords' },
          { id: 'help', label: 'Help', icon: 'help', command: 'help' },
        ]
      : [{ id: 'help', label: 'Help', icon: 'help', command: 'help' }],
  };
}

// =============================================================================
// Command Matcher
// =============================================================================

export function matchCommand(
  input: string
): { command: CopilotCommand; match: RegExpMatchArray } | null {
  const trimmed = input.trim();
  for (const cmd of COMMANDS) {
    const match = trimmed.match(cmd.pattern);
    if (match) {
      return { command: cmd, match };
    }
  }
  return null;
}

// =============================================================================
// Tier Validation
// =============================================================================

export function isValidTierPromotion(
  currentTier: DocumentTier,
  targetTier: DocumentTier
): boolean {
  // Allow any valid tier, no gatekeeping (per ADR-001)
  return CANONICAL_TIERS.includes(targetTier);
}
