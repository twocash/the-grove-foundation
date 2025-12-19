#!/usr/bin/env node
/**
 * Concept Stream Analyzer
 *
 * Analyzes data/concept-stream.jsonl to find:
 * - High-frequency concepts (potential hub candidates)
 * - Co-occurring concept clusters
 * - Trending vs cooling concepts
 *
 * Usage:
 *   node scripts/analyze-concepts.js [options]
 *
 * Options:
 *   --top N           Show top N concepts (default: 20)
 *   --min-count N     Minimum occurrences to include (default: 3)
 *   --days N          Only analyze last N days (default: all)
 *   --output FILE     Write JSON report to file
 *   --verbose         Show detailed output
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DECAY_HALF_LIFE_DAYS = 7;
const DEFAULT_TOP = 20;
const DEFAULT_MIN_COUNT = 3;

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    top: DEFAULT_TOP,
    minCount: DEFAULT_MIN_COUNT,
    days: null,
    output: null,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--top':
        options.top = parseInt(args[++i], 10);
        break;
      case '--min-count':
        options.minCount = parseInt(args[++i], 10);
        break;
      case '--days':
        options.days = parseInt(args[++i], 10);
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        console.log(`
Concept Stream Analyzer

Usage: node scripts/analyze-concepts.js [options]

Options:
  --top N           Show top N concepts (default: 20)
  --min-count N     Minimum occurrences to include (default: 3)
  --days N          Only analyze last N days (default: all)
  --output FILE     Write JSON report to file
  --verbose         Show detailed output
  --help            Show this help message
`);
        process.exit(0);
    }
  }

  return options;
}

// Normalize concept for comparison
function normalize(concept) {
  return concept
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[^\w\s'-]/g, '');
}

// Stream JSONL file line by line
async function* streamJsonl(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.trim()) {
      try {
        yield JSON.parse(line);
      } catch (e) {
        console.warn(`Skipping malformed line: ${line.substring(0, 50)}...`);
      }
    }
  }
}

// Calculate heat score for a concept
function calculateHeat(occurrences, now) {
  const frequency = occurrences.length;

  // Recency: exponential decay based on most recent occurrence
  const mostRecent = Math.max(...occurrences.map(o => new Date(o.ts).getTime()));
  const daysSinceLastSeen = (now.getTime() - mostRecent) / (1000 * 60 * 60 * 24);
  const recency = Math.exp(-daysSinceLastSeen / DECAY_HALF_LIFE_DAYS);

  // Velocity: compare last 7 days to previous 7 days
  const last7Days = occurrences.filter(o => {
    const days = (now.getTime() - new Date(o.ts).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 7;
  }).length;

  const prev7Days = occurrences.filter(o => {
    const days = (now.getTime() - new Date(o.ts).getTime()) / (1000 * 60 * 60 * 24);
    return days > 7 && days <= 14;
  }).length;

  const velocity = prev7Days > 0 ? (last7Days - prev7Days) / prev7Days : (last7Days > 0 ? 1 : 0);

  // Composite heat score (0-1 range, approximately)
  const rawHeat = (Math.log(frequency + 1) * 0.4) + (recency * 0.4) + (Math.max(0, velocity) * 0.2);
  const heat = Math.min(1, rawHeat / 3); // Normalize to 0-1

  return {
    frequency,
    recency: Math.round(recency * 100) / 100,
    velocity: Math.round(velocity * 100) / 100,
    heat: Math.round(heat * 100) / 100,
    daysSinceLastSeen: Math.round(daysSinceLastSeen * 10) / 10
  };
}

// Build co-occurrence matrix
function buildCoOccurrenceMatrix(events) {
  const matrix = {};

  for (const event of events) {
    const concepts = event.concepts.map(normalize);
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        const a = concepts[i];
        const b = concepts[j];

        matrix[a] = matrix[a] || {};
        matrix[a][b] = (matrix[a][b] || 0) + 1;

        matrix[b] = matrix[b] || {};
        matrix[b][a] = (matrix[b][a] || 0) + 1;
      }
    }
  }

  return matrix;
}

// Find top co-occurring concepts for a term
function getTopCoOccurrences(term, matrix, limit = 5) {
  const related = matrix[term] || {};
  return Object.entries(related)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }));
}

// Main analysis function
async function analyze(options) {
  const logPath = path.join(__dirname, '..', 'data', 'concept-stream.jsonl');

  if (!fs.existsSync(logPath)) {
    console.log('No concept stream found at:', logPath);
    console.log('Run some Terminal queries first to generate concept data.');
    return null;
  }

  const now = new Date();
  const cutoffDate = options.days
    ? new Date(now.getTime() - options.days * 24 * 60 * 60 * 1000)
    : null;

  // Collect all events
  const events = [];
  const conceptOccurrences = {}; // normalized term -> [{ts, node, ctx}]

  console.log('Reading concept stream...');

  for await (const event of streamJsonl(logPath)) {
    const eventDate = new Date(event.ts);

    // Filter by date if specified
    if (cutoffDate && eventDate < cutoffDate) {
      continue;
    }

    events.push(event);

    for (const concept of event.concepts) {
      const normalized = normalize(concept);
      conceptOccurrences[normalized] = conceptOccurrences[normalized] || [];
      conceptOccurrences[normalized].push({
        ts: event.ts,
        node: event.node,
        ctx: event.ctx,
        original: concept // Keep original casing
      });
    }
  }

  console.log(`Analyzed ${events.length} events`);

  // Calculate heat scores for all concepts
  const conceptStats = Object.entries(conceptOccurrences)
    .filter(([_, occs]) => occs.length >= options.minCount)
    .map(([term, occurrences]) => {
      const heat = calculateHeat(occurrences, now);
      const originalForm = occurrences[0].original; // Use first occurrence's casing

      return {
        term,
        displayTerm: originalForm,
        ...heat
      };
    })
    .sort((a, b) => b.heat - a.heat);

  // Build co-occurrence matrix
  const coMatrix = buildCoOccurrenceMatrix(events);

  // Add co-occurrences to top concepts
  const topConcepts = conceptStats.slice(0, options.top).map(concept => ({
    ...concept,
    coOccurs: getTopCoOccurrences(concept.term, coMatrix, 5)
  }));

  // Find emerging clusters (simple greedy clustering)
  const clusters = [];
  const assigned = new Set();

  for (const concept of conceptStats.slice(0, 50)) { // Consider top 50 for clustering
    if (assigned.has(concept.term)) continue;

    const cluster = {
      anchor: concept.displayTerm,
      terms: [concept.term],
      totalHeat: concept.heat
    };
    assigned.add(concept.term);

    const related = coMatrix[concept.term] || {};
    for (const [relatedTerm, count] of Object.entries(related)) {
      if (!assigned.has(relatedTerm) && count >= 3) {
        cluster.terms.push(relatedTerm);
        assigned.add(relatedTerm);

        const relatedStats = conceptStats.find(c => c.term === relatedTerm);
        if (relatedStats) {
          cluster.totalHeat += relatedStats.heat;
        }
      }
    }

    if (cluster.terms.length > 1) {
      cluster.avgHeat = Math.round((cluster.totalHeat / cluster.terms.length) * 100) / 100;
      clusters.push(cluster);
    }
  }

  clusters.sort((a, b) => b.avgHeat - a.avgHeat);

  // Build report
  const report = {
    analyzedAt: now.toISOString(),
    totalEvents: events.length,
    uniqueConcepts: Object.keys(conceptOccurrences).length,
    timeRange: {
      start: events.length > 0 ? events[0].ts : null,
      end: events.length > 0 ? events[events.length - 1].ts : null
    },
    options: {
      top: options.top,
      minCount: options.minCount,
      days: options.days
    },
    topConcepts,
    clusters: clusters.slice(0, 10),
    coldConcepts: conceptStats
      .filter(c => c.daysSinceLastSeen > 7 && c.heat < 0.3)
      .slice(0, 5)
  };

  return report;
}

// Format report for console output
function printReport(report, verbose = false) {
  console.log('\n' + '='.repeat(60));
  console.log('CONCEPT ANALYSIS REPORT');
  console.log('='.repeat(60));

  console.log(`\nAnalyzed: ${report.analyzedAt}`);
  console.log(`Events: ${report.totalEvents}`);
  console.log(`Unique concepts: ${report.uniqueConcepts}`);
  if (report.timeRange.start) {
    console.log(`Time range: ${report.timeRange.start.split('T')[0]} to ${report.timeRange.end.split('T')[0]}`);
  }

  console.log('\n' + '-'.repeat(60));
  console.log('TOP CONCEPTS (by heat score)');
  console.log('-'.repeat(60));

  for (const concept of report.topConcepts) {
    const heatBar = '█'.repeat(Math.round(concept.heat * 10)) + '░'.repeat(10 - Math.round(concept.heat * 10));
    console.log(`\n  "${concept.displayTerm}"`);
    console.log(`  Heat: [${heatBar}] ${concept.heat}`);
    console.log(`  Freq: ${concept.frequency} | Recency: ${concept.recency} | Velocity: ${concept.velocity > 0 ? '+' : ''}${concept.velocity}`);

    if (concept.coOccurs.length > 0) {
      console.log(`  Co-occurs: ${concept.coOccurs.map(c => `${c.term}(${c.count})`).join(', ')}`);
    }
  }

  if (report.clusters.length > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log('EMERGING CLUSTERS');
    console.log('-'.repeat(60));

    for (const cluster of report.clusters) {
      console.log(`\n  Anchor: "${cluster.anchor}" (avg heat: ${cluster.avgHeat})`);
      console.log(`  Terms: ${cluster.terms.join(', ')}`);
    }
  }

  if (report.coldConcepts.length > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log('COOLING CONCEPTS (potential deprecation)');
    console.log('-'.repeat(60));

    for (const concept of report.coldConcepts) {
      console.log(`  "${concept.displayTerm}" - last seen ${concept.daysSinceLastSeen} days ago (heat: ${concept.heat})`);
    }
  }

  console.log('\n' + '='.repeat(60));
}

// Main entry point
async function main() {
  const options = parseArgs();

  try {
    const report = await analyze(options);

    if (!report) {
      process.exit(1);
    }

    printReport(report, options.verbose);

    if (options.output) {
      fs.writeFileSync(options.output, JSON.stringify(report, null, 2));
      console.log(`\nReport written to: ${options.output}`);
    }

  } catch (error) {
    console.error('Analysis failed:', error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
