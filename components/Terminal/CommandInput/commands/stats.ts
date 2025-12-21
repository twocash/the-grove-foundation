// stats command - View exploration statistics
// Sprint v0.16: Command Palette feature

import { Command, CommandResult } from '../CommandRegistry';

export const statsCommand: Command = {
  id: 'stats',
  name: 'Stats',
  description: 'View your exploration statistics',
  aliases: ['progress', 'me'],
  execute: (): CommandResult => {
    return { type: 'modal', modal: 'stats' };
  }
};
