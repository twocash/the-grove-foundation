// src/core/copilot/PromptQAActions.ts
// QA validation actions for prompts
// Sprint: prompt-refinement-v1

import type { SuggestedAction } from './schema';
import type { QAIssue, QAIssueType } from '@core/schema/prompt';

// ============================================================================
// QA-Specific Suggestions
// ============================================================================

/**
 * QA-specific actions for prompts
 * These are shown when a prompt has QA issues or needs validation
 */
export const QA_SUGGESTIONS: SuggestedAction[] = [
  {
    label: 'Run QA check',
    template: 'Run QA validation',
    icon: 'fact_check'
  },
  {
    label: 'Make compelling',
    template: 'Make this prompt more compelling and actionable',
    icon: 'auto_awesome'
  },
  {
    label: 'Add context',
    template: 'Add more context to help users understand this topic',
    icon: 'description'
  },
  {
    label: 'Simplify',
    template: 'Simplify this prompt for broader audience',
    icon: 'compress'
  },
];

/**
 * Issue-specific fix suggestions
 * Maps QA issue types to suggested fixes
 */
export const ISSUE_FIX_SUGGESTIONS: Record<QAIssueType, SuggestedAction[]> = {
  missing_context: [
    {
      label: 'Add background',
      template: 'Add background context explaining what this concept means',
      icon: 'help'
    },
    {
      label: 'Define terms',
      template: 'Add definitions for technical terms used in this prompt',
      icon: 'menu_book'
    },
  ],
  ambiguous_intent: [
    {
      label: 'Clarify goal',
      template: 'Make the exploration goal clearer and more specific',
      icon: 'center_focus_strong'
    },
    {
      label: 'Add question',
      template: 'Phrase as a clear question to explore',
      icon: 'help_center'
    },
  ],
  too_broad: [
    {
      label: 'Narrow focus',
      template: 'Focus on one specific aspect of this topic',
      icon: 'zoom_in'
    },
    {
      label: 'Split prompt',
      template: 'Consider splitting into multiple focused prompts',
      icon: 'call_split'
    },
  ],
  too_narrow: [
    {
      label: 'Broaden scope',
      template: 'Expand the scope to encourage deeper exploration',
      icon: 'zoom_out'
    },
    {
      label: 'Add connections',
      template: 'Connect this to related concepts',
      icon: 'hub'
    },
  ],
  source_mismatch: [
    {
      label: 'Align with source',
      template: 'Align the prompt more closely with the source document',
      icon: 'sync'
    },
    {
      label: 'Update reference',
      template: 'Update to reference the correct source material',
      icon: 'link'
    },
  ],
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get suggestions based on current QA issues
 */
export function getSuggestionsForIssues(issues: QAIssue[]): SuggestedAction[] {
  if (issues.length === 0) {
    return QA_SUGGESTIONS;
  }

  // Prioritize error issues first
  const errorIssues = issues.filter(i => i.severity === 'error');
  const warningIssues = issues.filter(i => i.severity === 'warning');

  const suggestions: SuggestedAction[] = [];

  // Add fix suggestions for errors first
  for (const issue of errorIssues.slice(0, 2)) {
    const fixes = ISSUE_FIX_SUGGESTIONS[issue.type];
    if (fixes?.length > 0) {
      suggestions.push(fixes[0]);
    }
  }

  // Add fix suggestions for warnings
  for (const issue of warningIssues.slice(0, 1)) {
    const fixes = ISSUE_FIX_SUGGESTIONS[issue.type];
    if (fixes?.length > 0 && !suggestions.some(s => s.label === fixes[0].label)) {
      suggestions.push(fixes[0]);
    }
  }

  // Fill remaining slots with general QA suggestions
  const remaining = 4 - suggestions.length;
  for (let i = 0; i < remaining && i < QA_SUGGESTIONS.length; i++) {
    if (!suggestions.some(s => s.label === QA_SUGGESTIONS[i].label)) {
      suggestions.push(QA_SUGGESTIONS[i]);
    }
  }

  return suggestions;
}

/**
 * Get welcome message for QA mode
 */
export function getQAWelcomeMessage(score?: number, issueCount?: number): string {
  if (score === undefined) {
    return 'I can help you validate and improve this prompt. Try saying "Run QA validation" to check quality.';
  }

  if (score >= 80 && (issueCount ?? 0) === 0) {
    return `This prompt scores ${score}/100 with no issues. Would you like to make it even more compelling?`;
  }

  if (score >= 60) {
    return `This prompt scores ${score}/100 with ${issueCount} issue${issueCount === 1 ? '' : 's'}. I can help you fix them.`;
  }

  return `This prompt needs attention (${score}/100). Let me help you improve it - try "Make this more compelling".`;
}

/**
 * Generate auto-fix patch for an issue
 * Returns null if no auto-fix is available
 */
export function generateAutoFixPatch(issue: QAIssue, currentPrompt: string): {
  path: string;
  value: string;
} | null {
  // For types we can auto-fix, we only need autoFixAvailable to be true
  // suggestedFix from Claude is optional - we have our own logic
  const AUTO_FIXABLE_TYPES = ['too_broad', 'ambiguous_intent', 'missing_context'];

  if (!issue.autoFixAvailable) {
    return null;
  }

  // If we can't auto-fix this type and Claude didn't provide a suggestion, bail
  if (!AUTO_FIXABLE_TYPES.includes(issue.type) && !issue.suggestedFix) {
    return null;
  }

  // Simple auto-fixes based on issue type
  switch (issue.type) {
    case 'too_broad':
      // Add focus qualifier
      return {
        path: '/payload/executionPrompt',
        value: `Specifically, ${currentPrompt.toLowerCase()}`,
      };

    case 'ambiguous_intent':
      // Phrase as a question
      if (!currentPrompt.endsWith('?')) {
        return {
          path: '/payload/executionPrompt',
          value: `What can we learn about ${currentPrompt.replace(/^(the|a|an)\s+/i, '')}?`,
        };
      }
      break;

    case 'missing_context':
      // Add context request prefix
      return {
        path: '/payload/executionPrompt',
        value: `Given the context of the Grove vision, ${currentPrompt}`,
      };

    // Other issue types would need more context/AI assistance
    default:
      return null;
  }

  return null;
}

// ============================================================================
// Copilot Starter Prompts
// Sprint: prompt-refinement-v1
// ============================================================================

/**
 * Generate a starter prompt for the Copilot input when user clicks "Refine"
 * Uses the "prepend execution with" command format - prepends improvement to existing prompt.
 * This is cleaner UX than replacing the whole prompt.
 *
 * @see HOTFIX_COPILOT_FIX_FLOW.md
 * Sprint: prompt-wiring-v1
 */
export function generateCopilotStarterPrompt(issue: QAIssue, _currentPrompt: string): string {
  // Get a hint based on issue type
  const hint = getIssueHint(issue.type);

  // Format: "prepend execution with: [hint]"
  // Prepends the hint to the existing execution prompt
  return `prepend execution with: ${hint}`;
}

/**
 * Get a prefix hint based on issue type
 */
function getIssueHint(issueType: QAIssueType): string {
  switch (issueType) {
    case 'too_broad':
      return 'Specifically, ';
    case 'ambiguous_intent':
      return 'What can we learn about ';
    case 'missing_context':
      return 'Given the context of the Grove vision, ';
    case 'too_narrow':
      return 'More broadly, ';
    case 'source_mismatch':
      return 'Based on the source material, ';
    default:
      return '';
  }
}
