#!/usr/bin/env node
/**
 * Grove Knowledge Base CLI Utility
 * 
 * Access and explore the Grove RAG knowledge base through the application layer.
 * Uses environment variables from .env for GCS authentication.
 * 
 * Usage:
 *   node scripts/kb.js list                    - List all knowledge files
 *   node scripts/kb.js list --hubs             - List all hubs
 *   node scripts/kb.js read <filename>         - Read a knowledge file
 *   node scripts/kb.js hub <hub-id>            - Show hub details and load its content
 *   node scripts/kb.js search <term>           - Search across all knowledge files
 *   node scripts/kb.js journey <journey-id>    - Show journey details
 *   node scripts/kb.js export <hub-id>         - Export hub content to local file
 *   node scripts/kb.js export-all              - Export all knowledge to local folder
 */

import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables manually from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch (e) {
    // .env file not found, rely on system env vars
  }
}
loadEnv();

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'grove-assets';

// Initialize GCS client
const storage = new Storage();
const bucket = storage.bucket(BUCKET_NAME);

// ============================================================================
// Helper Functions
// ============================================================================

async function loadNarratives() {
  try {
    const file = bucket.file('narratives.json');
    const [exists] = await file.exists();
    if (!exists) {
      console.error('narratives.json not found in bucket');
      return null;
    }
    const [content] = await file.download();
    return JSON.parse(content.toString());
  } catch (error) {
    console.error('Error loading narratives:', error.message);
    return null;
  }
}

async function listKnowledgeFiles() {
  try {
    const [files] = await bucket.getFiles({ prefix: 'knowledge/' });
    return files
      .map(f => ({
        name: f.name.replace('knowledge/', ''),
        path: f.name,
        size: parseInt(f.metadata.size || 0),
        updated: f.metadata.updated
      }))
      .filter(f => f.name !== '' && (f.name.endsWith('.md') || f.name.endsWith('.txt')));
  } catch (error) {
    console.error('Error listing files:', error.message);
    return [];
  }
}

async function listHubFiles(hubPath) {
  try {
    const [files] = await bucket.getFiles({ prefix: hubPath });
    return files
      .map(f => ({
        name: f.name.replace(hubPath, ''),
        path: f.name,
        size: parseInt(f.metadata.size || 0)
      }))
      .filter(f => f.name !== '' && (f.name.endsWith('.md') || f.name.endsWith('.txt')));
  } catch (error) {
    console.error(`Error listing hub files for ${hubPath}:`, error.message);
    return [];
  }
}

