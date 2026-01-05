import { describe, test, expect } from 'vitest'
import { DEFAULT_FEATURE_FLAGS, FeatureFlag } from '../../../data/narratives-schema'

describe('Feature Flags Schema Validation', () => {
  test('inline-navigation-prompts exists with enabled=true', () => {
    const flag = DEFAULT_FEATURE_FLAGS.find(f => f.id === 'inline-navigation-prompts')
    expect(flag, 'inline-navigation-prompts flag not found').toBeDefined()
    expect(flag!.enabled).toBe(true)
    expect(flag!.name).toBe('Inline Navigation Prompts')
  })

  test('floating-suggestion-widget exists with enabled=false', () => {
    const flag = DEFAULT_FEATURE_FLAGS.find(f => f.id === 'floating-suggestion-widget')
    expect(flag, 'floating-suggestion-widget flag not found').toBeDefined()
    expect(flag!.enabled).toBe(false)
    expect(flag!.name).toBe('Floating Suggestion Widget')
  })

  test('no duplicate flag IDs', () => {
    const ids = DEFAULT_FEATURE_FLAGS.map(f => f.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size, 'Duplicate flag IDs found').toBe(ids.length)
  })

  test('all flags have required properties', () => {
    for (const flag of DEFAULT_FEATURE_FLAGS) {
      expect(flag.id, `Flag missing id`).toBeTruthy()
      expect(flag.name, `Flag "${flag.id}" missing name`).toBeTruthy()
      expect(flag.description, `Flag "${flag.id}" missing description`).toBeTruthy()
      expect(typeof flag.enabled, `Flag "${flag.id}" enabled is not boolean`).toBe('boolean')
    }
  })

  test('flag IDs follow kebab-case', () => {
    const kebabCaseRegex = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
    for (const flag of DEFAULT_FEATURE_FLAGS) {
      expect(flag.id).toMatch(kebabCaseRegex)
    }
  })

  test('navigation-related flags exist', () => {
    const navFlagIds = DEFAULT_FEATURE_FLAGS
      .filter(f => f.id.includes('navigation') || f.id.includes('suggestion'))
      .map(f => f.id)

    expect(navFlagIds).toContain('inline-navigation-prompts')
    expect(navFlagIds).toContain('floating-suggestion-widget')
    expect(navFlagIds.length).toBeGreaterThanOrEqual(2)
  })
})
