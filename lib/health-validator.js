/**
 * Health Validator - Declarative Health Check Engine
 *
 * Implements Trellis Architecture / DEX Standard:
 * - Declarative Sovereignty: checks defined in JSON, interpreted at runtime
 * - Provenance as Infrastructure: full attribution chain on all log entries
 * - Three-Layer DEX Stack: engine checks vs corpus checks explicitly separated
 * - Organic Scalability: works without config, becomes more powerful with it
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, '../data')
const CONFIG_PATH = path.join(DATA_DIR, 'infrastructure/health-config.json')
const LOG_PATH = path.join(DATA_DIR, 'infrastructure/health-log.json')

// Default config for progressive enhancement
const DEFAULT_CONFIG = {
  version: '1.0-default',
  display: {
    dashboardTitle: 'System Health',
    categoryLabels: {
      'engine': 'Engine Health',
      'schema-integrity': 'Schema Integrity',
      'journey-navigation': 'Journey Navigation',
      'rag-integration': 'RAG Integration'
    }
  },
  engineChecks: [],
  corpusChecks: []
}

/**
 * Load health configuration from file
 * Returns default config with warning if file is missing
 */
export function loadConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      console.warn('[health-validator] Config file not found, using defaults')
      return { ...DEFAULT_CONFIG, _warning: 'Using default config - health-config.json not found' }
    }

    const content = fs.readFileSync(CONFIG_PATH, 'utf8')
    const config = JSON.parse(content)

    // Merge with defaults for any missing fields
    return {
      ...DEFAULT_CONFIG,
      ...config,
      display: { ...DEFAULT_CONFIG.display, ...config.display }
    }
  } catch (err) {
    console.error('[health-validator] Error loading config:', err.message)
    return {
      ...DEFAULT_CONFIG,
      _error: `Failed to load config: ${err.message}`
    }
  }
}

/**
 * Get engine version from package.json
 */
