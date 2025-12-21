// lens command - Open lens picker or switch to a specific lens
// Sprint v0.16: Command Palette feature

import { Command, CommandContext, CommandResult } from '../CommandRegistry';

export const lensCommand: Command = {
  id: 'lens',
  name: 'Lens',
  description: 'Open lens picker or switch lens',
  aliases: ['perspective', 'view'],
  execute: (context: CommandContext, args?: string): CommandResult => {
    if (args && args.trim()) {
      // Switch to specific lens
      const lensId = args.trim().toLowerCase();
      context.switchLens(lensId);
      context.showToast(`Switched to lens: ${lensId}`);
      return { type: 'action', action: 'switchLens', payload: lensId };
    }

    // No args - open lens picker
    context.showLensPicker();
    return { type: 'action', action: 'showLensPicker' };
  }
};
