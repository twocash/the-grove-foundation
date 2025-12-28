// tests/unit/RhetoricalParser.test.ts
// Sprint: kinetic-stream-schema-v1

import { describe, it, expect, beforeEach } from 'vitest';
import {
  parse,
  parseByType,
  hasRhetoricalContent,
  resetSpanIdCounter
} from '../../src/core/transformers/RhetoricalParser';

describe('RhetoricalParser', () => {
  beforeEach(() => {
    resetSpanIdCounter();
  });

  describe('parse()', () => {
    it('extracts bold as concept spans', () => {
      const result = parse('The **Grove** is distributed AI.');
      expect(result.spans).toHaveLength(1);
      expect(result.spans[0].text).toBe('Grove');
      expect(result.spans[0].type).toBe('concept');
      expect(result.spans[0].confidence).toBe(1.0);
    });

    it('extracts multiple bold phrases', () => {
      const result = parse('**Grove** provides **local AI** ownership.');
      expect(result.spans).toHaveLength(2);
      expect(result.spans[0].text).toBe('Grove');
      expect(result.spans[1].text).toBe('local AI');
    });

    it('extracts arrows as action spans', () => {
      const result = parse('→ Tell me more');
      expect(result.spans).toHaveLength(1);
      expect(result.spans[0].text).toBe('Tell me more');
      expect(result.spans[0].type).toBe('action');
    });

    it('extracts ASCII arrows as action spans', () => {
      const result = parse('-> Learn about the Ratchet');
      expect(result.spans).toHaveLength(1);
      expect(result.spans[0].text).toBe('Learn about the Ratchet');
      expect(result.spans[0].type).toBe('action');
    });

    it('handles empty content', () => {
      const result = parse('');
      expect(result.spans).toHaveLength(0);
      expect(result.content).toBe('');
    });

    it('handles null-ish content', () => {
      const result = parse(null as unknown as string);
      expect(result.spans).toHaveLength(0);
    });

    it('handles undefined content', () => {
      const result = parse(undefined as unknown as string);
      expect(result.spans).toHaveLength(0);
    });

    it('sorts spans by position', () => {
      const result = parse('**First** then **Second**');
      expect(result.spans[0].text).toBe('First');
      expect(result.spans[1].text).toBe('Second');
      expect(result.spans[0].startIndex).toBeLessThan(result.spans[1].startIndex);
    });

    it('captures correct indices for bold', () => {
      const content = 'Start **middle** end';
      const result = parse(content);
      expect(result.spans[0].startIndex).toBe(6);
      expect(result.spans[0].endIndex).toBe(16);
    });

    it('handles mixed bold and arrow content', () => {
      const content = '**Concept** is important.\n→ Explore more';
      const result = parse(content);
      expect(result.spans).toHaveLength(2);
      expect(result.spans[0].type).toBe('concept');
      expect(result.spans[1].type).toBe('action');
    });

    it('generates unique span IDs', () => {
      const result = parse('**A** and **B**');
      expect(result.spans[0].id).not.toBe(result.spans[1].id);
      expect(result.spans[0].id).toMatch(/^span_\d+_\d+$/);
    });
  });

  describe('parseByType()', () => {
    it('filters to concept spans only', () => {
      const content = '**Concept** here.\n→ Action here';
      const concepts = parseByType(content, 'concept');
      expect(concepts).toHaveLength(1);
      expect(concepts[0].type).toBe('concept');
    });

    it('filters to action spans only', () => {
      const content = '**Concept** here.\n→ Action here';
      const actions = parseByType(content, 'action');
      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe('action');
    });

    it('returns empty array for entity type (not yet implemented)', () => {
      const content = '**Concept** here.\n→ Action here';
      const entities = parseByType(content, 'entity');
      expect(entities).toHaveLength(0);
    });
  });

  describe('hasRhetoricalContent()', () => {
    it('returns true for bold content', () => {
      expect(hasRhetoricalContent('This has **bold** text')).toBe(true);
    });

    it('returns true for arrow content', () => {
      expect(hasRhetoricalContent('→ Action prompt')).toBe(true);
    });

    it('returns true for ASCII arrow content', () => {
      expect(hasRhetoricalContent('-> Action prompt')).toBe(true);
    });

    it('returns false for plain text', () => {
      expect(hasRhetoricalContent('Just plain text')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(hasRhetoricalContent('')).toBe(false);
    });

    it('returns false for null', () => {
      expect(hasRhetoricalContent(null as unknown as string)).toBe(false);
    });
  });
});
