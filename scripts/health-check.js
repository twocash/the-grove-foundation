#!/usr/bin/env node
/**
 * Health Check CLI
 *
 * Uses the shared health-validator engine to run health checks
 * and output results in human-readable or JSON format.
 *
 * Usage:
 *   npm run health          # Human-readable output
 *   npm run health -- --json  # JSON output
 */

import { loadConfig, runChecks, appendToHealthLog } from '../lib/health-validator.js'

const args = process.argv.slice(2)
const jsonOutput = args.includes('--json')
const logResult = args.includes('--log')

try {
  const config = loadConfig()
  const report = runChecks(config)

  // Optionally log the result
  if (logResult) {
    appendToHealthLog(report, { triggeredBy: 'cli' })
  }

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    printHumanReadable(report, config.display)
  }

  process.exit(report.summary.failed > 0 ? 1 : 0)
} catch (err) {
  console.error('Health check failed:', err.message)
  process.exit(1)
}

function printHumanReadable(report, display) {
  const width = 60

  console.log()
  console.log('='.repeat(width))
  console.log(`  ${display.dashboardTitle || 'System Health'}`)
  console.log(`  Config: ${report.configVersion} | Engine: ${report.engineVersion}`)
  console.log('='.repeat(width))
  console.log()

  for (const category of report.categories) {
    const label = display.categoryLabels?.[category.id] || category.id
    const icon = category.status === 'pass' ? '[PASS]' :
                 category.status === 'fail' ? '[FAIL]' : '[WARN]'

    console.log(`${icon} ${label}`)
    console.log('-'.repeat(width))

    for (const check of category.checks) {
      const checkIcon = check.status === 'pass' ? '  [OK]' :
                        check.status === 'fail' ? '  [X]' : '  [!]'

      console.log(`${checkIcon} ${check.name}`)
      console.log(`        ${check.message}`)

      if (check.status === 'fail' && check.impact) {
        console.log(`        IMPACT: ${check.impact}`)
      }
      if (check.status === 'fail' && check.inspect) {
        console.log(`        INSPECT: ${check.inspect}`)
      }
    }
    console.log()
  }

  console.log('-'.repeat(width))
  const statusIcon = report.summary.failed > 0 ? '[FAIL]' :
                     report.summary.warnings > 0 ? '[WARN]' : '[PASS]'
  console.log(`${statusIcon} Total: ${report.summary.total} | Passed: ${report.summary.passed} | Failed: ${report.summary.failed} | Warnings: ${report.summary.warnings}`)
  console.log('-'.repeat(width))
  console.log()
}
