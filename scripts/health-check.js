#!/usr/bin/env node
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '../data')

function loadJson(filePath) {
  const fullPath = path.join(DATA_DIR, filePath)
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'))
}

function generateHealthReport() {
  const categories = []

  // Schema checks
  const schemaChecks = []
  let hubs, journeys, nodes

  try {
    hubs = loadJson('knowledge/hubs.json')
    journeys = loadJson('exploration/journeys.json')
    nodes = loadJson('exploration/nodes.json')

    schemaChecks.push({
      name: 'Hub count',
      status: Object.keys(hubs.hubs).length === 6 ? 'pass' : 'fail',
      message: `${Object.keys(hubs.hubs).length} hubs defined (expected 6)`,
    })

    schemaChecks.push({
      name: 'Journey count',
      status: Object.keys(journeys.journeys).length === 6 ? 'pass' : 'fail',
      message: `${Object.keys(journeys.journeys).length} journeys defined (expected 6)`,
    })

    schemaChecks.push({
      name: 'Node count',
      status: Object.keys(nodes.nodes).length === 24 ? 'pass' : 'fail',
      message: `${Object.keys(nodes.nodes).length} nodes defined (expected 24)`,
    })

    // Check journey→hub references
    const hubRefErrors = []
    for (const [id, journey] of Object.entries(journeys.journeys)) {
      if (!hubs.hubs[journey.hubId]) {
        hubRefErrors.push(`${id} → ${journey.hubId}`)
      }
    }
    schemaChecks.push({
      name: 'Journey→Hub refs',
      status: hubRefErrors.length === 0 ? 'pass' : 'fail',
      message: hubRefErrors.length === 0
        ? 'All journey→hub references valid'
        : `Invalid: ${hubRefErrors.join(', ')}`,
      impact: hubRefErrors.length > 0 ? 'Journeys fail to load RAG context' : undefined,
      inspect: 'cat data/exploration/journeys.json | grep hubId',
      file: 'data/exploration/journeys.json',
    })

    // Check journey→entryNode references
    const entryNodeErrors = []
    for (const [id, journey] of Object.entries(journeys.journeys)) {
      if (!nodes.nodes[journey.entryNode]) {
        entryNodeErrors.push(`${id} → ${journey.entryNode}`)
      }
    }
    schemaChecks.push({
      name: 'Journey→EntryNode refs',
      status: entryNodeErrors.length === 0 ? 'pass' : 'fail',
      message: entryNodeErrors.length === 0
        ? 'All journey→entryNode references valid'
        : `Invalid: ${entryNodeErrors.join(', ')}`,
      impact: entryNodeErrors.length > 0 ? 'Journeys cannot start' : undefined,
      inspect: 'cat data/exploration/journeys.json | grep entryNode',
      file: 'data/exploration/journeys.json',
    })

    // Check node→journey references
    const nodeJourneyErrors = []
    for (const [id, node] of Object.entries(nodes.nodes)) {
      if (!journeys.journeys[node.journeyId]) {
        nodeJourneyErrors.push(`${id} → ${node.journeyId}`)
      }
    }
    schemaChecks.push({
      name: 'Node→Journey refs',
      status: nodeJourneyErrors.length === 0 ? 'pass' : 'fail',
      message: nodeJourneyErrors.length === 0
        ? 'All node→journey references valid'
        : `Invalid: ${nodeJourneyErrors.join(', ')}`,
      impact: nodeJourneyErrors.length > 0 ? 'Nodes orphaned from journeys' : undefined,
      inspect: 'cat data/exploration/nodes.json | grep journeyId',
      file: 'data/exploration/nodes.json',
    })

    // Check node→primaryNext references
    const primaryNextErrors = []
    for (const [id, node] of Object.entries(nodes.nodes)) {
      if (node.primaryNext && !nodes.nodes[node.primaryNext]) {
        primaryNextErrors.push(`${id} → ${node.primaryNext}`)
      }
    }
    schemaChecks.push({
      name: 'Node→PrimaryNext refs',
      status: primaryNextErrors.length === 0 ? 'pass' : 'fail',
      message: primaryNextErrors.length === 0
        ? 'All primaryNext references valid'
        : `Invalid: ${primaryNextErrors.join(', ')}`,
      impact: primaryNextErrors.length > 0 ? 'Journey navigation broken' : undefined,
      inspect: 'cat data/exploration/nodes.json | grep primaryNext',
      file: 'data/exploration/nodes.json',
    })

    // Check node→alternateNext references
    const altNextErrors = []
    for (const [id, node] of Object.entries(nodes.nodes)) {
      if (node.alternateNext) {
        for (const altId of node.alternateNext) {
          if (!nodes.nodes[altId]) {
            altNextErrors.push(`${id} → ${altId}`)
          }
        }
      }
    }
    schemaChecks.push({
      name: 'Node→AlternateNext refs',
      status: altNextErrors.length === 0 ? 'pass' : 'fail',
      message: altNextErrors.length === 0
        ? 'All alternateNext references valid'
        : `Invalid: ${altNextErrors.join(', ')}`,
      impact: altNextErrors.length > 0 ? 'Alternate paths broken' : undefined,
      inspect: 'cat data/exploration/nodes.json | grep alternateNext',
      file: 'data/exploration/nodes.json',
    })

  } catch (err) {
    schemaChecks.push({
      name: 'Schema parsing',
      status: 'fail',
      message: `Failed to parse: ${err.message}`,
      impact: 'Application will crash on load',
    })
  }

  const schemaStatus = schemaChecks.some(c => c.status === 'fail') ? 'fail'
    : schemaChecks.some(c => c.status === 'warn') ? 'warn' : 'pass'

  categories.push({
    name: 'SCHEMA INTEGRITY',
    status: schemaStatus,
    checks: schemaChecks,
  })

  // Journey Chain checks
  if (hubs && journeys && nodes) {
    const chainChecks = []

    function traverseChain(entryNode, journeyId) {
      const visited = []
      let current = entryNode
      while (current && !visited.includes(current)) {
        visited.push(current)
        const node = nodes.nodes[current]
        if (node?.primaryNext && nodes.nodes[node.primaryNext]?.journeyId === journeyId) {
          current = node.primaryNext
        } else {
          current = undefined
        }
      }
      return visited
    }

    function getJourneyNodes(journeyId) {
      return Object.entries(nodes.nodes)
        .filter(([_, node]) => node.journeyId === journeyId)
        .map(([id]) => id)
    }

    for (const [id, journey] of Object.entries(journeys.journeys)) {
      const expectedNodes = getJourneyNodes(id)
      const chain = traverseChain(journey.entryNode, id)
      const complete = chain.length === expectedNodes.length

      chainChecks.push({
        name: `${id} chain`,
        status: complete ? 'pass' : 'fail',
        message: complete
          ? `Complete: ${chain.length} nodes`
          : `Incomplete: ${chain.length}/${expectedNodes.length} nodes reachable`,
        impact: !complete ? `Journey "${id}" truncated` : undefined,
        inspect: `node -e "console.log(require('./data/exploration/nodes.json').nodes)"`,
      })
    }

    const chainStatus = chainChecks.some(c => c.status === 'fail') ? 'fail'
      : chainChecks.some(c => c.status === 'warn') ? 'warn' : 'pass'

    categories.push({
      name: 'JOURNEY CHAINS',
      status: chainStatus,
      checks: chainChecks,
    })
  }

  // Calculate summary
  const allChecks = categories.flatMap(c => c.checks)
  const summary = {
    total: allChecks.length,
    passed: allChecks.filter(c => c.status === 'pass').length,
    failed: allChecks.filter(c => c.status === 'fail').length,
    warnings: allChecks.filter(c => c.status === 'warn').length,
  }

  return {
    timestamp: new Date().toISOString(),
    categories,
    summary,
  }
}

