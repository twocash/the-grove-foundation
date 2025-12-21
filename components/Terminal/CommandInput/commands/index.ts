// commands barrel export and registration
// Sprint v0.16: Command Palette feature

import { commandRegistry } from '../CommandRegistry';
import { helpCommand } from './help';
import { welcomeCommand } from './welcome';
import { lensCommand } from './lens';
import { journeysCommand } from './journeys';
import { statsCommand } from './stats';

// Register all MVP commands
export function registerCommands(): void {
  commandRegistry.register(helpCommand);
  commandRegistry.register(welcomeCommand);
  commandRegistry.register(lensCommand);
  commandRegistry.register(journeysCommand);
  commandRegistry.register(statsCommand);
}

// Auto-register on import
registerCommands();

// Export individual commands for testing
export {
  helpCommand,
  welcomeCommand,
  lensCommand,
  journeysCommand,
  statsCommand
};
