// src/core/schema/stream.ts
// StreamItem and RhetoricalSpan types for Kinetic Stream
// Sprint: kinetic-stream-schema-v1, kinetic-stream-reset-v2

// ─────────────────────────────────────────────────────────────────
// JOURNEY PATH (Navigation suggestions - legacy)
// ─────────────────────────────────────────────────────────────────

export interface JourneyPath {
  id: string;
  label: string;
  journeyId?: string;
  waypointId?: string;
  command?: string;
}

// ─────────────────────────────────────────────────────────────────
// JOURNEY FORK (Navigation suggestions - enhanced)
// Sprint: kinetic-stream-reset-v2
// ─────────────────────────────────────────────────────────────────

export type JourneyForkType = 'deep_dive' | 'pivot' | 'apply' | 'challenge';

export interface JourneyFork {
  id: string;
  label: string;
  type: JourneyForkType;
  targetId?: string;
  queryPayload?: string;
  context?: string;
}

// ─────────────────────────────────────────────────────────────────
// LENS OFFER (Inline lens recommendation)
// Sprint: lens-offer-v1
// ─────────────────────────────────────────────────────────────────

export type LensOfferStatus = 'pending' | 'accepted' | 'dismissed';

// ─────────────────────────────────────────────────────────────────
// PIVOT CONTEXT
// Sprint: kinetic-stream-reset-v2
// ─────────────────────────────────────────────────────────────────

export interface PivotContext {
  sourceResponseId: string;
  sourceText: string;
  sourceContext: string;
  targetId?: string;
}

// ─────────────────────────────────────────────────────────────────
// STREAM ITEM TYPES
// ─────────────────────────────────────────────────────────────────

export type StreamItemType =
  | 'query'       // User input
  | 'response'    // AI response
  | 'navigation'  // Journey fork
  | 'reveal'      // Concept reveal
  | 'system'      // Status messages
  | 'lens_offer'; // Inline lens recommendation

// ─────────────────────────────────────────────────────────────────
// RHETORICAL SPANS
// ─────────────────────────────────────────────────────────────────

export type RhetoricalSpanType =
  | 'concept'  // Bold phrases
  | 'action'   // Arrow prompts
  | 'entity';  // Named entities

export interface RhetoricalSpan {
  id: string;
  text: string;
  type: RhetoricalSpanType;
  startIndex: number;
  endIndex: number;
  conceptId?: string;
  confidence?: number;
}

// ─────────────────────────────────────────────────────────────────
// DISCRIMINATED STREAM ITEMS
// Sprint: kinetic-stream-reset-v2
// ─────────────────────────────────────────────────────────────────

interface BaseStreamItem {
  id: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface QueryStreamItem extends BaseStreamItem {
  type: 'query';
  content: string;
  intent?: string;
  pivot?: PivotContext;
  role: 'user';
  createdBy: 'user';
}

export interface ResponseStreamItem extends BaseStreamItem {
  type: 'response';
  content: string;
  isGenerating: boolean;
  parsedSpans?: RhetoricalSpan[];
  suggestedPaths?: JourneyPath[];
  navigation?: JourneyFork[];
  role: 'assistant';
  createdBy: 'ai';
}

export interface NavigationStreamItem extends BaseStreamItem {
  type: 'navigation';
  forks: JourneyFork[];
  sourceResponseId: string;
}

export interface SystemStreamItem extends BaseStreamItem {
  type: 'system';
  content: string;
  createdBy: 'system';
}

export interface LensOfferStreamItem extends BaseStreamItem {
  type: 'lens_offer';
  lensId: string;
  lensName: string;
  reason: string;
  previewText: string;
  status: LensOfferStatus;
  sourceResponseId: string;
}

export interface RevealStreamItem extends BaseStreamItem {
  type: 'reveal';
  content: string;
  createdBy?: 'user' | 'system' | 'ai';
  role?: 'user' | 'assistant';
  isGenerating?: boolean;
  parsedSpans?: RhetoricalSpan[];
  suggestedPaths?: JourneyPath[];
}

// ─────────────────────────────────────────────────────────────────
// STREAM ITEM UNION
// ─────────────────────────────────────────────────────────────────

export type StreamItem =
  | QueryStreamItem
  | ResponseStreamItem
  | NavigationStreamItem
  | SystemStreamItem
  | LensOfferStreamItem
  | RevealStreamItem;

// Legacy interface for backward compatibility
export interface LegacyStreamItem {
  id: string;
  type: StreamItemType;
  timestamp: number;
  content: string;
  parsedSpans?: RhetoricalSpan[];
  suggestedPaths?: JourneyPath[];
  isGenerating?: boolean;
  createdBy?: 'user' | 'system' | 'ai';
  role?: 'user' | 'assistant';
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────
// TYPE GUARDS
// ─────────────────────────────────────────────────────────────────

export function isQueryItem(item: StreamItem): item is QueryStreamItem {
  return item.type === 'query';
}

export function isResponseItem(item: StreamItem): item is ResponseStreamItem {
  return item.type === 'response';
}

export function isNavigationItem(item: StreamItem): item is NavigationStreamItem {
  return item.type === 'navigation';
}

export function isSystemItem(item: StreamItem): item is SystemStreamItem {
  return item.type === 'system';
}

export function isRevealItem(item: StreamItem): item is RevealStreamItem {
  return item.type === 'reveal';
}

export function isLensOfferItem(item: StreamItem): item is LensOfferStreamItem {
  return item.type === 'lens_offer';
}

export function hasSpans(item: StreamItem): item is (ResponseStreamItem | RevealStreamItem) & { parsedSpans: RhetoricalSpan[] } {
  return (isResponseItem(item) || isRevealItem(item)) &&
         Array.isArray(item.parsedSpans) &&
         item.parsedSpans.length > 0;
}

export function hasPaths(item: StreamItem): item is (ResponseStreamItem | RevealStreamItem) & { suggestedPaths: JourneyPath[] } {
  return (isResponseItem(item) || isRevealItem(item)) &&
         Array.isArray(item.suggestedPaths) &&
         item.suggestedPaths.length > 0;
}

export function hasNavigation(item: StreamItem): item is ResponseStreamItem & { navigation: JourneyFork[] } {
  return isResponseItem(item) &&
         Array.isArray(item.navigation) &&
         item.navigation.length > 0;
}

// ─────────────────────────────────────────────────────────────────
// CONVERSION UTILITIES
// ─────────────────────────────────────────────────────────────────

import type { ChatMessage } from './base';

export function fromChatMessage(msg: ChatMessage): QueryStreamItem | ResponseStreamItem {
  if (msg.role === 'user') {
    return {
      id: msg.id,
      type: 'query',
      timestamp: Date.now(),
      content: msg.text,
      role: 'user',
      createdBy: 'user'
    };
  }
  return {
    id: msg.id,
    type: 'response',
    timestamp: Date.now(),
    content: msg.text,
    role: 'assistant',
    createdBy: 'ai',
    isGenerating: msg.isStreaming || false
  };
}

export function toChatMessage(item: StreamItem): ChatMessage {
  const content = 'content' in item ? item.content : '';
  return {
    id: item.id,
    role: item.type === 'query' ? 'user' : 'model',
    text: content
  };
}
