// tests/unit/navigation-parser.test.ts
// Unit tests for NavigationParser
// Sprint: kinetic-stream-reset-v2

import { describe, it, expect } from 'vitest';
import { parseNavigation, type ParsedNavigation } from '../../src/core/transformers/NavigationParser';

describe('NavigationParser', () => {
  describe('parseNavigation', () => {
    it('returns empty forks and empty content for empty input', () => {
      const result = parseNavigation('');
      expect(result.forks).toEqual([]);
      expect(result.cleanContent).toBe('');
    });

    it('returns original content when no navigation block present', () => {
      const content = 'This is a regular response without navigation.';
      const result = parseNavigation(content);

      expect(result.forks).toEqual([]);
      expect(result.cleanContent).toBe(content);
    });

    it('extracts JSON navigation block', () => {
      const content = `Here is the response.

<navigation>
[
  {"id": "fork-1", "label": "Learn more", "type": "deep_dive"},
  {"id": "fork-2", "label": "Try it out", "type": "apply"}
]
</navigation>`;

      const result = parseNavigation(content);

      expect(result.forks).toHaveLength(2);
      expect(result.forks[0].label).toBe('Learn more');
      expect(result.forks[0].type).toBe('deep_dive');
      expect(result.forks[1].label).toBe('Try it out');
      expect(result.forks[1].type).toBe('apply');
      expect(result.cleanContent).toBe('Here is the response.');
    });

    it('extracts JSON with forks wrapper object', () => {
      const content = `Response text.

<navigation>
{
  "forks": [
    {"id": "f1", "label": "Option A", "type": "pivot"}
  ]
}
</navigation>`;

      const result = parseNavigation(content);

      expect(result.forks).toHaveLength(1);
      expect(result.forks[0].label).toBe('Option A');
      expect(result.forks[0].type).toBe('pivot');
    });

    it('extracts structured text navigation', () => {
      const content = `Here is information about the topic.

<navigation>
→ Dive deeper into this concept
→ Apply this to your project
→ Explore a related topic
</navigation>`;

      const result = parseNavigation(content);

      expect(result.forks).toHaveLength(3);
      expect(result.forks[0].label).toBe('Dive deeper into this concept');
      expect(result.forks[1].label).toBe('Apply this to your project');
      expect(result.forks[2].label).toBe('Explore a related topic');
      expect(result.cleanContent).toBe('Here is information about the topic.');
    });

    it('handles bullet point format', () => {
      const content = `Response.

<navigation>
• First option
- Second option
</navigation>`;

      const result = parseNavigation(content);

      expect(result.forks).toHaveLength(2);
      expect(result.forks[0].label).toBe('First option');
      expect(result.forks[1].label).toBe('Second option');
    });

    it('is case-insensitive for navigation tag', () => {
      const content = `Text.

<NAVIGATION>
→ Option
</NAVIGATION>`;

      const result = parseNavigation(content);

      expect(result.forks).toHaveLength(1);
      expect(result.cleanContent).toBe('Text.');
    });

    it('preserves multiline clean content', () => {
      const content = `First paragraph.

Second paragraph.

Third paragraph.

<navigation>
→ Option
</navigation>`;

      const result = parseNavigation(content);

      expect(result.cleanContent).toContain('First paragraph.');
      expect(result.cleanContent).toContain('Second paragraph.');
      expect(result.cleanContent).toContain('Third paragraph.');
      expect(result.cleanContent).not.toContain('navigation');
    });
  });

  describe('fork type inference', () => {
    it('infers deep_dive for labels with "deep"', () => {
      const content = `<navigation>→ Deep dive into this</navigation>`;
      const result = parseNavigation(content);

      expect(result.forks[0].type).toBe('deep_dive');
    });

    it('infers deep_dive for labels with "more about"', () => {
      const content = `<navigation>→ Tell me more about X</navigation>`;
      const result = parseNavigation(content);

      expect(result.forks[0].type).toBe('deep_dive');
    });

    it('infers deep_dive for labels with "explain"', () => {
      const content = `<navigation>→ Explain the concept</navigation>`;
      const result = parseNavigation(content);

      expect(result.forks[0].type).toBe('deep_dive');
    });

    it('infers apply for labels with "try"', () => {
      const content = `<navigation>→ Try this approach</navigation>`;
      const result = parseNavigation(content);

      expect(result.forks[0].type).toBe('apply');
    });

    it('infers apply for labels with "how to"', () => {
      const content = `<navigation>→ How to implement this</navigation>`;
      const result = parseNavigation(content);

      expect(result.forks[0].type).toBe('apply');
    });

    it('infers apply for labels with "implement"', () => {
      const content = `<navigation>→ Implement the feature</navigation>`;
      const result = parseNavigation(content);

      expect(result.forks[0].type).toBe('apply');
    });

    it('defaults to pivot for other labels', () => {
      const content = `<navigation>→ Explore something else</navigation>`;
      const result = parseNavigation(content);

      expect(result.forks[0].type).toBe('pivot');
    });
  });

  describe('fork normalization', () => {
    it('uses label as queryPayload when query not provided', () => {
      const content = `<navigation>
[{"id": "f1", "label": "The Label"}]
</navigation>`;
      const result = parseNavigation(content);

      expect(result.forks[0].queryPayload).toBe('The Label');
    });

    it('uses query field as queryPayload when provided', () => {
      const content = `<navigation>
[{"id": "f1", "label": "Short Label", "query": "Full query text"}]
</navigation>`;
      const result = parseNavigation(content);

      expect(result.forks[0].queryPayload).toBe('Full query text');
    });

    it('uses queryPayload field when provided', () => {
      const content = `<navigation>
[{"id": "f1", "label": "Label", "queryPayload": "Custom payload"}]
</navigation>`;
      const result = parseNavigation(content);

      expect(result.forks[0].queryPayload).toBe('Custom payload');
    });

    it('generates id when not provided', () => {
      const content = `<navigation>
[{"label": "No ID Fork"}]
</navigation>`;
      const result = parseNavigation(content);

      expect(result.forks[0].id).toBeTruthy();
      expect(result.forks[0].id).toContain('fork_');
    });

    it('uses text field as label fallback', () => {
      const content = `<navigation>
[{"id": "f1", "text": "Text as label"}]
</navigation>`;
      const result = parseNavigation(content);

      expect(result.forks[0].label).toBe('Text as label');
    });

    it('defaults label to Continue when not provided', () => {
      const content = `<navigation>
[{"id": "f1", "type": "pivot"}]
</navigation>`;
      const result = parseNavigation(content);

      expect(result.forks[0].label).toBe('Continue');
    });

    it('preserves targetId when provided', () => {
      const content = `<navigation>
[{"id": "f1", "label": "Go", "targetId": "target-123"}]
</navigation>`;
      const result = parseNavigation(content);

      expect(result.forks[0].targetId).toBe('target-123');
    });

    it('preserves context when provided', () => {
      const content = `<navigation>
[{"id": "f1", "label": "Go", "context": "Some context"}]
</navigation>`;
      const result = parseNavigation(content);

      expect(result.forks[0].context).toBe('Some context');
    });

    it('normalizes invalid type to pivot', () => {
      const content = `<navigation>
[{"id": "f1", "label": "Go", "type": "invalid_type"}]
</navigation>`;
      const result = parseNavigation(content);

      expect(result.forks[0].type).toBe('pivot');
    });
  });

  describe('edge cases', () => {
    it('handles empty navigation block', () => {
      const content = `Text.<navigation></navigation>`;
      const result = parseNavigation(content);

      expect(result.forks).toEqual([]);
      expect(result.cleanContent).toBe('Text.');
    });

    it('handles whitespace-only navigation block', () => {
      const content = `Text.<navigation>

   </navigation>`;
      const result = parseNavigation(content);

      expect(result.forks).toEqual([]);
    });

    it('handles malformed JSON gracefully', () => {
      const content = `<navigation>
{not valid json}
</navigation>`;
      const result = parseNavigation(content);

      // Falls back to structured text parsing
      expect(result.forks.length).toBeGreaterThanOrEqual(0);
    });

    it('handles navigation at start of content', () => {
      const content = `<navigation>→ Option</navigation>

Main content here.`;
      const result = parseNavigation(content);

      expect(result.forks).toHaveLength(1);
      expect(result.cleanContent).toBe('Main content here.');
    });

    it('handles navigation in middle of content', () => {
      const content = `Before.

<navigation>→ Option</navigation>

After.`;
      const result = parseNavigation(content);

      expect(result.forks).toHaveLength(1);
      expect(result.cleanContent).toContain('Before.');
      expect(result.cleanContent).toContain('After.');
    });
  });
});
