// garden.ts - Open the garden modal to view sprouts
// Sprint: Sprout System

import { Command, CommandResult } from '../CommandRegistry';

export const gardenCommand: Command = {
  id: 'garden',
  name: 'Garden',
  description: 'View your captured sprouts',
  aliases: ['sprouts', 'contributions'],

  execute: (): CommandResult => {
    return { type: 'modal', modal: 'garden' };
  }
};

export default gardenCommand;
