// src/core/commands/index.ts
// Command System Public API
// Sprint: terminal-kinetic-commands-v1

export * from './schema';
export { CommandRegistry, commandRegistry } from './registry';
export { COMMAND_DEFINITIONS } from './command-definitions';
export { parseCommand, isCommand } from './parser';
export { executeCommand } from './executor';
export type { ExecutionContext } from './executor';
export { RESOLVERS } from './resolvers';
export type { ResolverContext, ResolveResult, Suggestion } from './resolvers';
