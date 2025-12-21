// welcome command - Return to welcome screen
// Sprint v0.16: Command Palette feature

import { Command, CommandContext, CommandResult } from '../CommandRegistry';

export const welcomeCommand: Command = {
  id: 'welcome',
  name: 'Welcome',
  description: 'Return to the welcome screen',
  aliases: ['home', 'start'],
  execute: (context: CommandContext): CommandResult => {
    context.showWelcome();
    return { type: 'action', action: 'showWelcome' };
  }
};
