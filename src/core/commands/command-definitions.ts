// src/core/commands/command-definitions.ts
// Declarative Command Registry
// Sprint: terminal-kinetic-commands-v1

import { CommandDefinition } from './schema';

export const COMMAND_DEFINITIONS: CommandDefinition[] = [
  {
    id: 'journey-start',
    trigger: 'journey',
    aliases: ['j'],
    description: 'Start or continue a guided journey',
    category: 'navigation',
    args: [
      { name: 'journeyId', type: 'journey', optional: true }
    ],
    action: { type: 'journey-start', fallback: 'show-journey-picker' },
    subcommands: {
      list: { type: 'show-overlay', overlay: 'journey-picker' },
      continue: { type: 'journey-continue' }
    },
    icon: 'Compass'
  },
  {
    id: 'lens-switch',
    trigger: 'lens',
    aliases: ['l'],
    description: 'Switch your perspective lens',
    category: 'navigation',
    args: [
      { name: 'lensId', type: 'lens', optional: true }
    ],
    action: { type: 'lens-switch', fallback: 'show-lens-picker' },
    subcommands: {
      list: { type: 'show-overlay', overlay: 'lens-picker' },
      clear: { type: 'lens-clear' }
    },
    icon: 'Glasses'
  },
  {
    id: 'plant-sprout',
    trigger: 'plant',
    aliases: ['p', 'sprout', 'capture', 'save'],
    description: 'Capture an insight as a sprout',
    category: 'action',
    args: [
      { name: 'content', type: 'string', optional: true }
    ],
    action: { type: 'plant-sprout', contextCapture: ['lastResponse', 'activeLens', 'activeJourney'] },
    icon: 'Sprout'
  },
  {
    id: 'show-stats',
    trigger: 'stats',
    description: 'View your session statistics',
    category: 'info',
    action: { type: 'show-overlay', overlay: 'stats' },
    icon: 'BarChart3'
  },
  {
    id: 'show-garden',
    trigger: 'garden',
    aliases: ['sprouts', 'contributions'],
    description: 'View your captured sprouts',
    category: 'info',
    action: { type: 'show-overlay', overlay: 'garden' },
    icon: 'TreeDeciduous'
  },
  {
    id: 'explore-mode',
    trigger: 'explore',
    aliases: ['e'],
    description: 'Enter free exploration mode',
    category: 'navigation',
    action: { type: 'journey-clear' },
    icon: 'Telescope'
  },
  {
    id: 'help',
    trigger: 'help',
    aliases: ['?', 'commands'],
    description: 'Show available commands',
    category: 'system',
    args: [
      { name: 'commandId', type: 'string', optional: true }
    ],
    action: { type: 'show-command-palette' },
    icon: 'HelpCircle',
    shortcut: 'Ctrl+K'
  },
  {
    id: 'welcome',
    trigger: 'welcome',
    aliases: ['intro'],
    description: 'Show the welcome screen',
    category: 'system',
    action: { type: 'show-overlay', overlay: 'welcome' },
    icon: 'Sparkles'
  }
];
