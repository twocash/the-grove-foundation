// src/core/transformers/NavigationParser.ts
// Extract <navigation> blocks from LLM output
// Sprint: kinetic-stream-reset-v2

import type { JourneyFork, JourneyForkType } from '../schema/stream';

export interface ParsedNavigation {
  forks: JourneyFork[];
  cleanContent: string;
}

const NAVIGATION_REGEX = /<navigation>([\s\S]*?)<\/navigation>/i;

export function parseNavigation(rawContent: string): ParsedNavigation {
  if (!rawContent) {
    return { forks: [], cleanContent: '' };
  }

  const match = rawContent.match(NAVIGATION_REGEX);

  if (!match) {
    return { forks: [], cleanContent: rawContent };
  }

  const navigationBlock = match[1];
  const cleanContent = rawContent.replace(NAVIGATION_REGEX, '').trim();

  const forks = parseNavigationBlock(navigationBlock);

  return { forks, cleanContent };
}

function parseNavigationBlock(block: string): JourneyFork[] {
  const trimmed = block.trim();

  // Try JSON first
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map(normalizeFork);
    }
    if (parsed.forks && Array.isArray(parsed.forks)) {
      return parsed.forks.map(normalizeFork);
    }
  } catch {
    // Fall back to structured text
  }

  return parseStructuredText(block);
}

function parseStructuredText(block: string): JourneyFork[] {
  const lines = block.trim().split('\n').filter(l => l.trim());

  return lines.map((line, i) => {
    const trimmed = line.trim();
    const text = trimmed.replace(/^[→\-•]\s*/, '');

    return {
      id: `fork_${Date.now()}_${i}`,
      label: text,
      type: inferForkType(text),
      queryPayload: text
    };
  });
}

function inferForkType(label: string): JourneyForkType {
  const lower = label.toLowerCase();

  if (lower.includes('deep') || lower.includes('more about') || lower.includes('explain')) {
    return 'deep_dive';
  }
  if (lower.includes('try') || lower.includes('apply') || lower.includes('how to') || lower.includes('implement')) {
    return 'apply';
  }

  return 'pivot';
}

function normalizeFork(raw: Record<string, unknown>): JourneyFork {
  const type = normalizeType(raw.type);
  const label = String(raw.label || raw.text || 'Continue');

  return {
    id: String(raw.id || `fork_${Date.now()}_${Math.random().toString(36).slice(2)}`),
    label,
    type,
    targetId: raw.targetId as string | undefined,
    queryPayload: String(raw.query || raw.queryPayload || label),
    context: raw.context as string | undefined
  };
}

function normalizeType(type: unknown): JourneyForkType {
  if (type === 'deep_dive' || type === 'pivot' || type === 'apply' || type === 'challenge') {
    return type;
  }
  return 'pivot';
}
