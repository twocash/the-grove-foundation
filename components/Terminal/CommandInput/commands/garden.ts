// garden.ts - View captured sprouts
// Sprint: Sprout System Wiring
// Changed back to modal for non-widget contexts

import { Command, CommandResult } from '../CommandRegistry';

export const gardenCommand: Command = {
  id: 'garden',
  name: 'Garden',
  description: 'View your captured sprouts',
  aliases: ['sprouts', 'contributions'],

  execute: (): CommandResult => {
    // Open garden modal - works in both widget and non-widget contexts
    return { type: 'modal', modal: 'garden' };
  }
};

export default gardenCommand;
