// sprout.ts - Capture last response as a sprout
// Sprint: Sprout System

import { Command, CommandResult, CommandContext } from '../CommandRegistry';

/**
 * Parse command flags from /sprout arguments
 *
 * Supports:
 *   /sprout
 *   /sprout --tag=ratchet
 *   /sprout --tags=ratchet,infrastructure
 *   /sprout --tag=ratchet --note="Great explanation"
 */
function parseFlags(args: string): { tags: string[]; notes?: string } {
  const options: { tags: string[]; notes?: string } = { tags: [] };

  if (!args.trim()) return options;

  // Parse --tag=X or --tags=X,Y flags
  const tagMatches = args.matchAll(/--tags?=([^\s"]+|"[^"]*")/g);
  for (const match of tagMatches) {
    const tagValue = match[1].replace(/"/g, '').trim();
    // Support comma-separated tags
    const tags = tagValue.split(',').map(t => t.trim()).filter(Boolean);
    options.tags.push(...tags);
  }

  // Parse --note="X" flag
  const noteMatch = args.match(/--notes?=("[^"]*"|[^\s]+)/);
  if (noteMatch) {
    options.notes = noteMatch[1].replace(/"/g, '').trim();
  }

  return options;
}

export const sproutCommand: Command = {
  id: 'sprout',
  name: 'Sprout',
  description: 'Capture the last response as a sprout',
  aliases: ['capture', 'save'],

  execute: (context: CommandContext, args?: string): CommandResult => {
    // Check if sprout capture is available
    if (!context.captureSprout) {
      return {
        type: 'error',
        message: 'Sprout capture not available'
      };
    }

    // Get last response
    const lastResponse = context.getLastResponse?.();
    if (!lastResponse) {
      return {
        type: 'error',
        message: 'No response to capture. Send a message first!'
      };
    }

    // Parse flags from args
    const options = parseFlags(args || '');

    // Attempt capture
    const success = context.captureSprout(options);

    if (success) {
      // Show success toast
      context.showToast('🌱 Sprout planted!');
      return {
        type: 'action',
        action: 'sprout-captured',
        payload: { tags: options.tags }
      };
    }

    return {
      type: 'error',
      message: 'Failed to capture sprout. Try again.'
    };
  }
};

export default sproutCommand;