export function getEngineVersion() {
  try {
    const pkgPath = path.join(__dirname, '../package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    return pkg.version || '0.0.0'
  } catch {
    return '0.0.0'
  }
}

/**
 * Load a JSON file from the data directory
 */
function loadDataFile(filePath) {
  const fullPath = path.join(DATA_DIR, filePath)
  const content = fs.readFileSync(fullPath, 'utf8')
  return JSON.parse(content)
}

/**
 * Extract values from an object using a path like "nodes.*.journeyId"
 * Returns array of values found
 */
function extractValues(obj, pathPattern) {
  const parts = pathPattern.split('.')

  function traverse(current, pathIndex) {
    if (pathIndex >= parts.length) {
      return [current]
    }

    const part = parts[pathIndex]

    if (part === '*') {
      // Wildcard: iterate over all keys
      if (typeof current !== 'object' || current === null) {
        return []
      }
      const results = []
      for (const key of Object.keys(current)) {
        results.push(...traverse(current[key], pathIndex + 1))
      }
      return results
    } else {
      // Direct property access
      if (current === null || current === undefined) {
        return []
      }
      return traverse(current[part], pathIndex + 1)
    }
  }

  return traverse(obj, 0)
}

/**
 * Check Type Executors
 */

// json-exists: Verify file exists and parses as valid JSON
function executeJsonExists(def) {
  const filePath = def.target?.file
  if (!filePath) {
    return { status: 'fail', message: 'No target file specified' }
  }

  try {
    const fullPath = path.join(DATA_DIR, filePath)
    if (!fs.existsSync(fullPath)) {
      return { status: 'fail', message: `File not found: ${filePath}` }
    }

    const content = fs.readFileSync(fullPath, 'utf8')
    JSON.parse(content)
    return { status: 'pass', message: `Valid JSON: ${filePath}` }
  } catch (err) {
    return { status: 'fail', message: `Invalid JSON: ${err.message}` }
  }
}

// reference-check: Verify all references resolve
function executeReferenceCheck(def) {
  const sourcePath = def.source?.file
  const sourceProp = def.source?.path
  const targetPath = def.target?.file
  const targetProp = def.target?.path
  const allowNull = def.params?.allowNull ?? false
  const isArray = def.params?.isArray ?? false

  if (!sourcePath || !sourceProp || !targetPath || !targetProp) {
    return { status: 'fail', message: 'Missing source or target configuration' }
  }

  try {
    const sourceData = loadDataFile(sourcePath)
    const targetData = loadDataFile(targetPath)

    // Extract source values
    let sourceValues = extractValues(sourceData, sourceProp)

    // Flatten arrays if isArray is true
    if (isArray) {
      sourceValues = sourceValues.flat().filter(v => v !== undefined)
    }

    // Get target keys
    const targetKeys = new Set(extractValues(targetData, targetProp).flatMap(obj =>
      typeof obj === 'object' && obj !== null ? Object.keys(obj) : []
    ))

    // If target path points to an object directly, get its keys
    if (targetKeys.size === 0) {
      const targetObj = extractValues(targetData, targetProp)[0]
      if (typeof targetObj === 'object' && targetObj !== null) {
        Object.keys(targetObj).forEach(k => targetKeys.add(k))
      }
    }

    // Check each source value
    const broken = []
    for (const value of sourceValues) {
      if (value === null || value === undefined) {
        if (!allowNull) {
          broken.push('null')
        }
        continue
      }

      if (!targetKeys.has(value)) {
        broken.push(value)
      }
    }

    if (broken.length === 0) {
      return {
        status: 'pass',
        message: `All ${sourceValues.length} references valid`
      }
    } else {
      return {
        status: 'fail',
        message: `${broken.length} broken references: ${broken.slice(0, 3).join(', ')}${broken.length > 3 ? '...' : ''}`,
        details: { broken }
      }
    }
  } catch (err) {
    return { status: 'fail', message: `Check failed: ${err.message}` }
  }
}

// chain-valid: Follow links from entry through linkField until terminal or maxDepth
function executeChainValid(def) {
  const sourcePath = def.source?.file
  const sourceProp = def.source?.path
  const params = def.params || {}
  const { entryField, nodeFile, linkField, maxDepth = 50, terminalValues = [null] } = params

  if (!sourcePath || !nodeFile || !linkField) {
    return { status: 'fail', message: 'Missing chain configuration' }
  }

  try {
    const sourceData = loadDataFile(sourcePath)
    const nodeData = loadDataFile(nodeFile)

    // Get the journeys object
    const journeys = extractValues(sourceData, sourceProp)[0] || {}
    const nodes = nodeData.nodes || {}

    const issues = []
    const terminalSet = new Set(terminalValues.map(v => v === null ? 'null' : v))

    for (const [journeyId, journey] of Object.entries(journeys)) {
      const entryNode = journey[entryField]
      if (!entryNode) {
        issues.push(`${journeyId}: no entry node`)
        continue
      }

      const visited = new Set()
      let current = entryNode
      let depth = 0

      while (depth < maxDepth) {
        if (visited.has(current)) {
          // Loop detected - this is actually okay for cross-journey navigation
          break
        }
        visited.add(current)

        const node = nodes[current]
        if (!node) {
          issues.push(`${journeyId}: broken link at ${current}`)
          break
        }

        const next = node[linkField]
        if (next === null || next === undefined || terminalSet.has(String(next))) {
          // Reached terminal - success
          break
        }

        // Check if next node belongs to same journey
        const nextNode = nodes[next]
        if (nextNode && nextNode.journeyId !== journeyId) {
          // Cross-journey link - that's fine, this journey ends here
          break
        }

        current = next
        depth++
      }

      if (depth >= maxDepth) {
        issues.push(`${journeyId}: max depth exceeded (possible loop)`)
      }
    }

    if (issues.length === 0) {
      return {
        status: 'pass',
        message: `All ${Object.keys(journeys).length} journey chains valid`
      }
    } else {
      return {
        status: 'warn',
        message: `${issues.length} chain issues: ${issues.slice(0, 2).join('; ')}${issues.length > 2 ? '...' : ''}`,
        details: { issues }
      }
    }
  } catch (err) {
    return { status: 'fail', message: `Chain check failed: ${err.message}` }
  }
}

/**
 * e2e-behavior: Check status from most recent test run
 * Looks up test result in health log by test ID
 */
function executeE2EBehavior(def) {
  const testRef = def.test // Format: "file.spec.ts:test name"
  if (!testRef) {
    return { status: 'warn', message: 'No test reference specified' }
  }

  // Parse "file.spec.ts:test name" format
  const colonIndex = testRef.indexOf(':')
  const testName = colonIndex > 0 ? testRef.slice(colonIndex + 1) : testRef
  const testId = testName.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  // Find most recent e2e-tests entry
  const log = loadHealthLog()
  const e2eEntry = log.entries.find(entry =>
    entry.categories?.some(cat => cat.id === 'e2e-tests')
  )

  if (!e2eEntry) {
    return {
      status: 'warn',
      message: 'No E2E test data available - run tests first'
    }
  }

  const e2eCategory = e2eEntry.categories.find(c => c.id === 'e2e-tests')
  const testResult = e2eCategory?.checks?.find(c =>
    c.id === testId ||
    c.name?.toLowerCase().includes(testName.toLowerCase())
  )

  if (!testResult) {
    return {
      status: 'warn',
      message: `Test not found: ${testRef}`
    }
  }

  return {
    status: testResult.status,
    message: testResult.message,
    details: {
      file: testResult.file,
      lastRun: e2eEntry.timestamp
    }
  }
}

/**
 * Execute a single check based on its type
 */
function executeCheck(def) {
  switch (def.type) {
    case 'json-exists':
      return executeJsonExists(def)
    case 'reference-check':
      return executeReferenceCheck(def)
    case 'chain-valid':
      return executeChainValid(def)
    case 'e2e-behavior':
      return executeE2EBehavior(def)
    default:
      return { status: 'warn', message: `Unknown check type: ${def.type}` }
  }
}

/**
 * Run all health checks from config
 */
export function runChecks(config) {
  const timestamp = new Date().toISOString()
  const configVersion = config.version || 'unknown'
  const engineVersion = getEngineVersion()

  // Combine all checks
  const allChecks = [
    ...(config.engineChecks || []),
    ...(config.corpusChecks || []),
    ...(config.engagementChecks || [])
  ]

  // Group checks by category
  const categoryMap = new Map()

  for (const checkDef of allChecks) {
    const categoryId = checkDef.category || 'uncategorized'
    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        id: categoryId,
        name: config.display?.categoryLabels?.[categoryId] || categoryId,
        checks: []
      })
    }

    // Execute the check
    const result = executeCheck(checkDef)

    categoryMap.get(categoryId).checks.push({
      id: checkDef.id,
      name: checkDef.name,
      status: result.status,
      message: result.message,
      impact: checkDef.impact,
      inspect: checkDef.inspect,
      details: result.details
    })
  }

  // Calculate category statuses
  const categories = Array.from(categoryMap.values()).map(cat => {
    const hasFail = cat.checks.some(c => c.status === 'fail')
    const hasWarn = cat.checks.some(c => c.status === 'warn')
    return {
      ...cat,
      status: hasFail ? 'fail' : hasWarn ? 'warn' : 'pass'
    }
  })

  // Calculate summary
  const allResults = categories.flatMap(c => c.checks)
  const summary = {
    total: allResults.length,
    passed: allResults.filter(c => c.status === 'pass').length,
    failed: allResults.filter(c => c.status === 'fail').length,
    warnings: allResults.filter(c => c.status === 'warn').length
  }

  return {
    timestamp,
    configVersion,
    engineVersion,
    categories,
    summary
  }
}

