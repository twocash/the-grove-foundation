import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '../../data')
const CONFIG_PATH = path.join(DATA_DIR, 'infrastructure/health-config.json')
const LOG_PATH = path.join(DATA_DIR, 'infrastructure/health-log.json')

// Helper to load config
function loadHealthConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
}

// Helper to load log
function loadHealthLog() {
  return JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'))
}

describe('Health Config Structure', () => {
  const config = loadHealthConfig()

  test('config has version field', () => {
    expect(config.version).toBeDefined()
    expect(typeof config.version).toBe('string')
  })

  test('config has display settings', () => {
    expect(config.display).toBeDefined()
    expect(config.display.dashboardTitle).toBeDefined()
    expect(config.display.categoryLabels).toBeDefined()
  })

  test('config has engineChecks array', () => {
    expect(config.engineChecks).toBeDefined()
    expect(Array.isArray(config.engineChecks)).toBe(true)
  })

  test('config has corpusChecks array', () => {
    expect(config.corpusChecks).toBeDefined()
    expect(Array.isArray(config.corpusChecks)).toBe(true)
  })

  test('all checks have required fields', () => {
    const allChecks = [...config.engineChecks, ...config.corpusChecks]

    for (const check of allChecks) {
      expect(check.id, `Check missing id`).toBeDefined()
      expect(check.name, `Check "${check.id}" missing name`).toBeDefined()
      expect(check.type, `Check "${check.id}" missing type`).toBeDefined()
      expect(check.severity, `Check "${check.id}" missing severity`).toBeDefined()
      expect(['critical', 'warning', 'info']).toContain(check.severity)
    }
  })

  test('check types are valid', () => {
    const validTypes = ['json-exists', 'reference-check', 'chain-valid', 'count-range', 'custom', 'engagement-machine-check', 'e2e-behavior']
    const allChecks = [...config.engineChecks, ...config.corpusChecks, ...(config.engagementChecks || [])]

    for (const check of allChecks) {
      expect(validTypes, `Check "${check.id}" has invalid type "${check.type}"`).toContain(check.type)
    }
  })

  test('json-exists checks have target.file', () => {
    const allChecks = [...config.engineChecks, ...config.corpusChecks]
    const jsonExistsChecks = allChecks.filter(c => c.type === 'json-exists')

    for (const check of jsonExistsChecks) {
      expect(check.target?.file, `json-exists check "${check.id}" missing target.file`).toBeDefined()
    }
  })

  test('reference-check checks have source and target', () => {
    const allChecks = [...config.engineChecks, ...config.corpusChecks]
    const refChecks = allChecks.filter(c => c.type === 'reference-check')

    for (const check of refChecks) {
      expect(check.source?.file, `reference-check "${check.id}" missing source.file`).toBeDefined()
      expect(check.source?.path, `reference-check "${check.id}" missing source.path`).toBeDefined()
      expect(check.target?.file, `reference-check "${check.id}" missing target.file`).toBeDefined()
      expect(check.target?.path, `reference-check "${check.id}" missing target.path`).toBeDefined()
    }
  })

  test('chain-valid checks have required params', () => {
    const allChecks = [...config.engineChecks, ...config.corpusChecks]
    const chainChecks = allChecks.filter(c => c.type === 'chain-valid')

    for (const check of chainChecks) {
      expect(check.params?.entryField, `chain-valid "${check.id}" missing params.entryField`).toBeDefined()
      expect(check.params?.nodeFile, `chain-valid "${check.id}" missing params.nodeFile`).toBeDefined()
      expect(check.params?.linkField, `chain-valid "${check.id}" missing params.linkField`).toBeDefined()
    }
  })
})

describe('Health Log Structure', () => {
  const log = loadHealthLog()

  test('log has version field', () => {
    expect(log.version).toBeDefined()
    expect(typeof log.version).toBe('string')
  })

  test('log has maxEntries limit', () => {
    expect(log.maxEntries).toBeDefined()
    expect(typeof log.maxEntries).toBe('number')
    expect(log.maxEntries).toBeGreaterThan(0)
    expect(log.maxEntries).toBeLessThanOrEqual(100)
  })

  test('log has entries array', () => {
    expect(log.entries).toBeDefined()
    expect(Array.isArray(log.entries)).toBe(true)
  })

  test('entries do not exceed maxEntries', () => {
    expect(log.entries.length).toBeLessThanOrEqual(log.maxEntries)
  })
})

describe('Display Configuration', () => {
  const config = loadHealthConfig()

  test('has all expected category labels', () => {
    const expectedCategories = ['engine', 'schema-integrity', 'journey-navigation', 'rag-integration']

    for (const category of expectedCategories) {
      expect(config.display.categoryLabels[category],
        `Missing category label for "${category}"`
      ).toBeDefined()
    }
  })

  test('category labels are human-readable strings', () => {
    for (const [key, label] of Object.entries(config.display.categoryLabels)) {
      expect(typeof label).toBe('string')
      expect((label as string).length).toBeGreaterThan(0)
      // Labels should contain spaces (human-readable)
      expect((label as string).includes(' ') || (label as string) === key,
        `Category label "${label}" should be human-readable`
      ).toBe(true)
    }
  })
})
