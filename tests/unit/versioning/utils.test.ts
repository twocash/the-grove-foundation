import { describe, it, expect } from 'vitest';
import {
  generateUUID,
  formatRelativeTime,
  generateChangeMessage,
} from '../../../src/core/versioning/utils';
import type { JsonPatch } from '../../../src/core/copilot/schema';

describe('generateUUID', () => {
  it('generates valid UUID v4 format', () => {
    const uuid = generateUUID();
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('generates unique UUIDs', () => {
    const uuids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      uuids.add(generateUUID());
    }
    expect(uuids.size).toBe(100);
  });
});

describe('formatRelativeTime', () => {
  it('returns "never" for null', () => {
    expect(formatRelativeTime(null)).toBe('never');
  });

  it('returns "just now" for recent timestamps', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('just now');
  });

  it('returns seconds for < 1 minute', () => {
    const thirtySecondsAgo = new Date(Date.now() - 35000).toISOString();
    expect(formatRelativeTime(thirtySecondsAgo)).toMatch(/\d+ sec ago/);
  });

  it('returns minutes for < 1 hour', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 min ago');
  });

  it('returns hours for < 24 hours', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoHoursAgo)).toBe('2 hours ago');
  });

  it('returns "yesterday" for 1 day ago', () => {
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(yesterday)).toBe('yesterday');
  });

  it('returns days for < 7 days', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');
  });
});

describe('generateChangeMessage', () => {
  it('returns "No changes" for empty patch', () => {
    expect(generateChangeMessage([])).toBe('No changes');
  });

  it('returns "No changes" for null/undefined', () => {
    expect(generateChangeMessage(null as unknown as JsonPatch)).toBe('No changes');
    expect(generateChangeMessage(undefined as unknown as JsonPatch)).toBe('No changes');
  });

  it('extracts single field name', () => {
    const patch: JsonPatch = [
      { op: 'replace', path: '/meta/title', value: 'New Title' },
    ];
    expect(generateChangeMessage(patch)).toBe('Updated title');
  });

  it('combines two field names', () => {
    const patch: JsonPatch = [
      { op: 'replace', path: '/meta/title', value: 'New Title' },
      { op: 'replace', path: '/meta/description', value: 'New Desc' },
    ];
    expect(generateChangeMessage(patch)).toBe('Updated title and description');
  });

  it('combines multiple field names', () => {
    const patch: JsonPatch = [
      { op: 'replace', path: '/meta/title', value: 'New Title' },
      { op: 'replace', path: '/meta/description', value: 'New Desc' },
      { op: 'add', path: '/meta/tags/-', value: 'new-tag' },
    ];
    expect(generateChangeMessage(patch)).toBe('Updated title, description, and tags');
  });

  it('deduplicates field names', () => {
    const patch: JsonPatch = [
      { op: 'replace', path: '/meta/title', value: 'Title 1' },
      { op: 'replace', path: '/meta/title', value: 'Title 2' },
    ];
    expect(generateChangeMessage(patch)).toBe('Updated title');
  });
});
