#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
let errors = [];

function loadJson(filePath) {
    try {
        return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filePath), 'utf8'));
    } catch (e) {
        errors.push(`Failed to parse ${filePath}: ${e.message}`);
        return null;
    }
}

// Load all files
const hubs = loadJson('knowledge/hubs.json');
const journeys = loadJson('exploration/journeys.json');
const nodes = loadJson('exploration/nodes.json');

if (!hubs || !journeys || !nodes) {
    console.error('❌ Failed to load required files');
    process.exit(1);
}

// Validate journey → hub references
for (const [id, journey] of Object.entries(journeys.journeys)) {
    if (!journey.hubId) {
        errors.push(`Journey "${id}" has no hubId`);
    } else if (!hubs.hubs[journey.hubId]) {
        errors.push(`Journey "${id}" references non-existent hub "${journey.hubId}"`);
    }
    if (!nodes.nodes[journey.entryNode]) {
        errors.push(`Journey "${id}" has invalid entryNode "${journey.entryNode}"`);
    }
}

// Validate node → journey references
for (const [id, node] of Object.entries(nodes.nodes)) {
    if (!journeys.journeys[node.journeyId]) {
        errors.push(`Node "${id}" references non-existent journey "${node.journeyId}"`);
    }
    if (node.primaryNext && !nodes.nodes[node.primaryNext]) {
        errors.push(`Node "${id}" has invalid primaryNext "${node.primaryNext}"`);
    }
}

// Validate hub paths
for (const [id, hub] of Object.entries(hubs.hubs)) {
    if (!hub.path.startsWith('hubs/')) {
        errors.push(`Hub "${id}" has non-standard path "${hub.path}"`);
    }
}

// Report
if (errors.length > 0) {
    console.error('❌ Schema validation failed:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
} else {
    console.log('✅ Schema validation passed');
    console.log(`   - ${Object.keys(hubs.hubs).length} hubs`);
    console.log(`   - ${Object.keys(journeys.journeys).length} journeys`);
    console.log(`   - ${Object.keys(nodes.nodes).length} nodes`);
    process.exit(0);
}
