// types/engagement.ts - Backward compatibility shim
// Re-exports from @core/schema for existing imports
// Per ADR-008: Shim-based migration strategy

export {
  type EngagementEventType,
  type EngagementEvent,
  type EventPayloads,
  type RevealType,
  type RevealQueueItem,
  type EngagementState,
  type ActiveJourney,
  type ComparisonOperator,
  type ConditionValue,
  type StateKey,
  type SimpleCondition,
  type CompoundCondition,
  type TriggerCondition,
  type TriggerConfig,
  type EngagementEventHandler,
  type StateChangeHandler,
  type RevealQueueHandler,
  type EngagementBusAPI
} from '../src/core/schema';

// Re-export default from config
export { DEFAULT_ENGAGEMENT_STATE } from '../src/core/config';