function formatReport(report) {
  const lines = []

  const statusIcon = report.summary.failed > 0 ? '❌'
    : report.summary.warnings > 0 ? '⚠️' : '✅'

  lines.push('╔══════════════════════════════════════════════════════════════════╗')
  lines.push('║                    GROVE TERMINAL HEALTH CHECK                   ║')
  lines.push('╠══════════════════════════════════════════════════════════════════╣')
  lines.push(`║  Run: ${report.timestamp.slice(0, 19).replace('T', ' ')}                                     ║`)
  lines.push(`║  Status: ${statusIcon}  ${report.summary.failed} failures, ${report.summary.warnings} warnings                              ║`)
  lines.push('╚══════════════════════════════════════════════════════════════════╝')
  lines.push('')

  for (const category of report.categories) {
    const catIcon = category.status === 'pass' ? '✅ PASS'
      : category.status === 'fail' ? '❌ FAIL' : '⚠️ WARN'

    lines.push(`┌─────────────────────────────────────────────────────────────────┐`)
    lines.push(`│ ${category.name.padEnd(50)} ${catIcon.padStart(7)} │`)
    lines.push(`├─────────────────────────────────────────────────────────────────┤`)

    for (const check of category.checks) {
      const icon = check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '!'
      lines.push(`│ ${icon} ${check.message.slice(0, 60).padEnd(60)} │`)

      if (check.status !== 'pass' && check.impact) {
        lines.push(`│   IMPACT: ${check.impact.slice(0, 55).padEnd(55)} │`)
      }
      if (check.status !== 'pass' && check.inspect) {
        lines.push(`│   INSPECT: ${check.inspect.slice(0, 54).padEnd(54)} │`)
      }
    }

    lines.push(`└─────────────────────────────────────────────────────────────────┘`)
    lines.push('')
  }

  lines.push(`Summary: ${report.summary.passed}/${report.summary.total} passed`)

  return lines.join('\n')
}

// Main execution
const args = process.argv.slice(2)
const jsonOutput = args.includes('--json')

const report = generateHealthReport()

if (jsonOutput) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(formatReport(report))
}

process.exit(report.summary.failed > 0 ? 1 : 0)
