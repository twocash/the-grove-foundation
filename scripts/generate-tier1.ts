#!/usr/bin/env npx ts-node
/**
 * generate-tier1.ts
 *
 * AI-powered script to generate Tier 1 (default) RAG context files.
 * Reads source knowledge files and uses Gemini to create condensed versions.
 *
 * Output: 3 files totaling ~15KB
 * - grove-overview.md (~3-4KB) - TL;DR of the entire thesis
 * - key-concepts.md (~5KB) - Glossary of core vocabulary
 * - visionary-narrative.md (~5KB) - The "why" emotional framing
 *
 * Usage:
 *   npx ts-node scripts/generate-tier1.ts
 *   npx ts-node scripts/generate-tier1.ts --dry-run
 *
 * Prerequisites:
 *   - GEMINI_API_KEY environment variable
 *   - gcloud auth configured for GCS access
 */

import { Storage } from '@google-cloud/storage';
import { GoogleGenAI } from '@google/genai';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BUCKET_NAME = 'grove-assets';
const OUTPUT_DIR = '_default';
const DRY_RUN = process.argv.includes('--dry-run');

// Target sizes (bytes)
const TARGET_SIZES = {
  'grove-overview.md': 4000,
  'key-concepts.md': 5000,
  'visionary-narrative.md': 5000,
};

// Source files for synthesis (exclude 212KB white paper)
const SOURCE_FILES = [
  'TL;DR Version The Grove Infrastructure for Distrib 2c6780a78eef80ec974cdddff1b7dc40.md',
  'Grove White Paper Key Concepts, Novel Methods, and 2c6780a78eef80e1a38debb983d726b2.md',
  'The Grove Condensed A World Changing Play for Dist 2c7780a78eef803fa6efc0a79568e670.md',
];

// Files to EXCLUDE (too large)
const EXCLUDED_FILES = [
  'The Grove A World-Changing Play for Distributed In 2c6780a78eef818eb98dd32985aa2182.md',
];

// ============================================================================
// PROMPTS
// ============================================================================

