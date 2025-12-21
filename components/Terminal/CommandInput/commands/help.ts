// help command - Show available commands
// Sprint v0.16: Command Palette feature

import { Command, CommandResult } from '../CommandRegistry';

export const helpCommand: Command = {
  id: 'help',
  name: 'Help',
  description: 'Show available Terminal commands',
  aliases: ['?', 'commands'],
  execute: (): CommandResult => {
    return { type: 'modal', modal: 'help' };
  }
};
