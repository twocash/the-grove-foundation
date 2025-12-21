// sprout.ts - Command Sketch
// Sprint: Sprout System
// Location: components/Terminal/CommandInput/commands/sprout.ts

import { Command, CommandResult, CommandContext } from '../CommandRegistry';

// Extended context interface (to be added to CommandRegistry)
interface ExtendedCommandContext extends CommandContext {
  getLastResponse: () => { text: string; query: string } | null;
  getSessionContext: () => {
    personaId: string | null;
    journeyId: string | null;
    hubId: string | null;
    nodeId: string | null;
  };
  captureSprout: (options?: { tags?: string[]; notes?: string }) => boolean;
}

export const sproutCommand: Command = {
  id: 'sprout',
  name: 'Sprout',
  description: 'Capture the last response as a sprout',
  aliases: ['capture', 'save'],
  
  execute: (context: CommandContext, args?: string): CommandResult => {
    const ctx = context as ExtendedCommandContext;
    
    // Get last response
    const lastResponse = ctx.getLastResponse?.();
    if (!lastResponse) {
      return {
        type: 'error',
        message: 'No response to capture. Send a message first!'
      };
    }

    // Parse flags from args
    const options = parseFlags(args || '');

    // Attempt capture
    const success = ctx.captureSprout?.(options);
    
    if (success) {
      // Show success toast
      ctx.showToast('🌱 Sprout planted!');
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

/**
 * Parse command flags
 * Examples:
 *   /sprout
 *   /sprout --tag=ratchet
 *   /sprout --tag=infrastructure --note="Great framing"
 */
function parseFlags(args: string): { tags?: string[]; notes?: string } {
  const options: { tags: string[]; notes?: string } = { tags: [] };

  // Parse --tag=X flags
  const tagMatches = args.matchAll(/--tag[s]?=([^\s"]+|"[^"]*")/g);
  for (const match of tagMatches) {
    const tag = match[1].replace(/"/g, '').trim();
    if (tag) options.tags.push(tag);
  }

  // Parse --note="X" flag
  const noteMatch = args.match(/--note[s]?=("[^"]*"|[^\s]+)/);
  if (noteMatch) {
    options.notes = noteMatch[1].replace(/"/g, '').trim();
  }

  return options;
}

export default sproutCommand;
