// CommandInput barrel export
// Sprint v0.16: Command Palette feature

export { commandRegistry } from './CommandRegistry';
export type { Command, CommandContext, CommandResult } from './CommandRegistry';
export { useCommandParser } from './useCommandParser';
export { default as CommandAutocomplete } from './CommandAutocomplete';
export { default as CommandInput } from './CommandInput';

// Import to auto-register commands
import './commands';
