// garden.ts - Switch to garden mode to view sprouts
// Sprint: Sprout System Wiring
// Changed from modal to mode switch per Foundation Refactor spec

import { Command, CommandResult } from '../CommandRegistry';

export const gardenCommand: Command = {
  id: 'garden',
  name: 'Garden',
  description: 'View your captured sprouts',
  aliases: ['sprouts', 'contributions'],

  execute: (): CommandResult => {
    // Switch to garden mode instead of opening modal
    // This follows the Foundation Refactor spec where Garden is a MODE, not a modal
    return { type: 'action', action: 'switch-mode', payload: { mode: 'garden' } };
  }
};

export default gardenCommand;
