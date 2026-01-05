// src/bedrock/consoles/PipelineMonitor/copilot-handlers.ts
// Command handlers for document Copilot
// Sprint: pipeline-inspector-v1 (Epic 5)

import {
  CANONICAL_TIERS,
  type Document,
  type DocumentTier,
  type EnrichmentResult,
  type CopilotResult,
} from './types';
import { matchCommand } from './document-copilot.config';

// =============================================================================
// Types
// =============================================================================

export interface HandlerContext {
  document: Document;
  onPreview?: (data: EnrichmentResult) => void;
  onApply?: (updates: Partial<Document>) => Promise<void>;
}

// =============================================================================
// API Helpers
// =============================================================================

async function callEnrichmentAPI(
  documentId: string,
  operations: string[]
): Promise<EnrichmentResult> {
  const response = await fetch('/api/knowledge/enrich', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId, operations }),
  });

  if (!response.ok) {
    throw new Error(`Enrichment failed: ${response.statusText}`);
  }

  const { results } = await response.json();
  return results;
}

async function updateDocument(
  documentId: string,
  updates: Partial<Document>
): Promise<Document> {
  const response = await fetch(`/api/knowledge/documents/${documentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Update failed: ${response.statusText}`);
  }

  const { document } = await response.json();
  return document;
}

// =============================================================================
// Extraction Handlers (return preview data)
// =============================================================================

export async function handleExtractKeywords(
  ctx: HandlerContext
): Promise<CopilotResult> {
  try {
    const results = await callEnrichmentAPI(ctx.document.id, ['keywords']);

    if (ctx.onPreview) {
      ctx.onPreview({ keywords: results.keywords });
    }

    return {
      preview: true,
      data: results.keywords,
      message: `Extracted ${results.keywords?.length || 0} keywords. Review and apply?`,
    };
  } catch (error) {
    return {
      preview: false,
      message: `Failed to extract keywords: ${(error as Error).message}`,
      error: (error as Error).message,
    };
  }
}

export async function handleSummarize(ctx: HandlerContext): Promise<CopilotResult> {
  try {
    const results = await callEnrichmentAPI(ctx.document.id, ['summary']);

    if (ctx.onPreview) {
      ctx.onPreview({ summary: results.summary });
    }

    return {
      preview: true,
      data: results.summary,
      message: `Generated summary:\n\n"${results.summary}"\n\nApply this summary?`,
    };
  } catch (error) {
    return {
      preview: false,
      message: `Failed to generate summary: ${(error as Error).message}`,
      error: (error as Error).message,
    };
  }
}

export async function handleExtractEntities(
  ctx: HandlerContext
): Promise<CopilotResult> {
  try {
    const results = await callEnrichmentAPI(ctx.document.id, ['entities']);

    if (ctx.onPreview) {
      ctx.onPreview({ named_entities: results.named_entities });
    }

    const entities = results.named_entities;
    const counts = [
      `${entities?.people?.length || 0} people`,
      `${entities?.organizations?.length || 0} organizations`,
      `${entities?.concepts?.length || 0} concepts`,
      `${entities?.technologies?.length || 0} technologies`,
    ].join(', ');

    return {
      preview: true,
      data: results.named_entities,
      message: `Extracted entities: ${counts}. Review and apply?`,
    };
  } catch (error) {
    return {
      preview: false,
      message: `Failed to extract entities: ${(error as Error).message}`,
      error: (error as Error).message,
    };
  }
}

export async function handleSuggestQuestions(
  ctx: HandlerContext
): Promise<CopilotResult> {
  try {
    const results = await callEnrichmentAPI(ctx.document.id, ['questions']);

    if (ctx.onPreview) {
      ctx.onPreview({ questions_answered: results.questions_answered });
    }

    const questions = results.questions_answered || [];
    const questionList = questions.map((q: string) => `- ${q}`).join('\n');

    return {
      preview: true,
      data: results.questions_answered,
      message: `Suggested questions:\n\n${questionList}\n\nApply these?`,
    };
  } catch (error) {
    return {
      preview: false,
      message: `Failed to suggest questions: ${(error as Error).message}`,
      error: (error as Error).message,
    };
  }
}

