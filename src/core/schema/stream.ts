// src/core/schema/stream.ts
// StreamItem and RhetoricalSpan types for Kinetic Stream
// Sprint: kinetic-stream-schema-v1

// ─────────────────────────────────────────────────────────────────
// JOURNEY PATH (Navigation suggestions)
// ─────────────────────────────────────────────────────────────────

export interface JourneyPath {
  id: string;
  label: string;
  journeyId?: string;
  waypointId?: string;
  command?: string;
}

// ─────────────────────────────────────────────────────────────────
// STREAM ITEM TYPES
// ─────────────────────────────────────────────────────────────────

export type StreamItemType =
  | 'query'       // User input
  | 'response'    // AI response
  | 'navigation'  // Journey fork
  | 'reveal'      // Concept reveal
  | 'system';     // Status messages

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
// STREAM ITEM
// ─────────────────────────────────────────────────────────────────

export interface StreamItem {
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

export function isQueryItem(item: StreamItem): boolean {
  return item.type === 'query';
}

export function isResponseItem(item: StreamItem): boolean {
  return item.type === 'response';
}

export function hasSpans(item: StreamItem): item is StreamItem & { parsedSpans: RhetoricalSpan[] } {
  return Array.isArray(item.parsedSpans) && item.parsedSpans.length > 0;
}

export function hasPaths(item: StreamItem): item is StreamItem & { suggestedPaths: JourneyPath[] } {
  return Array.isArray(item.suggestedPaths) && item.suggestedPaths.length > 0;
}

// ─────────────────────────────────────────────────────────────────
// CONVERSION UTILITIES
// ─────────────────────────────────────────────────────────────────

import type { ChatMessage } from './base';

export function fromChatMessage(msg: ChatMessage): StreamItem {
  return {
    id: msg.id,
    type: msg.role === 'user' ? 'query' : 'response',
    timestamp: Date.now(),
    content: msg.text,
    role: msg.role === 'user' ? 'user' : 'assistant',
    createdBy: msg.role === 'user' ? 'user' : 'ai'
  };
}

export function toChatMessage(item: StreamItem): ChatMessage {
  return {
    id: item.id,
    role: item.type === 'query' ? 'user' : 'model',
    text: item.content
  };
}