const PROMPTS = {
  'grove-overview.md': `You are creating a TL;DR summary of "The Grove" white paper for an AI system prompt.

TARGET: ~800 words (approximately 4KB). This is a TRUE TL;DR - be ruthlessly concise.

SOURCE MATERIAL:
{SOURCE_CONTENT}

Create a dense, information-rich summary covering:
1. The $380B infrastructure bet - what Big Tech is doing and why it matters (2-3 sentences)
2. The Ratchet thesis - 7-month doubling, 21-month lag, 8x gap (2-3 sentences)
3. The Cognitive Split - local hum vs cloud breakthrough (2-3 sentences)
4. Why local ownership beats cloud rental (2-3 sentences)
5. Grove's unique position (2-3 sentences)

FORMAT: Markdown with headers. No fluff. Every sentence must convey unique, actionable information.
DO NOT: Include implementation details, technical specs, or extended examples.
DO: Be direct, use numbers, make every word count.`,

  'key-concepts.md': `You are creating a glossary of Grove's core vocabulary for an AI system prompt.

TARGET: ~1200 words (approximately 5KB).

SOURCE MATERIAL:
{SOURCE_CONTENT}

Create a glossary covering these key terms (alphabetical order):
- Cognitive Split
- Constant Hum
- Diary System
- Efficiency Tax
- Efficiency-Enlightenment Loop
- Frontier AI / Edge AI
- Gardener
- Grove
- Knowledge Commons
- Newswire
- Observer (The)
- Ratchet Effect
- Village

FORMAT:
## Term
Definition (1-2 sentences). Key implication (1 sentence).

Be precise. Use Grove's specific terminology. Every definition should be immediately usable by an AI explaining Grove to a user.`,

  'visionary-narrative.md': `You are creating the emotional/visionary framing of Grove for an AI system prompt.

TARGET: ~1200 words (approximately 5KB).

SOURCE MATERIAL:
{SOURCE_CONTENT}

Create a narrative document covering:
1. THE STAKES - Why this matters right now (not someday)
2. THE PROBLEM - What's broken about rented AI infrastructure
3. THE VISION - What owned AI infrastructure enables
4. THE OPPORTUNITY - Why the timing is perfect (the Ratchet)
5. THE INVITATION - What it means to be part of this

TONE: Visionary but grounded. Like a founder explaining their mission to someone who gets it.
FORMAT: Markdown with headers. Can use metaphors, but back them with specifics.
DO NOT: Be preachy, vague, or use hollow tech-optimism.
DO: Make the reader feel the weight of the decision between rented and owned infrastructure.`,
};

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== Tier 1 Content Generator ===\n');

  // Check for API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('ERROR: GEMINI_API_KEY environment variable not set');
    process.exit(1);
  }

  // Initialize clients
  const storage = new Storage();
  const genai = new GoogleGenAI({ apiKey });

  console.log(`Bucket: gs://${BUCKET_NAME}/knowledge/`);
  console.log(`Output: gs://${BUCKET_NAME}/knowledge/${OUTPUT_DIR}/`);
  console.log(`Dry run: ${DRY_RUN}\n`);

  // Load source files
  console.log('Loading source files...');
  const sourceContent = await loadSourceFiles(storage);
  console.log(`Loaded ${sourceContent.length} characters from ${SOURCE_FILES.length} files\n`);

  // Generate each file
  for (const [filename, targetSize] of Object.entries(TARGET_SIZES)) {
    console.log(`\n--- Generating ${filename} (target: ${targetSize} bytes) ---`);

    const prompt = PROMPTS[filename as keyof typeof PROMPTS]
      .replace('{SOURCE_CONTENT}', sourceContent);

    try {
      const content = await generateContent(genai, prompt, targetSize);
      const actualSize = Buffer.byteLength(content, 'utf8');

      console.log(`Generated: ${actualSize} bytes (${Math.round(actualSize / targetSize * 100)}% of target)`);

      if (DRY_RUN) {
        console.log('\n--- PREVIEW (first 500 chars) ---');
        console.log(content.substring(0, 500) + '...\n');
      } else {
        await uploadToGCS(storage, `knowledge/${OUTPUT_DIR}/${filename}`, content);
        console.log(`Uploaded to gs://${BUCKET_NAME}/knowledge/${OUTPUT_DIR}/${filename}`);
      }
    } catch (error) {
      console.error(`ERROR generating ${filename}:`, error);
    }
  }

  console.log('\n=== Generation Complete ===');

  if (DRY_RUN) {
    console.log('\nThis was a dry run. Run without --dry-run to upload to GCS.');
  }
}

// ============================================================================
// HELPERS
// ============================================================================

async function loadSourceFiles(storage: Storage): Promise<string> {
  const bucket = storage.bucket(BUCKET_NAME);
  const contents: string[] = [];

  for (const filename of SOURCE_FILES) {
    try {
      const file = bucket.file(`knowledge/${filename}`);
      const [content] = await file.download();
      contents.push(`\n\n=== SOURCE: ${filename} ===\n${content.toString()}`);
      console.log(`  ✓ Loaded: ${filename} (${content.length} bytes)`);
    } catch (error) {
      console.warn(`  ✗ Failed to load: ${filename}`);
    }
  }

  return contents.join('\n');
}

async function generateContent(
  genai: GoogleGenAI,
  prompt: string,
  targetSize: number
): Promise<string> {
  const response = await genai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      temperature: 0.7,
      maxOutputTokens: Math.ceil(targetSize / 3), // Rough token estimate
    },
  });

  const text = response.text || '';

  // Trim if significantly over target
  if (Buffer.byteLength(text, 'utf8') > targetSize * 1.3) {
    console.warn(`  Warning: Output ${Buffer.byteLength(text, 'utf8')} bytes exceeds target by >30%`);
  }

  return text;
}

async function uploadToGCS(
  storage: Storage,
  path: string,
  content: string
): Promise<void> {
  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(path);

  await file.save(content, {
    contentType: 'text/markdown',
    metadata: {
      cacheControl: 'public, max-age=300',
    },
  });
}

// ============================================================================
// RUN
// ============================================================================

main().catch(console.error);