export async function handleClassifyType(
  ctx: HandlerContext
): Promise<CopilotResult> {
  try {
    const results = await callEnrichmentAPI(ctx.document.id, ['type']);

    if (ctx.onPreview) {
      ctx.onPreview({ document_type: results.document_type });
    }

    return {
      preview: true,
      data: results.document_type,
      message: `Classified as: ${results.document_type}. Apply this classification?`,
    };
  } catch (error) {
    return {
      preview: false,
      message: `Failed to classify document: ${(error as Error).message}`,
      error: (error as Error).message,
    };
  }
}

export async function handleCheckFreshness(
  ctx: HandlerContext
): Promise<CopilotResult> {
  try {
    const results = await callEnrichmentAPI(ctx.document.id, ['freshness']);

    if (ctx.onPreview) {
      ctx.onPreview({ temporal_class: results.temporal_class });
    }

    return {
      preview: true,
      data: results.temporal_class,
      message: `Temporal class: ${results.temporal_class}. Apply this classification?`,
    };
  } catch (error) {
    return {
      preview: false,
      message: `Failed to check freshness: ${(error as Error).message}`,
      error: (error as Error).message,
    };
  }
}

// =============================================================================
// Compound Handler
// =============================================================================

export async function handleEnrich(ctx: HandlerContext): Promise<CopilotResult> {
  try {
    const results = await callEnrichmentAPI(ctx.document.id, [
      'keywords',
      'summary',
      'entities',
      'type',
    ]);

    if (ctx.onPreview) {
      ctx.onPreview(results);
    }

    const summary = [
      `Keywords: ${results.keywords?.length || 0}`,
      `Summary: ${results.summary ? 'Generated' : 'None'}`,
      `Type: ${results.document_type || 'Unknown'}`,
      `Entities: ${
        (results.named_entities?.people?.length || 0) +
        (results.named_entities?.organizations?.length || 0) +
        (results.named_entities?.concepts?.length || 0) +
        (results.named_entities?.technologies?.length || 0)
      }`,
    ].join('\n');

    return {
      preview: true,
      data: results,
      message: `Enrichment complete:\n\n${summary}\n\nApply all?`,
    };
  } catch (error) {
    return {
      preview: false,
      message: `Enrichment failed: ${(error as Error).message}`,
      error: (error as Error).message,
    };
  }
}

// =============================================================================
// Action Handlers (no preview, immediate effect)
// =============================================================================

export async function handlePromote(
  ctx: HandlerContext,
  targetTier: DocumentTier
): Promise<CopilotResult> {
  // Validate tier (no gatekeeping, just validation)
  if (!CANONICAL_TIERS.includes(targetTier)) {
    return {
      preview: false,
      message: `Invalid tier: ${targetTier}. Valid tiers: ${CANONICAL_TIERS.join(', ')}`,
      error: 'Invalid tier',
    };
  }

  try {
    await ctx.onApply?.({ tier: targetTier });

    return {
      preview: false,
      message: `Document promoted to ${targetTier}.`,
    };
  } catch (error) {
    return {
      preview: false,
      message: `Promotion failed: ${(error as Error).message}`,
      error: (error as Error).message,
    };
  }
}

