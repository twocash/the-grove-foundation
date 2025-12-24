// src/core/engagement/index.ts

export { engagementMachine, type EngagementMachine } from './machine';
export {
  type EngagementContext,
  type EngagementEvent,
  type Journey,
  type JourneyStep,
  initialContext,
} from './types';
// Guards and actions are now defined inline in machine.ts using setup()
// Exporting standalone guards for testing purposes
export { guards } from './guards';
