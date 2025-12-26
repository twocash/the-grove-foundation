import { describe, it, expect } from 'vitest';
import { parseIntent } from '../../../src/core/copilot/parser';

describe('parseIntent', () => {
  describe('SET_FIELD', () => {
    it('parses "set title to X"', () => {
      const result = parseIntent("set title to 'New Title'");
      expect(result.type).toBe('SET_FIELD');
      expect(result.field).toBe('title');
      expect(result.value).toBe('New Title');
    });

    it('parses "change description to X"', () => {
      const result = parseIntent('change description to Something new');
      expect(result.type).toBe('SET_FIELD');
      expect(result.field).toBe('description');
      expect(result.value).toBe('Something new');
    });

    it('parses "update icon to X"', () => {
      const result = parseIntent('update icon to star');
      expect(result.type).toBe('SET_FIELD');
      expect(result.field).toBe('icon');
      expect(result.value).toBe('star');
    });
  });

  describe('ADD_TAG', () => {
    it('parses "add tag X"', () => {
      const result = parseIntent("add tag 'important'");
      expect(result.type).toBe('ADD_TAG');
      expect(result.value).toBe('important');
    });

    it('parses "add a tag X"', () => {
      const result = parseIntent('add a tag featured');
      expect(result.type).toBe('ADD_TAG');
      expect(result.value).toBe('featured');
    });

    it('parses "tag this as X"', () => {
      const result = parseIntent('tag this as priority');
      expect(result.type).toBe('ADD_TAG');
      expect(result.value).toBe('priority');
    });
  });

  describe('REMOVE_TAG', () => {
    it('parses "remove tag X"', () => {
      const result = parseIntent("remove tag 'old'");
      expect(result.type).toBe('REMOVE_TAG');
      expect(result.value).toBe('old');
    });

    it('parses "remove the tag X"', () => {
      const result = parseIntent('remove the tag deprecated');
      expect(result.type).toBe('REMOVE_TAG');
      expect(result.value).toBe('deprecated');
    });

    it('parses "untag X"', () => {
      const result = parseIntent('untag draft');
      expect(result.type).toBe('REMOVE_TAG');
      expect(result.value).toBe('draft');
    });
  });

  describe('TOGGLE_FAVORITE', () => {
    it('parses "mark as favorite"', () => {
      const result = parseIntent('mark as favorite');
      expect(result.type).toBe('TOGGLE_FAVORITE');
      expect(result.value).toBe(true);
    });

    it('parses "add to favorites"', () => {
      const result = parseIntent('add to favorites');
      expect(result.type).toBe('TOGGLE_FAVORITE');
      expect(result.value).toBe(true);
    });

    it('parses "make favorite"', () => {
      const result = parseIntent('make favorite');
      expect(result.type).toBe('TOGGLE_FAVORITE');
      expect(result.value).toBe(true);
    });

    it('parses "unfavorite"', () => {
      const result = parseIntent('unfavorite');
      expect(result.type).toBe('TOGGLE_FAVORITE');
      expect(result.value).toBe(false);
    });

    it('parses "remove from favorites"', () => {
      const result = parseIntent('remove from favorites');
      expect(result.type).toBe('TOGGLE_FAVORITE');
      expect(result.value).toBe(false);
    });
  });

  describe('UPDATE_FIELD', () => {
    it('parses "make description shorter"', () => {
      const result = parseIntent('make description shorter');
      expect(result.type).toBe('UPDATE_FIELD');
      expect(result.field).toBe('description');
      expect(result.modifier).toBe('shorter');
    });

    it('parses "make title longer"', () => {
      const result = parseIntent('make title longer');
      expect(result.type).toBe('UPDATE_FIELD');
      expect(result.field).toBe('title');
      expect(result.modifier).toBe('longer');
    });

    it('parses "make tone more formal"', () => {
      const result = parseIntent('make tone more formal');
      expect(result.type).toBe('UPDATE_FIELD');
      expect(result.field).toBe('tone');
      expect(result.modifier).toBe('more formal');
    });
  });

  describe('UNKNOWN', () => {
    it('returns UNKNOWN for gibberish', () => {
      const result = parseIntent('asdfasdf');
      expect(result.type).toBe('UNKNOWN');
      expect(result.confidence).toBe(0);
    });

    it('returns UNKNOWN for empty string', () => {
      const result = parseIntent('');
      expect(result.type).toBe('UNKNOWN');
      expect(result.confidence).toBe(0);
    });

    it('returns UNKNOWN for partial commands', () => {
      const result = parseIntent('set title');
      expect(result.type).toBe('UNKNOWN');
    });
  });
});