export async function handleReEmbed(ctx: HandlerContext): Promise<CopilotResult> {
  try {
    const response = await fetch(`/api/knowledge/documents/${ctx.document.id}/embed`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Re-embedding failed: ${response.statusText}`);
    }

    return {
      preview: false,
      message: 'Re-embedding triggered. Check processing status.',
    };
  } catch (error) {
    return {
      preview: false,
      message: `Re-embedding failed: ${(error as Error).message}`,
      error: (error as Error).message,
    };
  }
}

export async function handleAnalyzeUtility(
  ctx: HandlerContext
): Promise<CopilotResult> {
  const doc = ctx.document;
  const score = doc.utility_score || 0;
  const retrievals = doc.retrieval_count || 0;
  const queries = doc.retrieval_queries?.length || 0;

  const analysis = [
    `Utility Score: ${score.toFixed(2)}`,
    `Total Retrievals: ${retrievals}`,
    `Unique Query Patterns: ${queries}`,
    retrievals > 0 && doc.last_retrieved_at
      ? `Last Retrieved: ${new Date(doc.last_retrieved_at).toLocaleDateString()}`
      : 'Never retrieved',
  ].join('\n');

  return {
    preview: false,
    message: `Usage Analysis:\n\n${analysis}`,
  };
}

export async function handleFindRelated(
  ctx: HandlerContext
): Promise<CopilotResult> {
  try {
    const response = await fetch(
      `/api/knowledge/documents/${ctx.document.id}/related`
    );

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const { documents } = await response.json();

    if (!documents?.length) {
      return {
        preview: false,
        message: 'No related documents found.',
      };
    }

    const list = documents
      .slice(0, 5)
      .map((d: Document) => `- ${d.title} (${d.tier})`)
      .join('\n');

    return {
      preview: false,
      message: `Related documents:\n\n${list}`,
    };
  } catch (error) {
    return {
      preview: false,
      message: `Search failed: ${(error as Error).message}`,
      error: (error as Error).message,
    };
  }
}

// =============================================================================
// Help Handler
// =============================================================================

export function handleHelp(): CopilotResult {
  const categories = {
    'Extraction (preview first)': [
      'extract keywords - Extract keywords from content',
      'summarize - Generate 2-3 sentence summary',
      'extract entities - Extract people, orgs, concepts, tech',
      'suggest questions - Suggest questions this doc answers',
      'classify type - Classify document type',
      'check freshness - Analyze temporal markers',
      'enrich - Run all extractions at once',
    ],
    'Actions (immediate)': [
      'promote to <tier> - Promote to seed/sprout/sapling/tree/grove',
      're-embed - Trigger re-embedding with current metadata',
    ],
    'Analysis': [
      'analyze utility - Show usage statistics',
      'find related - Find semantically similar documents',
    ],
  };

  const helpText = Object.entries(categories)
    .map(([cat, cmds]) => `${cat}:\n${cmds.map((c) => `  ${c}`).join('\n')}`)
    .join('\n\n');

  return {
    preview: false,
    message: `Available Commands:\n\n${helpText}`,
  };
}

// =============================================================================
// Command Dispatcher
// =============================================================================

export async function executeCommand(
  input: string,
  ctx: HandlerContext
): Promise<CopilotResult> {
  const matched = matchCommand(input);

  if (!matched) {
    return {
      preview: false,
      message: `Unknown command: "${input}". Type "help" for available commands.`,
    };
  }

  const { command, match } = matched;

  // Check if document required
  if (command.requiresDocument && !ctx.document) {
    return {
      preview: false,
      message: 'Please select a document first.',
    };
  }

  // Route to handler
  switch (command.id) {
    case 'extract-keywords':
      return handleExtractKeywords(ctx);
    case 'summarize':
      return handleSummarize(ctx);
    case 'extract-entities':
      return handleExtractEntities(ctx);
    case 'suggest-questions':
      return handleSuggestQuestions(ctx);
    case 'classify-type':
      return handleClassifyType(ctx);
    case 'check-freshness':
      return handleCheckFreshness(ctx);
    case 'enrich':
      return handleEnrich(ctx);
    case 'promote':
      const tier = match[1]?.toLowerCase() as DocumentTier;
      return handlePromote(ctx, tier);
    case 're-embed':
      return handleReEmbed(ctx);
    case 'analyze-utility':
      return handleAnalyzeUtility(ctx);
    case 'find-related':
      return handleFindRelated(ctx);
    case 'help':
      return handleHelp();
    default:
      return {
        preview: false,
        message: `Handler not implemented: ${command.id}`,
      };
  }
}
