// journeys command - View available journeys
// Sprint v0.16: Command Palette feature

import { Command, CommandResult } from '../CommandRegistry';

export const journeysCommand: Command = {
  id: 'journeys',
  name: 'Journeys',
  description: 'View available guided journeys',
  aliases: ['paths', 'explore'],
  execute: (): CommandResult => {
    return { type: 'modal', modal: 'journeys' };
  }
};
