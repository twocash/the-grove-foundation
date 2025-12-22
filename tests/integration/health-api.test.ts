import { describe, test, expect, beforeAll } from 'vitest'
import { healthCheck, fetchHealth, fetchHealthConfig, fetchHealthHistory, runHealthCheck } from '../utils/api'

describe('Health API Endpoints', () => {
  let serverRunning = false

  beforeAll(async () => {
    try {
      await healthCheck()
      serverRunning = true
    } catch (err) {
      console.log('Server not running, skipping integration tests')
    }
  })

  describe('GET /api/health', () => {
    test('returns health report with required fields', async () => {
      if (!serverRunning) return

      const report = await fetchHealth()

      expect(report.timestamp).toBeDefined()
      expect(report.configVersion).toBeDefined()
      expect(report.engineVersion).toBeDefined()
      expect(report.categories).toBeDefined()
      expect(Array.isArray(report.categories)).toBe(true)
      expect(report.summary).toBeDefined()
    })

    test('report has valid summary counts', async () => {
      if (!serverRunning) return

      const report = await fetchHealth()

      expect(typeof report.summary.total).toBe('number')
      expect(typeof report.summary.passed).toBe('number')
      expect(typeof report.summary.failed).toBe('number')
      expect(typeof report.summary.warnings).toBe('number')

      // Total should equal passed + failed + warnings
      expect(report.summary.total).toBe(
        report.summary.passed + report.summary.failed + report.summary.warnings
      )
    })

    test('categories have correct structure', async () => {
      if (!serverRunning) return

      const report = await fetchHealth()

      for (const category of report.categories) {
        expect(category.id).toBeDefined()
        expect(category.name).toBeDefined()
        expect(['pass', 'fail', 'warn']).toContain(category.status)
        expect(Array.isArray(category.checks)).toBe(true)
      }
    })

    test('checks have correct structure', async () => {
      if (!serverRunning) return

      const report = await fetchHealth()

      for (const category of report.categories) {
        for (const check of category.checks) {
          expect(check.id).toBeDefined()
          expect(check.name).toBeDefined()
          expect(['pass', 'fail', 'warn']).toContain(check.status)
          expect(check.message).toBeDefined()
        }
      }
    })
  })

  describe('GET /api/health/config', () => {
    test('returns config with display settings', async () => {
      if (!serverRunning) return

      const config = await fetchHealthConfig()

      expect(config.version).toBeDefined()
      expect(config.display).toBeDefined()
      expect(config.display.dashboardTitle).toBeDefined()
      expect(config.display.categoryLabels).toBeDefined()
    })

    test('returns check counts', async () => {
      if (!serverRunning) return

      const config = await fetchHealthConfig()

      expect(config.checkCount).toBeDefined()
      expect(typeof config.checkCount.engine).toBe('number')
      expect(typeof config.checkCount.corpus).toBe('number')
    })
  })

  describe('GET /api/health/history', () => {
    test('returns entries array with total', async () => {
      if (!serverRunning) return

      const history = await fetchHealthHistory()

      expect(history.entries).toBeDefined()
      expect(Array.isArray(history.entries)).toBe(true)
      expect(typeof history.total).toBe('number')
    })

    test('entries have attribution', async () => {
      if (!serverRunning) return

      // First run a check to ensure we have history
      await runHealthCheck()

      const history = await fetchHealthHistory()

      if (history.entries.length > 0) {
        const entry = history.entries[0]
        expect(entry.attribution).toBeDefined()
        expect(entry.attribution.triggeredBy).toBeDefined()
      }
    })

    test('respects limit parameter', async () => {
      if (!serverRunning) return

      const history = await fetchHealthHistory(5)

      expect(history.entries.length).toBeLessThanOrEqual(5)
    })
  })

  describe('POST /api/health/run', () => {
    test('runs check and returns entry with id', async () => {
      if (!serverRunning) return

      const entry = await runHealthCheck()

      expect(entry.id).toBeDefined()
      expect(entry.timestamp).toBeDefined()
      expect(entry.configVersion).toBeDefined()
      expect(entry.engineVersion).toBeDefined()
      expect(entry.summary).toBeDefined()
    })

    test('entry includes api attribution', async () => {
      if (!serverRunning) return

      const entry = await runHealthCheck()

      expect(entry.attribution).toBeDefined()
      expect(entry.attribution.triggeredBy).toBe('api')
    })

    test('adds entry to history', async () => {
      if (!serverRunning) return

      const beforeHistory = await fetchHealthHistory()
      const beforeCount = beforeHistory.total

      await runHealthCheck()

      const afterHistory = await fetchHealthHistory()

      expect(afterHistory.total).toBeGreaterThan(beforeCount)
    })
  })
})
