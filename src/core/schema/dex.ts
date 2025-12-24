// src/core/schema/dex.ts
// DEX Object Model — Kinetic Architecture Foundation

/**
 * Object types in the DEX system
 */
export type DEXObjectType = 'lens' | 'journey' | 'node' | 'hub' | 'card' | 'sprout';

/**
 * Version entry for evolution tracking
 */
export interface DEXVersionEntry {
  version: number;
  timestamp: string;
  changedBy: 'human' | 'agent';
  agentId?: string;
  changeDescription: string;
  diff?: Record<string, { old: unknown; new: unknown }>;
}

/**
 * Base interface for all DEX-compliant objects
 */
export interface DEXObject {
  // Identity
  id: string;
  type: DEXObjectType;

  // Display
  label: string;
  description?: string;
  icon?: string;
  color?: string;

  // Lifecycle
  status: 'draft' | 'active' | 'archived';
  version: number;
  createdAt: string;
  updatedAt: string;

  // Kinetic metadata (future agent support)
  proposedBy?: 'human' | 'agent';
  approvedBy?: string;
  telemetryScore?: number;
  evolutionHistory?: DEXVersionEntry[];

  // Capture provenance (entropy integration)
  captureContext?: DEXCaptureContext;
}

/**
 * Capture context for provenance tracking
 * Records conditions under which an object was created
 */
export interface DEXCaptureContext {
  entropyScore?: number;                    // Complexity at capture (0-1)
  entropyLevel?: 'low' | 'medium' | 'high'; // Discretized complexity
  sessionId?: string;                       // Conversation session
  journeyId?: string;                       // If captured during journey
  nodeId?: string;                          // Specific journey step
  lensId?: string;                          // Active persona/lens
}

/**
 * Journey — Structured narrative path
 */
export interface DEXJourney extends DEXObject {
  type: 'journey';
  title: string;
  entryNodeId?: string;
  estimatedMinutes?: number;
  linkedHubId?: string;
}

/**
 * Node — Step within a journey
 */
export interface DEXNode extends DEXObject {
  type: 'node';
  query: string;
  contextSnippet?: string;
  journeyId: string;
  sequenceOrder?: number;
  primaryNext?: string;
  alternateNext?: string[];
  hubId?: string;
  sectionId?: string;
}

/**
 * Hub — Topic routing configuration
 */
export interface DEXHub extends DEXObject {
  type: 'hub';
  tags: string[];
  priority: number;
  enabled: boolean;
  primarySource: string;
  supportingSources: string[];
  expertFraming: string;
  keyPoints: string[];
}

/**
 * Lens — Persona/perspective configuration
 */
export interface DEXLens extends DEXObject {
  type: 'lens';
  publicLabel: string;
  enabled: boolean;
  toneGuidance: string;
  narrativeStyle: string;
  arcEmphasis: Record<string, number>;
  openingPhase: string;
  defaultThreadLength: number;
  entryPoints: string[];
  suggestedThread: string[];
}

/**
 * Card — Legacy V2.0 navigation unit
 */
export interface DEXCard extends DEXObject {
  type: 'card';
  query: string;
  contextSnippet?: string;
  personas: string[];
  next: string[];
  sectionId?: string;
  hubId?: string;
}

/**
 * Type guards
 */
export function isDEXJourney(obj: DEXObject): obj is DEXJourney {
  return obj.type === 'journey';
}

export function isDEXNode(obj: DEXObject): obj is DEXNode {
  return obj.type === 'node';
}

export function isDEXHub(obj: DEXObject): obj is DEXHub {
  return obj.type === 'hub';
}

export function isDEXLens(obj: DEXObject): obj is DEXLens {
  return obj.type === 'lens';
}

export function isDEXCard(obj: DEXObject): obj is DEXCard {
  return obj.type === 'card';
}
