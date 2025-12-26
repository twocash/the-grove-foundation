// journeys command - View available journeys
// Sprint v0.16: Command Palette feature
// Sprint: route-selection-flow-v1 - Changed to route navigation

import { Command, CommandResult } from '../CommandRegistry';

export const journeysCommand: Command = {
  id: 'journeys',
  name: 'Journeys',
  description: 'View available guided journeys',
  aliases: ['paths', 'explore'],
  execute: (): CommandResult => {
    return { type: 'navigate', path: '/journeys?returnTo=/terminal&ctaLabel=Begin%20Journey' };
  }
};
