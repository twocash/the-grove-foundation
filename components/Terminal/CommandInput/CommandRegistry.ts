// CommandRegistry - Central registry for Terminal slash commands
// Sprint v0.16: Command Palette feature

// Command execution result types
export type CommandResult =
  | { type: 'modal'; modal: 'help' | 'journeys' | 'stats' }
  | { type: 'action'; action: string; payload?: unknown }
  | { type: 'error'; message: string };

// Context provided to command execute functions
export interface CommandContext {
  openModal: (modal: 'help' | 'journeys' | 'stats') => void;
  switchLens: (lensId: string) => void;
  showToast: (message: string) => void;
  showWelcome: () => void;
  showLensPicker: () => void;
}

// Command definition interface
export interface Command {
  id: string;
  name: string;
  description: string;
  aliases: string[];
  execute: (context: CommandContext, args?: string) => CommandResult;
}

// Registry class for managing commands
class CommandRegistryClass {
  private commands: Map<string, Command> = new Map();

  register(command: Command): void {
    this.commands.set(command.id, command);
    // Also register aliases
    for (const alias of command.aliases) {
      this.commands.set(alias, command);
    }
  }

  get(idOrAlias: string): Command | undefined {
    return this.commands.get(idOrAlias.toLowerCase());
  }

  getAll(): Command[] {
    // Return unique commands (avoid duplicates from aliases)
    const seen = new Set<string>();
    const result: Command[] = [];

    for (const command of this.commands.values()) {
      if (!seen.has(command.id)) {
        seen.add(command.id);
        result.push(command);
      }
    }

    return result;
  }

  search(query: string): Command[] {
    const normalizedQuery = query.toLowerCase();
    const seen = new Set<string>();
    const results: Command[] = [];

    for (const command of this.commands.values()) {
      if (seen.has(command.id)) continue;

      // Match by id, name, or aliases
      const matches =
        command.id.includes(normalizedQuery) ||
        command.name.toLowerCase().includes(normalizedQuery) ||
        command.aliases.some(alias => alias.includes(normalizedQuery));

      if (matches) {
        seen.add(command.id);
        results.push(command);
      }
    }

    // Sort by id for consistent ordering
    return results.sort((a, b) => a.id.localeCompare(b.id));
  }
}

// Export singleton instance
export const commandRegistry = new CommandRegistryClass();