async function readFile(filePath) {
  try {
    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    if (!exists) {
      // Try with knowledge/ prefix
      const altPath = filePath.startsWith('knowledge/') ? filePath : `knowledge/${filePath}`;
      const altFile = bucket.file(altPath);
      const [altExists] = await altFile.exists();
      if (!altExists) {
        console.error(`File not found: ${filePath}`);
        return null;
      }
      const [content] = await altFile.download();
      return content.toString();
    }
    const [content] = await file.download();
    return content.toString();
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================================
// Commands
// ============================================================================

async function cmdList(options = {}) {
  if (options.hubs) {
    const narratives = await loadNarratives();
    if (!narratives) return;

    console.log('\n=== GROVE HUBS ===\n');
    
    const hubs = narratives.hubs || {};
    if (Object.keys(hubs).length === 0) {
      console.log('No hubs defined.');
      return;
    }

    for (const [id, hub] of Object.entries(hubs)) {
      const status = hub.status || (hub.enabled ? 'active' : 'disabled');
      const statusIcon = status === 'active' ? '✓' : '○';
      console.log(`${statusIcon} ${id}`);
      console.log(`    Title: ${hub.title}`);
      console.log(`    Path: ${hub.path || 'N/A'}`);
      console.log(`    Primary: ${hub.primaryFile || 'N/A'}`);
      console.log(`    Tags: ${(hub.tags || []).join(', ')}`);
      console.log('');
    }
    return;
  }

  console.log('\n=== KNOWLEDGE FILES ===\n');
  
  const files = await listKnowledgeFiles();
  if (files.length === 0) {
    console.log('No knowledge files found.');
    return;
  }

  let totalSize = 0;
  for (const file of files) {
    console.log(`  ${file.name.padEnd(50)} ${formatBytes(file.size).padStart(10)}`);
    totalSize += file.size;
  }
  console.log(`\nTotal: ${files.length} files, ${formatBytes(totalSize)}`);
}

async function cmdRead(filename) {
  if (!filename) {
    console.error('Usage: kb.js read <filename>');
    return;
  }

  const content = await readFile(filename);
  if (content) {
    console.log(content);
  }
}

async function cmdHub(hubId) {
  if (!hubId) {
    console.error('Usage: kb.js hub <hub-id>');
    return;
  }

  const narratives = await loadNarratives();
  if (!narratives) return;

  const hub = narratives.hubs?.[hubId];
  if (!hub) {
    console.error(`Hub not found: ${hubId}`);
    console.log('Available hubs:', Object.keys(narratives.hubs || {}).join(', '));
    return;
  }

  console.log(`\n=== HUB: ${hub.title} ===\n`);
  console.log(`ID: ${hubId}`);
  console.log(`Status: ${hub.status || (hub.enabled ? 'active' : 'disabled')}`);
  console.log(`Path: ${hub.path || 'N/A'}`);
  console.log(`Primary File: ${hub.primaryFile || 'N/A'}`);
  console.log(`Tags: ${(hub.tags || []).join(', ')}`);
  
  // Load hub files
  if (hub.path) {
    console.log('\n--- FILES ---\n');
    const files = await listHubFiles(hub.path);
    for (const file of files) {
      console.log(`  ${file.name.padEnd(40)} ${formatBytes(file.size).padStart(10)}`);
    }
  }

  // Load primary content
  if (hub.primaryFile && hub.path) {
    console.log('\n--- PRIMARY CONTENT ---\n');
    const gcsMapping = narratives.gcsFileMapping || {};
    let filePath = hub.path + hub.primaryFile;
    
    // Check mapping
    if (gcsMapping[hub.primaryFile]) {
      filePath = gcsMapping[hub.primaryFile];
    }
    
    const content = await readFile(filePath);
    if (content) {
      // Show first 2000 chars
      const preview = content.length > 2000 
        ? content.substring(0, 2000) + '\n\n... [truncated] ...'
        : content;
      console.log(preview);
    }
  }
}

async function cmdJourney(journeyId) {
  if (!journeyId) {
    console.error('Usage: kb.js journey <journey-id>');
    return;
  }

  const narratives = await loadNarratives();
  if (!narratives) return;

  const journey = narratives.journeys?.[journeyId];
  if (!journey) {
    console.error(`Journey not found: ${journeyId}`);
    console.log('Available journeys:', Object.keys(narratives.journeys || {}).join(', '));
    return;
  }

  console.log(`\n=== JOURNEY: ${journey.title} ===\n`);
  console.log(`ID: ${journeyId}`);
  console.log(`Description: ${journey.description}`);
  console.log(`Entry Node: ${journey.entryNode}`);
  console.log(`Linked Hub: ${journey.linkedHubId || 'None'}`);
  console.log(`Target Aha: ${journey.targetAha || 'N/A'}`);
  console.log(`Est. Minutes: ${journey.estimatedMinutes || 'N/A'}`);
  console.log(`Status: ${journey.status || 'N/A'}`);

  // Show nodes in this journey
  console.log('\n--- JOURNEY NODES ---\n');
  const nodes = Object.entries(narratives.nodes || {})
    .filter(([_, node]) => node.journeyId === journeyId)
    .sort((a, b) => (a[1].sequenceOrder || 0) - (b[1].sequenceOrder || 0));

  for (const [nodeId, node] of nodes) {
    console.log(`  ${node.sequenceOrder || '?'}. [${nodeId}] ${node.label}`);
    console.log(`     → ${node.primaryNext || 'END'}`);
  }
}

async function cmdSearch(term) {
  if (!term) {
    console.error('Usage: kb.js search <term>');
    return;
  }

  console.log(`\nSearching for: "${term}"\n`);

  const files = await listKnowledgeFiles();
  const termLower = term.toLowerCase();
  let totalMatches = 0;

  for (const file of files) {
    const content = await readFile(file.path);
    if (!content) continue;

    const lines = content.split('\n');
    const matches = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(termLower)) {
        matches.push({ lineNum: i + 1, text: lines[i].trim().substring(0, 100) });
      }
    }

    if (matches.length > 0) {
      console.log(`\n📄 ${file.name} (${matches.length} matches)`);
      for (const match of matches.slice(0, 5)) {
        console.log(`   L${match.lineNum}: ${match.text}...`);
      }
      if (matches.length > 5) {
        console.log(`   ... and ${matches.length - 5} more`);
      }
      totalMatches += matches.length;
    }
  }

  console.log(`\nTotal: ${totalMatches} matches across knowledge files`);
}