/**
 * Load health log from file
 */
export function loadHealthLog() {
  try {
    if (!fs.existsSync(LOG_PATH)) {
      return { version: '1.0', maxEntries: 100, entries: [] }
    }

    const content = fs.readFileSync(LOG_PATH, 'utf8')
    return JSON.parse(content)
  } catch (err) {
    console.error('[health-validator] Error loading health log:', err.message)
    return { version: '1.0', maxEntries: 100, entries: [] }
  }
}

/**
 * Append a health report to the log with attribution
 * Enforces FIFO cap at maxEntries
 */
export function appendToHealthLog(report, attribution = {}) {
  const log = loadHealthLog()

  const entry = {
    id: randomUUID(),
    ...report,
    attribution: {
      triggeredBy: attribution.triggeredBy || 'manual',
      userId: attribution.userId || null,
      sessionId: attribution.sessionId || null,
      timestamp: new Date().toISOString()
    }
  }

  // Add to beginning (most recent first)
  log.entries.unshift(entry)

  // Enforce cap
  const maxEntries = log.maxEntries || 100
  if (log.entries.length > maxEntries) {
    log.entries = log.entries.slice(0, maxEntries)
  }

  // Write back
  try {
    fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2))
  } catch (err) {
    console.error('[health-validator] Error writing health log:', err.message)
  }

  return entry
}

// Export all functions
export default {
  loadConfig,
  runChecks,
  loadHealthLog,
  appendToHealthLog,
  getEngineVersion
}
