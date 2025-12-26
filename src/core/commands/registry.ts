// src/core/commands/registry.ts
// Command Registry - Canonical Source for Commands
// Sprint: terminal-kinetic-commands-v1

import { CommandDefinition, CommandCategory } from './schema';
import { COMMAND_DEFINITIONS } from './command-definitions';

export class CommandRegistry {
  private commands: Map<string, CommandDefinition>;
  private triggerIndex: Map<string, string>;

  constructor(definitions: CommandDefinition[] = COMMAND_DEFINITIONS) {
    this.commands = new Map();
    this.triggerIndex = new Map();

    for (const def of definitions) {
      this.commands.set(def.id, def);
      this.triggerIndex.set(def.trigger.toLowerCase(), def.id);
      def.aliases?.forEach(alias =>
        this.triggerIndex.set(alias.toLowerCase(), def.id)
      );
    }
  }

  getByTrigger(trigger: string): CommandDefinition | undefined {
    const id = this.triggerIndex.get(trigger.toLowerCase());
    return id ? this.commands.get(id) : undefined;
  }

  getById(id: string): CommandDefinition | undefined {
    return this.commands.get(id);
  }

  getAll(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  getByCategory(category: CommandCategory): CommandDefinition[] {
    return this.getAll().filter(cmd => cmd.category === category);
  }

  search(query: string): CommandDefinition[] {
    if (!query) return this.getAll();
    const q = query.toLowerCase();
    return this.getAll().filter(cmd =>
      cmd.trigger.toLowerCase().includes(q) ||
      cmd.aliases?.some(a => a.toLowerCase().includes(q)) ||
      cmd.description.toLowerCase().includes(q)
    );
  }

  getAllTriggers(): string[] {
    return Array.from(this.triggerIndex.keys());
  }
}

// Singleton instance
export const commandRegistry = new CommandRegistry();