async function cmdExport(hubId) {
  if (!hubId) {
    console.error('Usage: kb.js export <hub-id>');
    return;
  }

  const narratives = await loadNarratives();
  if (!narratives) return;

  const hub = narratives.hubs?.[hubId];
  if (!hub) {
    console.error(`Hub not found: ${hubId}`);
    return;
  }

  const outputDir = path.join(__dirname, '..', 'data', 'kb-export', hubId);
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`Exporting hub "${hubId}" to ${outputDir}`);

  if (hub.path) {
    const files = await listHubFiles(hub.path);
    for (const file of files) {
      const content = await readFile(file.path);
      if (content) {
        const outPath = path.join(outputDir, file.name);
        fs.writeFileSync(outPath, content);
        console.log(`  ✓ ${file.name}`);
      }
    }
  }

  console.log('\nExport complete.');
}

async function cmdExportAll() {
  const outputDir = path.join(__dirname, '..', 'data', 'kb-export');
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`Exporting all knowledge to ${outputDir}\n`);

  // Export knowledge/ files
  const knowledgeDir = path.join(outputDir, 'knowledge');
  fs.mkdirSync(knowledgeDir, { recursive: true });
  
  const files = await listKnowledgeFiles();
  for (const file of files) {
    const content = await readFile(file.path);
    if (content) {
      // Handle nested paths (like _default/file.md or hubs/x/file.md)
      const outPath = path.join(knowledgeDir, file.name.replace(/\//g, '_'));
      fs.writeFileSync(outPath, content);
      console.log(`  ✓ knowledge/${file.name}`);
    }
  }

  // Export hub content
  const narratives = await loadNarratives();
  if (narratives?.hubs) {
    for (const [hubId, hub] of Object.entries(narratives.hubs)) {
      if (hub.path) {
        const hubDir = path.join(outputDir, 'hubs', hubId);
        fs.mkdirSync(hubDir, { recursive: true });
        
        const hubFiles = await listHubFiles(hub.path);
        for (const file of hubFiles) {
          const content = await readFile(file.path);
          if (content) {
            const outPath = path.join(hubDir, file.name);
            fs.writeFileSync(outPath, content);
            console.log(`  ✓ hubs/${hubId}/${file.name}`);
          }
        }
      }
    }
  }

  // Export narratives.json
  if (narratives) {
    const narrativesPath = path.join(outputDir, 'narratives.json');
    fs.writeFileSync(narrativesPath, JSON.stringify(narratives, null, 2));
    console.log(`  ✓ narratives.json`);
  }

  console.log('\nExport complete.');
}

// ============================================================================
// Main
// ============================================================================

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'list':
    cmdList({ hubs: args.includes('--hubs') });
    break;
  case 'read':
    cmdRead(args[1]);
    break;
  case 'hub':
    cmdHub(args[1]);
    break;
  case 'journey':
    cmdJourney(args[1]);
    break;
  case 'search':
    cmdSearch(args[1]);
    break;
  case 'export':
    cmdExport(args[1]);
    break;
  case 'export-all':
    cmdExportAll();
    break;
  default:
    console.log(`
Grove Knowledge Base CLI

Usage:
  node scripts/kb.js list                    List all knowledge files
  node scripts/kb.js list --hubs             List all hubs
  node scripts/kb.js read <filename>         Read a knowledge file
  node scripts/kb.js hub <hub-id>            Show hub details and content
  node scripts/kb.js journey <journey-id>    Show journey details
  node scripts/kb.js search <term>           Search across knowledge files
  node scripts/kb.js export <hub-id>         Export hub to local file
  node scripts/kb.js export-all              Export all knowledge locally

Environment:
  GCS_BUCKET_NAME                            Bucket name (default: grove-assets)
  GOOGLE_APPLICATION_CREDENTIALS             Path to service account JSON
`);
}
