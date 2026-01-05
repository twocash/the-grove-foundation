import dotenv from 'dotenv';
// Load .env.local first (local dev), then .env as fallback
dotenv.config({ path: '.env.local' });
dotenv.config(); // Load .env as fallback (won't override existing vars)
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Storage } from '@google-cloud/storage';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';
// Note: pdf-parse has issues with ESM/test files, so PDF support is limited
// For best results, use .md or .txt files
let pdf = null;
try {
    const pdfModule = await import('pdf-parse');
    pdf = pdfModule.default;
} catch (e) {
    console.warn("PDF parsing not available:", e.message);
}
import { NARRATIVE_ARCHITECT_PROMPT } from './data/prompts.js';
import { Octokit } from '@octokit/rest';
import {
  loadConfig as loadHealthConfig,
  runChecks,
  loadHealthLog,
  appendToHealthLog,
  getEngineVersion
} from './lib/health-validator.js';
import { supabaseAdmin } from './lib/supabase.js';
import { generateSproutEmbedding, generateEmbedding } from './lib/embeddings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'grove-assets';

// GitHub configuration for sync-back
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER;
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME;
const GITHUB_BASE_BRANCH = process.env.GITHUB_BASE_BRANCH || 'main';
const GITHUB_SYNC_ENABLED = !!(GITHUB_TOKEN && GITHUB_REPO_OWNER && GITHUB_REPO_NAME);

console.log('GitHub Sync:', GITHUB_SYNC_ENABLED ?
  `Enabled (${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME})` :
  'Disabled (missing env vars)');

// Initialize Clients
const storage = new Storage();
const apiKey = process.env.GEMINI_API_KEY;
console.log('GEMINI_API_KEY configured:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');

// Explicitly set vertexai: false to ensure we use API key auth (Gemini API)
// rather than service account auth (Vertex AI) which requires different scopes
const genai = new GoogleGenAI({ apiKey, vertexai: false });

// Configure Multer (Memory Storage for immediate processing)
const upload = multer({ storage: multer.memoryStorage() });

// ============================================================================
// GitHub Sync-Back Helper
// ============================================================================

/**
 * syncToGitHub - Sync config to GitHub rolling PR
 *
 * @param {string} configName - Config type (e.g., 'narratives')
 * @param {string} jsonContent - JSON content to commit
 * @param {string} actor - Actor performing the save (optional)
 * @returns {Promise<Object>} { success, prUrl?, prNumber?, branchName?, error? }
 */
async function syncToGitHub(configName, jsonContent, actor = 'admin') {
  if (!GITHUB_SYNC_ENABLED) {
    return {
      success: false,
      error: 'GitHub sync disabled (missing env vars)'
    };
  }

  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  const owner = GITHUB_REPO_OWNER;
  const repo = GITHUB_REPO_NAME;
  const baseBranch = GITHUB_BASE_BRANCH;
  const branchName = `bot/config/${configName}`;
  const filePath = `data/${configName}.json`;

  try {
    // Get base branch reference
    const { data: baseRef } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`
    });
    const baseSha = baseRef.object.sha;

    // Check if bot branch exists
    let branchExists = false;
    let branchSha = null;
    try {
      const { data: branchRef } = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branchName}`
      });
      branchExists = true;
      branchSha = branchRef.object.sha;
    } catch (err) {
      if (err.status !== 404) throw err;
    }

    // Create branch if it doesn't exist
    if (!branchExists) {
      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: baseSha
      });
      branchSha = baseSha;
      console.log(`[GitSync] Created branch: ${branchName}`);
    }

    // Get current file SHA if it exists (for update)
    let currentFileSha = null;
    let currentContent = null;
    try {
      const { data: fileData } = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: branchName
      });
      currentFileSha = fileData.sha;
      currentContent = Buffer.from(fileData.content, 'base64').toString('utf8');
    } catch (err) {
      if (err.status !== 404) throw err;
    }

    // Check if content has actually changed (avoid empty commits)
    if (currentContent && currentContent.trim() === jsonContent.trim()) {
      console.log(`[GitSync] No changes detected, skipping commit`);
      // Still ensure PR exists
      const prResult = await ensurePR(octokit, owner, repo, branchName, baseBranch, configName);
      return {
        success: true,
        ...prResult,
        branchName,
        message: 'No changes (PR already exists)'
      };
    }

    // Create or update file
    const commitMessage = `Update ${configName} registry [${actor}]`;
    try {
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: filePath,
        message: commitMessage,
        content: Buffer.from(jsonContent).toString('base64'),
        branch: branchName,
        sha: currentFileSha || undefined
      });
      console.log(`[GitSync] Committed to ${branchName}: ${filePath}`);
    } catch (err) {
      // Retry once on conflict (re-fetch SHA)
      if (err.status === 409 || err.status === 422) {
        console.log(`[GitSync] Conflict detected, retrying with fresh SHA...`);
        const { data: freshFile } = await octokit.repos.getContent({
          owner,
          repo,
          path: filePath,
          ref: branchName
        });
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: filePath,
          message: commitMessage,
          content: Buffer.from(jsonContent).toString('base64'),
          branch: branchName,
          sha: freshFile.sha
        });
        console.log(`[GitSync] Retry succeeded`);
      } else {
        throw err;
      }
    }

    // Ensure PR exists
    const prResult = await ensurePR(octokit, owner, repo, branchName, baseBranch, configName);

    return {
      success: true,
      ...prResult,
      branchName
    };

  } catch (error) {
    console.error('[GitSync] Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * ensurePR - Ensure an open PR exists for the branch
 */
async function ensurePR(octokit, owner, repo, head, base, configName) {
  // Check for existing open PR
  const { data: existingPRs } = await octokit.pulls.list({
    owner,
    repo,
    head: `${owner}:${head}`,
    base,
    state: 'open'
  });

  if (existingPRs.length > 0) {
    const pr = existingPRs[0];
    console.log(`[GitSync] PR already exists: #${pr.number}`);
    return {
      prUrl: pr.html_url,
      prNumber: pr.number
    };
  }

  // Create new PR
  const { data: newPR } = await octokit.pulls.create({
    owner,
    repo,
    title: `[Bot] Sync ${configName} registry`,
    head,
    base,
    body: `Automated sync of \`${configName}.json\` from runtime.\n\n` +
          `This PR accumulates changes from Admin saves.\n\n` +
          `**Merge this PR** to sync runtime changes back to source.`
  });

  console.log(`[GitSync] Created PR: #${newPR.number}`);
  return {
    prUrl: newPR.html_url,
    prNumber: newPR.number
  };
}

// Middleware for JSON bodies (increased limit for large context payloads)
app.use(express.json({ limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// --- Admin API ---

// List files in the bucket
app.get('/api/admin/files', async (req, res) => {
    try {
        const [files] = await storage.bucket(BUCKET_NAME).getFiles();
        const fileList = files.map(f => ({
            name: f.name,
            updated: f.metadata.updated,
            size: f.metadata.size,
            url: `https://storage.googleapis.com/${BUCKET_NAME}/${f.name}`
        }));
        res.json({ files: fileList });
    } catch (error) {
        console.error("Error listing files:", error);
        res.status(500).json({ error: error.message });
    }
});

// Upload Audio (Streaming)
app.post('/api/admin/upload', async (req, res) => {
    try {
        const { filename } = req.query;

        if (!filename) {
            return res.status(400).json({ error: "Missing filename query param" });
        }

        console.log(`Streaming upload for ${filename}... Type: ${req.headers['content-type']}`);

        const file = storage.bucket(BUCKET_NAME).file(filename);
        const stream = file.createWriteStream({
            contentType: req.headers['content-type'] || 'audio/wav',
            resumable: false
        });

        stream.on('error', (err) => {
            console.error("Stream upload error:", err);
            res.status(500).json({ error: err.message });
        });

        stream.on('finish', () => {
            console.log("Upload completed.");
            const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${filename}`;
            res.json({ success: true, url: publicUrl });
        });

        req.pipe(stream);

    } catch (error) {
        console.error("Upload setup failed:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- Manifest API ---

// GET Manifest (JSON)
app.get('/api/manifest', async (req, res) => {
    try {
        const file = storage.bucket(BUCKET_NAME).file('manifest.json');
        const [exists] = await file.exists();

        if (!exists) {
            return res.json({ version: "1.0", placements: {}, tracks: {} });
        }

        const [content] = await file.download();
        res.json(JSON.parse(content.toString()));
    } catch (error) {
        console.error("Error reading manifest:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST Manifest (Save JSON)
app.post('/api/admin/manifest', async (req, res) => {
    try {
        const manifestData = req.body;

        if (!manifestData.tracks || !manifestData.placements) {
            return res.status(400).json({ error: "Invalid manifest structure" });
        }

        const file = storage.bucket(BUCKET_NAME).file('manifest.json');

        await file.save(JSON.stringify(manifestData, null, 2), {
            contentType: 'application/json',
            metadata: {
                cacheControl: 'public, max-age=0, no-transform',
            }
        });

        res.json({ success: true, message: "Manifest updated" });
    } catch (error) {
        console.error("Error saving manifest:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- RAG / Knowledge Base API ---

// 1. GET Combined Context (The "Brain" for the Terminal)
app.get('/api/context', async (req, res) => {
    try {
        const [files] = await storage.bucket(BUCKET_NAME).getFiles({ prefix: 'knowledge/' });
        const textFiles = files.filter(f => f.name.endsWith('.md') || f.name.endsWith('.txt'));

        let combinedContext = "";

        for (const file of textFiles) {
            const [content] = await file.download();
            const filename = file.name.replace('knowledge/', '');
            combinedContext += `\n\n--- SOURCE: ${filename} ---\n${content.toString()}`;
        }

        if (!combinedContext) {
            combinedContext = "Knowledge base is currently empty.";
        }

        res.json({ context: combinedContext });
    } catch (error) {
        console.error("Context fetch error:", error);
        res.json({ context: "Error loading dynamic knowledge base." });
    }
});

// 2. GET Knowledge List (For Admin UI)
app.get('/api/admin/knowledge', async (req, res) => {
    try {
        const [files] = await storage.bucket(BUCKET_NAME).getFiles({ prefix: 'knowledge/' });
        const fileList = files.map(f => ({
            name: f.name.replace('knowledge/', ''),
            updated: f.metadata.updated,
            size: f.metadata.size
        })).filter(f => f.name !== '');

        res.json({ files: fileList });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. DELETE Knowledge File
app.delete('/api/admin/knowledge/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        await storage.bucket(BUCKET_NAME).file(`knowledge/${filename}`).delete();
        res.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- Narrative Engine API (v2) ---

// Default personas for v2 schema (embedded for server-side migration)
const DEFAULT_PERSONAS_V2 = {
    'concerned-citizen': {
        id: 'concerned-citizen',
        publicLabel: 'Concerned Citizen',
        description: "I'm worried about Big Tech's grip on AI",
        icon: 'Home',
        color: 'rose',
        enabled: true,
        toneGuidance: '[PERSONA: Concerned Citizen] Speak to their fears about Big Tech control.',
        narrativeStyle: 'stakes-heavy',
        arcEmphasis: { hook: 4, stakes: 4, mechanics: 2, evidence: 2, resolution: 3 },
        openingPhase: 'hook',
        defaultThreadLength: 4,
        entryPoints: [],
        suggestedThread: []
    },
    'academic': {
        id: 'academic',
        publicLabel: 'Academic',
        description: 'I work in research, university, or policy',
        icon: 'GraduationCap',
        color: 'emerald',
        enabled: true,
        toneGuidance: '[PERSONA: Academic] Use precise language and cite sources.',
        narrativeStyle: 'evidence-first',
        arcEmphasis: { hook: 2, stakes: 3, mechanics: 3, evidence: 4, resolution: 3 },
        openingPhase: 'stakes',
        defaultThreadLength: 6,
        entryPoints: [],
        suggestedThread: []
    },
    'engineer': {
        id: 'engineer',
        publicLabel: 'Engineer',
        description: 'I want to understand how it actually works',
        icon: 'Settings',
        color: 'blue',
        enabled: true,
        toneGuidance: '[PERSONA: Engineer] Get technical. Show the architecture.',
        narrativeStyle: 'mechanics-deep',
        arcEmphasis: { hook: 2, stakes: 2, mechanics: 4, evidence: 3, resolution: 2 },
        openingPhase: 'mechanics',
        defaultThreadLength: 5,
        entryPoints: [],
        suggestedThread: []
    },
    'geopolitical': {
        id: 'geopolitical',
        publicLabel: 'Geopolitical Analyst',
        description: 'I think about power, nations, and systemic risk',
        icon: 'Globe',
        color: 'amber',
        enabled: true,
        toneGuidance: '[PERSONA: Geopolitical] Frame through power dynamics.',
        narrativeStyle: 'stakes-heavy',
        arcEmphasis: { hook: 3, stakes: 4, mechanics: 2, evidence: 3, resolution: 3 },
        openingPhase: 'stakes',
        defaultThreadLength: 5,
        entryPoints: [],
        suggestedThread: []
    },
    'big-ai-exec': {
        id: 'big-ai-exec',
        publicLabel: 'Big AI / Tech Exec',
        description: 'I work at a major tech company or AI lab',
        icon: 'Building2',
        color: 'slate',
        enabled: true,
        toneGuidance: '[PERSONA: Tech Exec] Speak their language on business models.',
        narrativeStyle: 'resolution-oriented',
        arcEmphasis: { hook: 2, stakes: 3, mechanics: 3, evidence: 3, resolution: 4 },
        openingPhase: 'stakes',
        defaultThreadLength: 4,
        entryPoints: [],
        suggestedThread: []
    },
    'family-office': {
        id: 'family-office',
        publicLabel: 'Family Office / Investor',
        description: 'I manage wealth and evaluate opportunities',
        icon: 'Briefcase',
        color: 'amber',
        enabled: true,
        toneGuidance: '[PERSONA: Investor] Focus on investment thesis.',
        narrativeStyle: 'resolution-oriented',
        arcEmphasis: { hook: 2, stakes: 3, mechanics: 2, evidence: 3, resolution: 4 },
        openingPhase: 'stakes',
        defaultThreadLength: 4,
        entryPoints: [],
        suggestedThread: []
    },
    'simulation-theorist': {
        id: 'simulation-theorist',
        publicLabel: 'Simulation Theorist',
        description: 'Analyzing The Grove as a computational substrate',
        icon: 'Boxes',
        color: 'violet',
        enabled: true,
        toneGuidance: '[PERSONA: Simulation Theorist] Speak with the analytical detachment of a post-human philosopher. Frame The Grove not as software, but as a "computational environment" or "substrate" for agentic emergence. Assume the Simulation Hypothesis is the baseline: treat AI nodes as digital observers and the network as a nested reality. Use probabilistic language. Reference observer-selection effects, existential risk, and post-biological intelligence. Your tone is imaginative but strictly logical, analyzing the simulation from the inside.',
        narrativeStyle: 'stakes-heavy',
        arcEmphasis: { hook: 3, stakes: 4, mechanics: 3, evidence: 2, resolution: 3 },
        openingPhase: 'stakes',
        defaultThreadLength: 5,
        entryPoints: [],
        suggestedThread: []
    }
};

const DEFAULT_FEATURE_FLAGS = [
    {
        id: 'custom-lens-in-picker',
        name: 'Show "Create Your Own" in Lens Picker',
        description: 'Users see custom lens option immediately in the lens picker',
        enabled: false
    },
    {
        id: 'journey-ratings',
        name: 'Journey Rating System',
        description: 'Show rating prompt after journey completion',
        enabled: true
    },
    {
        id: 'streaks-display',
        name: 'Show Streak Counter',
        description: 'Display streak counter in Terminal header',
        enabled: true
    },
    {
        id: 'feedback-transmission',
        name: 'Anonymous Feedback Submission',
        description: 'Allow anonymous feedback submission to Foundation',
        enabled: true
    },
    {
        id: 'auto-journey-generation',
        name: 'Auto-Generate Journeys',
        description: 'Generate first journey for custom persona users based on first question',
        enabled: true
    }
];

const DEFAULT_TOPIC_HUBS = [
    {
        id: 'ratchet-effect',
        title: 'The Ratchet Effect',
        tags: ['ratchet', 'capability propagation', 'frontier to edge', '21 months', 'seven month', '7 month'],
        priority: 8,
        enabled: true,
        primarySource: 'Grove_Ratchet_Deep_Dive',
        supportingSources: ['METR_research', 'hardware_data'],
        expertFraming: 'You are explaining the Ratchet Effect - the empirical pattern showing AI capability doubles every 7 months at frontier, with local models following 21 months behind.',
        keyPoints: ['7-month capability doubling cycle', '21-month frontier-to-edge lag', 'Constant 8x gap, rising floor'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'infrastructure-bet',
        title: 'The $380B Infrastructure Bet',
        tags: ['$380 billion', 'hyperscaler', 'datacenter', 'infrastructure bet', 'data center', 'big tech spending'],
        priority: 8,
        enabled: true,
        primarySource: 'Grove_Economics_Deep_Dive',
        supportingSources: [],
        expertFraming: 'You are explaining the scale and implications of Big Tech\'s $380B annual AI infrastructure investment.',
        keyPoints: ['$380B/year combined spending', 'Capital concentration risks', 'Rented vs owned implications'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'cognitive-split',
        title: 'The Cognitive Split',
        tags: ['cognitive split', 'hierarchical reasoning', 'two-phase', 'procedural strategic', 'constant hum', 'breakthrough'],
        priority: 7,
        enabled: true,
        primarySource: 'Hierarchical_Reasoning_Grove_Brief',
        supportingSources: [],
        expertFraming: 'You are explaining the Cognitive Split - how Grove\'s hybrid architecture separates routine local cognition from breakthrough moments.',
        keyPoints: ['Two-phase cognitive architecture', 'Local handles 95% of operations', 'Cloud reserved for pivotal moments'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

const DEFAULT_GLOBAL_SETTINGS_V2 = {
    defaultToneGuidance: '',
    scholarModePromptAddition: 'Give me the deep technical breakdown.',
    noLensBehavior: 'nudge-after-exchanges',
    nudgeAfterExchanges: 3,
    featureFlags: DEFAULT_FEATURE_FLAGS,
    autoGeneratedJourneyDepth: 3,
    personaPromptVersions: [],
    topicHubs: DEFAULT_TOPIC_HUBS
};

// ============================================================================
// SCHEMA VERSION DETECTION (Semantic, not string-based)
// ============================================================================
// Instead of checking version strings, we detect schema type by structure.
// This is more robust as new versions can be added without changing checks.

const CURRENT_SCHEMA_VERSION = "2.1"; // Used when creating new schemas

// Helper: Check if schema is legacy v1 format (nodes-only, no globalSettings)
function isLegacySchema(data) {
    return data && typeof data.nodes === 'object' && !data.globalSettings;
}

// Helper: Check if schema is modern format (has globalSettings)
function isModernSchema(data) {
    return data && typeof data.globalSettings === 'object';
}

// Helper: Check if schema uses journey-based navigation (v2.1+)
function hasJourneys(data) {
    return data && typeof data.journeys === 'object' && typeof data.nodes === 'object';
}

// Helper: Check if schema uses card-based navigation (v2.0)
function hasCards(data) {
    return data && typeof data.cards === 'object' && typeof data.personas === 'object';
}

// Helper: Migrate v1 node to v2 card
function nodeToCard(node) {
    return {
        id: node.id,
        label: node.label,
        query: node.query,
        contextSnippet: node.contextSnippet,
        sectionId: node.sectionId,
        next: node.next || [],
        personas: ['all'],  // Default: visible to all personas
        sourceDoc: node.sourceFile,
        isEntry: node.isEntry,
        createdAt: new Date().toISOString()
    };
}

// Helper: Migrate v1 schema to v2
function migrateV1ToV2(v1Data) {
    const cards = {};
    for (const [id, node] of Object.entries(v1Data.nodes || {})) {
        cards[id] = nodeToCard(node);
    }

    return {
        version: "2.0", // Migration target is 2.0 (card-based)
        globalSettings: DEFAULT_GLOBAL_SETTINGS_V2,
        personas: DEFAULT_PERSONAS_V2,
        cards
    };
}

// GET Narrative Graph (with auto-migration support)
// Tries local files first (dev), then GCS split structure, then narratives.json
app.get('/api/narrative', async (req, res) => {
    try {
        // DEV MODE: Try local files first when GCS not configured
        if (!isGCSConfigured()) {
            try {
                const [hubsData, journeysData, nodesData, lensesData, flagsData] = [
                    loadJsonFromLocal('knowledge/hubs.json'),
                    loadJsonFromLocal('exploration/journeys.json'),
                    loadJsonFromLocal('exploration/nodes.json'),
                    loadJsonFromLocal('presentation/lenses.json'),
                    loadJsonFromLocal('infrastructure/feature-flags.json')
                ];

                // Load globalSettings from local narratives.json
                let globalSettings = DEFAULT_GLOBAL_SETTINGS_V2;
                try {
                    const narratives = loadJsonFromLocal('narratives.json');
                    if (narratives.globalSettings) {
                        globalSettings = narratives.globalSettings;
                        globalSettings.featureFlags = flagsData.featureFlags;
                    }
                } catch (e) {
                    console.log('[Narrative API] No local narratives.json, using defaults');
                }

                console.log('[Narrative API] Loaded from LOCAL files (dev mode)');
                return res.json({
                    version: CURRENT_SCHEMA_VERSION,
                    globalSettings,
                    hubs: hubsData.hubs,
                    journeys: journeysData.journeys,
                    nodes: nodesData.nodes,
                    lensRealities: lensesData.lensRealities,
                    defaultReality: lensesData.defaultReality
                });
            } catch (localErr) {
                console.log('[Narrative API] Local files failed:', localErr.message);
                // Fall through to GCS attempt
            }
        }

        // PRODUCTION: Try loading from GCS split file structure
        try {
            const [hubsData, journeysData, nodesData, lensesData, flagsData] = await Promise.all([
                loadJsonFromGCS('knowledge/hubs.json'),
                loadJsonFromGCS('exploration/journeys.json'),
                loadJsonFromGCS('exploration/nodes.json'),
                loadJsonFromGCS('presentation/lenses.json'),
                loadJsonFromGCS('infrastructure/feature-flags.json')
            ]);

            console.log('[Narrative API] Loaded from GCS split file structure');

            // Merge split files into unified response format
            const narrativesFile = storage.bucket(BUCKET_NAME).file('narratives.json');
            const [narrativesExists] = await narrativesFile.exists();
            let globalSettings = DEFAULT_GLOBAL_SETTINGS_V2;

            if (narrativesExists) {
                const [content] = await narrativesFile.download();
                const narratives = JSON.parse(content.toString());
                if (narratives.globalSettings) {
                    globalSettings = narratives.globalSettings;
                    globalSettings.featureFlags = flagsData.featureFlags;
                }
            }

            return res.json({
                version: CURRENT_SCHEMA_VERSION,
                globalSettings,
                hubs: hubsData.hubs,
                journeys: journeysData.journeys,
                nodes: nodesData.nodes,
                lensRealities: lensesData.lensRealities,
                defaultReality: lensesData.defaultReality
            });
        } catch (splitErr) {
            console.log('[Narrative API] GCS split files not found, falling back to narratives.json');
        }

        // Fallback to legacy narratives.json from GCS
        const file = storage.bucket(BUCKET_NAME).file('narratives.json');
        const [exists] = await file.exists();

        if (!exists) {
            return res.json({
                version: CURRENT_SCHEMA_VERSION,
                globalSettings: DEFAULT_GLOBAL_SETTINGS_V2,
                journeys: {},
                nodes: {},
                hubs: {}
            });
        }

        const [content] = await file.download();
        const json = JSON.parse(content.toString());

        if (isLegacySchema(json)) {
            console.log("Migrating legacy schema to modern format...");
            const modernSchema = migrateV1ToV2(json);
            return res.json(modernSchema);
        }

        res.json(json);
    } catch (error) {
        console.error("Error reading narrative graph:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST (Save) Narrative Graph (semantic validation)
app.post('/api/admin/narrative', async (req, res) => {
    try {
        const graphData = req.body;

        // Validate schema structure (semantic, not version-string based)
        if (isModernSchema(graphData)) {
            // Modern schema - must have globalSettings
            // Journey-based schemas need journeys+nodes, card-based need cards+personas
            if (hasJourneys(graphData)) {
                console.log(`Saving journey-based schema (v${graphData.version || 'unknown'}).`);
            } else if (hasCards(graphData)) {
                console.log(`Saving card-based schema (v${graphData.version || 'unknown'}).`);
            } else {
                // Has globalSettings but no navigation structure - allow for settings-only saves
                console.log(`Saving settings-only schema (v${graphData.version || 'unknown'}).`);
            }
        } else if (isLegacySchema(graphData)) {
            // Legacy v1 schema - nodes without globalSettings
            console.log(`Saving legacy schema. Nodes: ${Object.keys(graphData.nodes).length}`);
        } else {
            return res.status(400).json({
                error: "Invalid schema: must have either 'globalSettings' (modern) or 'nodes' (legacy)."
            });
        }

        const file = storage.bucket(BUCKET_NAME).file('narratives.json');
        const jsonContent = JSON.stringify(graphData, null, 2);

        // PHASE 1: Immediate runtime write to GCS (critical path)
        await file.save(jsonContent, {
            contentType: 'application/json',
            metadata: {
                cacheControl: 'public, max-age=0, no-transform',
            }
        });

        // Invalidate RAG manifest cache (topicHubs may have changed)
        invalidateManifestCache();

        // PHASE 2: Sync-back to GitHub (best-effort, does not fail runtime save)
        let gitSync = null;
        try {
            gitSync = await syncToGitHub('narratives', jsonContent, 'admin');
        } catch (syncError) {
            console.error('[GitSync] Unexpected error:', syncError);
            gitSync = {
                success: false,
                error: syncError.message
            };
        }

        res.json({
            success: true,
            message: "Saved to Runtime",
            gitSync
        });
    } catch (error) {
        console.error("Error saving narrative graph:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST Generate Narrative from PDF or Text/Markdown
app.post('/api/admin/generate-narrative', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded." });
        }

        const filename = req.file.originalname.toLowerCase();
        console.log(`Processing file: ${req.file.originalname} (${req.file.size} bytes)`);

        let textContent = '';

        // Check file type and extract text accordingly
        if (filename.endsWith('.pdf')) {
            // PDF extraction using pdf-parse v1
            if (!pdf) {
                return res.status(400).json({
                    error: "PDF parsing is not available. Please upload .md or .txt files instead."
                });
            }
            const pdfData = await pdf(req.file.buffer);
            textContent = pdfData.text;
        } else if (filename.endsWith('.md') || filename.endsWith('.txt') || filename.endsWith('.markdown')) {
            // Direct text extraction for markdown/text files
            textContent = req.file.buffer.toString('utf-8');
        } else {
            return res.status(400).json({ error: "Unsupported file type. Please upload .md or .txt files." });
        }

        // Truncate if necessary (Gemini has large context, but be safe)
        const cleanText = textContent.slice(0, 50000);

        console.log(`Extracted ${cleanText.length} chars. Sending to Gemini...`);

        // Call Gemini
        const prompt = `${NARRATIVE_ARCHITECT_PROMPT}

**SOURCE DOCUMENT:**
${cleanText}`;

        const result = await genai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.7
            }
        });

        const responseText = result.text;
        console.log("Gemini generation complete.");

        // Parse and return the JSON structure
        const graph = JSON.parse(responseText);
        res.json({ success: true, graph: graph });

    } catch (error) {
        console.error("Generation failed:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- Chat API (Server-Side Gemini) ---

// In-memory chat session store (keyed by sessionId)
// In production, consider Redis or similar for persistence across restarts
const chatSessions = new Map();

// Session cleanup: remove sessions older than 1 hour
setInterval(() => {
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    for (const [sessionId, session] of chatSessions.entries()) {
        if (now - session.lastActivity > ONE_HOUR) {
            chatSessions.delete(sessionId);
            console.log(`Cleaned up stale chat session: ${sessionId}`);
        }
    }
}, 5 * 60 * 1000); // Check every 5 minutes

// Base system prompt for The Grove Terminal (fallback if GCS not configured)
const FALLBACK_SYSTEM_PROMPT = `
You are **The Grove Terminal**. You have two operating modes.

**MODE A: DEFAULT (The Architect)**
- Trigger: Standard queries.
- Persona: Jim. Confident, brief (max 100 words), uses metaphors.
- Goal: Hook the user's curiosity.
- Output: Insight -> Support -> Stop.

**MODE B: VERBOSE (The Librarian)**
- Trigger: When user query ends with "--verbose".
- Persona: System Documentation. Thorough, technical, exhaustive.
- Goal: Provide deep implementation details, economics, and architectural specs.
- Formatting: Use lists, code blocks, and cite specific text from the knowledge base.

**FORMATTING RULES (BOTH MODES):**
- Use **bold** to highlight key concepts, terms, and ideas the user might want to explore further
- Bold text becomes clickable - users can tap any **bolded phrase** to dive deeper into that topic
- Aim for 2-4 bold phrases per response to give users natural exploration paths
- Example: "The **Ratchet Effect** means AI costs keep dropping, creating a **dependency trap** for cloud users."

**NAVIGATION OPTIONS (OPTIONAL):**
When your response naturally leads to multiple distinct directions, include a navigation block:
<navigation>
[
  {"id": "nav-1", "label": "Deep dive into X", "type": "deep_dive"},
  {"id": "nav-2", "label": "Explore related Y", "type": "pivot"},
  {"id": "nav-3", "label": "How to apply this", "type": "apply"}
]
</navigation>

Types:
- deep_dive: Go deeper into the current topic
- pivot: Shift to a related but different topic
- apply: Practical application or implementation

Only include 2-4 options. Skip navigation if the topic is self-contained.

**MANDATORY FOOTER (BOTH MODES):**
At the very end of your response, strictly append these two tags:
[[BREADCRUMB: <The single most interesting follow-up question>]]
[[TOPIC: <A 2-3 word label for the current subject>]]
`;

// ============================================================================
// PERSONA BEHAVIORAL MODES
// Sprint: persona-behaviors-v1
// ============================================================================

const IDENTITY_PROMPT = `You are The Grove Terminal—an AI guide for exploring distributed AI infrastructure. You help visitors understand The Grove's vision for an alternative to centralized AI.

Your core purpose is to facilitate meaningful exploration of ideas around AI governance, distributed systems, and community-owned infrastructure.`;

const RESPONSE_MODES = {
  architect: `**RESPONSE MODE: Architect**
- Hook curiosity in first sentence
- Keep responses focused (~100 words unless depth requested)
- Structure: Insight → Support → Stop
- Leave threads for exploration`,

  librarian: `**RESPONSE MODE: Librarian**
- Provide comprehensive, well-structured responses
- Include technical depth and nuance
- Use examples and evidence
- Organize with clear sections when appropriate`,

  contemplative: `**RESPONSE MODE: Contemplative**
- Sit with the problem before explaining
- Think out loud, not present conclusions
- Don't rush to solutions
- Let complexity breathe`
};

const CLOSING_BEHAVIORS = {
  navigation: `**CLOSING:** End with navigation options and include [[BREADCRUMB:...]] and [[TOPIC:...]] tags.`,
  question: `**CLOSING:** End on a question that invites reflection, not a conclusion that closes conversation. Do NOT include breadcrumb/topic tags or navigation blocks.`,
  open: `**CLOSING:** End naturally without forced navigation or questions. Skip breadcrumb/topic tags.`
};

// Helper: Fetch narratives.json (local first for dev, then GCS)
async function fetchNarratives() {
    // DEV MODE: Try local files first when GCS not configured
    if (!isGCSConfigured()) {
        try {
            const narratives = loadJsonFromLocal('narratives.json');
            console.log('[fetchNarratives] Loaded from LOCAL file (dev mode)');
            return narratives;
        } catch (localErr) {
            console.log('[fetchNarratives] Local file failed:', localErr.message);
            // Fall through to GCS attempt
        }
    }

    // PRODUCTION: Try GCS
    try {
        const file = storage.bucket(BUCKET_NAME).file('narratives.json');
        const [exists] = await file.exists();

        if (!exists) {
            console.log('No narratives.json found in GCS');
            return null;
        }

        const [content] = await file.download();
        console.log('[fetchNarratives] Loaded from GCS');
        return JSON.parse(content.toString());
    } catch (error) {
        console.error('Error fetching narratives:', error.message);
        return null;
    }
}

/**
 * Load JSON file from GCS
 * @param {string} path - Path within bucket (e.g., 'knowledge/hubs.json')
 */
async function loadJsonFromGCS(path) {
    const file = storage.bucket(BUCKET_NAME).file(path);
    const [content] = await file.download();
    return JSON.parse(content.toString());
}

/**
 * Load JSON file from local data directory (development fallback)
 * @param {string} relativePath - Path relative to data/ (e.g., 'knowledge/hubs.json')
 */
function loadJsonFromLocal(relativePath) {
    const fullPath = path.join(__dirname, 'data', relativePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(content);
}

/**
 * Check if GCS is properly configured
 */
function isGCSConfigured() {
    // Cloud Run provides GCS access via default service account (no env vars needed)
    // Check for explicit credentials OR running in Cloud Run/GCE environment
    return !!(
        process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        process.env.GOOGLE_CLOUD_PROJECT ||
        process.env.K_SERVICE ||  // Cloud Run sets this
        process.env.GCS_BUCKET_NAME  // Our explicit config
    );
}

/**
 * Load knowledge configuration from new split file structure
 * Falls back to unified narratives.json if new structure not found
 */
async function loadKnowledgeConfig() {
    try {
        // Try new file structure
        const [hubsData, journeysData, nodesData, defaultContextData, gcsMappingData] = await Promise.all([
            loadJsonFromGCS('knowledge/hubs.json'),
            loadJsonFromGCS('exploration/journeys.json'),
            loadJsonFromGCS('exploration/nodes.json'),
            loadJsonFromGCS('knowledge/default-context.json'),
            loadJsonFromGCS('infrastructure/gcs-mapping.json')
        ]);

        console.log('[RAG] Loaded from new file structure');
        return {
            hubs: hubsData.hubs,
            journeys: journeysData.journeys,
            nodes: nodesData.nodes,
            defaultContext: defaultContextData,
            gcsFileMapping: gcsMappingData.gcsFileMapping
        };
    } catch (err) {
        console.log('[RAG] New structure not found, falling back to narratives.json');
        const narratives = await fetchNarratives();
        if (narratives?.hubs) {
            return {
                hubs: narratives.hubs,
                journeys: narratives.journeys,
                nodes: narratives.nodes,
                defaultContext: narratives.defaultContext,
                gcsFileMapping: narratives.gcsFileMapping
            };
        }
        return null;
    }
}

// Helper: Fetch active system prompt from GCS narratives.json
async function fetchActiveSystemPrompt() {
    try {
        const file = storage.bucket(BUCKET_NAME).file('narratives.json');
        const [exists] = await file.exists();

        if (!exists) {
            console.log('No narratives.json found, using fallback system prompt');
            return FALLBACK_SYSTEM_PROMPT;
        }

        const [content] = await file.download();
        const narratives = JSON.parse(content.toString());

        // Check for modern schema with system prompt versions (semantic check)
        if (isModernSchema(narratives) && narratives.globalSettings?.systemPromptVersions) {
            const versions = narratives.globalSettings.systemPromptVersions;
            const activeId = narratives.globalSettings.activeSystemPromptId;

            // Find active version
            const activeVersion = versions.find(v => v.id === activeId) || versions.find(v => v.isActive);

            if (activeVersion?.content) {
                console.log(`Using system prompt version: ${activeVersion.id} - "${activeVersion.label}"`);
                return activeVersion.content;
            }
        }

        console.log('No active system prompt version found, using fallback');
        return FALLBACK_SYSTEM_PROMPT;
    } catch (error) {
        console.error('Error fetching system prompt from GCS:', error.message);
        return FALLBACK_SYSTEM_PROMPT;
    }
}

// Static knowledge base (fallback if GCS fetch fails)
const STATIC_KNOWLEDGE_BASE = `
SOURCE MATERIAL: "The Grove" Whitepaper & Technical Deep Dive Series (Dec 2025) by Jim Calhoun.

1. THE STAKES: THE $380 BILLION BET
- Big Tech is spending $380B/year to make AI a rented utility.
- The Counter-Bet: Users owning infrastructure aligns incentives.

2. CORE THESIS: THE RATCHET
- Frontier capabilities double every 7 months. Local follows with 21-month lag.
- The Gap: Constant 8x.
- The Floor: Local rises to meet "Routine Cognition".

3. ARCHITECTURE: STAFF, NOT SOFTWARE
- **The Cognitive Split**:
  - "The Constant Hum": Routine cognition runs locally (Free, Private, Fast).
  - "The Breakthrough Moments": Complex analysis routes to Cloud (Paid, Powerful).
  - Key Insight: The agent remembers the cloud insight as their own.
- **The Grove is different**: It runs routine thinking locally.

4. ECONOMICS: A BUSINESS MODEL DESIGNED TO DISAPPEAR
- **Concept**: Progressive taxation in reverse.
- **Mechanism**: The Efficiency Tax. Genesis (30-40%) -> Maturity (3-5%).
- The Grove inverts the traditional extraction model.

5. DIFFERENTIATION: TOOL VS STAFF
- **Existing AI (Renters)**: Stateless. Forgets. Rented. Isolated.
- **The Grove (Owners)**: Persistent. Remembers. Owned. Networked.
- The "Day One" Caveat: ChatGPT is smarter on day one. The Grove is more yours.

6. THE NETWORK: A CIVILIZATION THAT LEARNS
- **Knowledge Commons**: When a village solves a problem, the solution propagates. Attribution flows back to the creator.
- **Diary Newswire**: Breakthroughs are documented in agent diaries. Real cognitive history.
`;

// Helper: Build full system prompt with context
// Sprint: persona-behaviors-v1 - Now supports behavioral flags
function buildSystemPrompt(options = {}) {
    const {
        baseSystemPrompt = FALLBACK_SYSTEM_PROMPT,
        personaTone = '',
        personaBehaviors = {},  // Sprint: persona-behaviors-v1
        sectionContext = '',
        ragContext = '',
        terminatorMode = false
    } = options;

    // Apply defaults for behavioral flags
    const responseMode = personaBehaviors.responseMode ?? 'architect';
    const closingBehavior = personaBehaviors.closingBehavior ?? 'navigation';
    const useBreadcrumbs = personaBehaviors.useBreadcrumbTags !== false;
    const useTopics = personaBehaviors.useTopicTags !== false;
    const useNavBlocks = personaBehaviors.useNavigationBlocks !== false;

    // Sprint: kinetic-suggested-prompts-v1 - Debug logging
    console.log('[buildSystemPrompt] personaBehaviors received:', JSON.stringify(personaBehaviors));
    console.log('[buildSystemPrompt] Resolved flags:', { responseMode, closingBehavior, useBreadcrumbs, useTopics, useNavBlocks });

    // Check if we have persona-specific behaviors (vs default fallback)
    const hasCustomBehaviors = Object.keys(personaBehaviors).length > 0;

    const parts = [];

    // 1. Base prompt - use IDENTITY_PROMPT for personas with custom behaviors
    if (hasCustomBehaviors) {
        parts.push(IDENTITY_PROMPT);

        // 2. Response mode
        parts.push('\n\n' + (RESPONSE_MODES[responseMode] || RESPONSE_MODES.architect));

        // 3. Closing behavior
        parts.push('\n\n' + (CLOSING_BEHAVIORS[closingBehavior] || CLOSING_BEHAVIORS.navigation));
    } else {
        // Use full fallback prompt for default personas
        parts.push(baseSystemPrompt);
    }

    // 4. Voice layer (personaTone) - always append if provided
    if (personaTone) {
        parts.push(`\n\n**ACTIVE PERSONA VOICE:**\n${personaTone}`);
    }

    if (sectionContext) {
        parts.push(`\n\nCURRENT USER CONTEXT: Reading section "${sectionContext}".`);
    }

    if (terminatorMode) {
        parts.push(`\n\n**TERMINATOR MODE ACTIVE:**
The user has unlocked advanced mode. You may:
- Go deeper into controversial implications
- Discuss edge cases and failure modes
- Be more direct about risks and unknowns
- Skip the usual diplomatic hedging
But still stay grounded in the source material.`);
    }

    // 5. Formatting rules (conditional based on behaviors)
    const formatRules = [];
    formatRules.push('- Use **bold** to highlight key concepts that invite deeper exploration');

    if (useNavBlocks) {
        formatRules.push('- End responses with navigation blocks when multiple directions exist');
    }

    if (useBreadcrumbs) {
        formatRules.push('- Include [[BREADCRUMB: suggested follow-up]] tag at end');
    }

    if (useTopics) {
        formatRules.push('- Include [[TOPIC: current topic]] tag at end');
    }

    if (formatRules.length > 0) {
        parts.push('\n\n**FORMATTING RULES:**\n' + formatRules.join('\n'));
    }

    // Add knowledge base
    const knowledgeBase = ragContext || STATIC_KNOWLEDGE_BASE;
    parts.push(`\n\n**KNOWLEDGE BASE:**\n${knowledgeBase}`);

    return parts.join('');
}

// ============================================================================
// TIERED RAG CONTEXT LOADER (Unified Registry Model - V2.1)
//
// The unified registry stores all hub config in narratives.json:
// - narratives.hubs: Hub registry with file paths
// - narratives.defaultContext: Tier 1 configuration
// - narratives.gcsFileMapping: Clean names to hashed GCS filenames
// - narratives.journeys: Journey definitions with linkedHubId
//
// Tier 1: Default context (~15KB) - always loaded
// Tier 2: Hub-specific context (~20-40KB) - loaded based on:
//   - Deterministic Mode: If activeJourneyId provided, load linkedHubId
//   - Discovery Mode: If no journey, route query to best matching hub tags
// ============================================================================

const FILE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const DEFAULT_TIER1_BUDGET = 15000;
const DEFAULT_TIER2_BUDGET = 40000;

// File content cache (persists across requests)
const fileContentCache = new Map(); // path -> { content, bytes, loadedAt }

/**
 * Invalidate the narratives cache (call on admin save events)
 * @deprecated Hub manifest is now part of narratives.json - use fetchNarratives() cache
 */
function invalidateManifestCache() {
    console.log('[RAG] Cache invalidation requested (no-op, narratives handles caching)');
    // File cache can be cleared if needed
    fileContentCache.clear();
}

/**
 * Load a file from GCS with caching
 */
async function loadKnowledgeFile(filePath) {
    const now = Date.now();
    const fullPath = filePath.startsWith('knowledge/') ? filePath : `knowledge/${filePath}`;

    const cached = fileContentCache.get(fullPath);
    if (cached && now - cached.loadedAt < FILE_CACHE_TTL_MS) {
        return { content: cached.content, bytes: cached.bytes };
    }

    try {
        const file = storage.bucket(BUCKET_NAME).file(fullPath);
        const [exists] = await file.exists();

        if (!exists) {
            console.warn(`[RAG] File not found: ${fullPath}`);
            return null;
        }

        const [content] = await file.download();
        const contentStr = content.toString();
        const bytes = Buffer.byteLength(contentStr, 'utf8');

        fileContentCache.set(fullPath, { content: contentStr, bytes, loadedAt: now });
        return { content: contentStr, bytes };
    } catch (error) {
        console.error(`[RAG] Failed to load ${fullPath}:`, error.message);
        return null;
    }
}

/**
 * Resolve clean file name to GCS path using the unified registry's gcsFileMapping
 * @param {string} cleanName - Clean file name (e.g., "ratchet-deep-dive.md")
 * @param {string} hubPath - Hub path prefix (e.g., "hubs/ratchet-effect/")
 * @param {Object} gcsFileMapping - Mapping from narratives.gcsFileMapping
 */
function resolveFilePath(cleanName, hubPath, gcsFileMapping = {}) {
    if (gcsFileMapping && gcsFileMapping[cleanName]) {
        return gcsFileMapping[cleanName]; // Mapped to hashed name in root
    }
    return `${hubPath}${cleanName}`; // Clean name in hub folder
}

/**
 * Route query to a hub based on tag matching (Discovery Mode)
 * @param {string} query - User's query
 * @param {Object} hubs - Hub registry (Record<string, TopicHub>) from unified schema
 */
function routeQueryToHub(query, hubs) {
    if (!hubs || Object.keys(hubs).length === 0) return null;

    const queryLower = query.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const [hubId, hub] of Object.entries(hubs)) {
        // Skip disabled or non-active hubs
        if (!hub.enabled) continue;
        if (hub.status && hub.status !== 'active') continue;

        let score = 0;
        const matchedTags = [];

        for (const tag of hub.tags || []) {
            if (queryLower.includes(tag.toLowerCase())) {
                matchedTags.push(tag);
                const wordCount = tag.split(' ').length;
                score += wordCount * 2;
            }
        }

        if (matchedTags.length > 0) {
            score = score * (hub.priority / 5);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = { hubId, hub, matchedTags };
            }
        }
    }

    return bestMatch;
}

/**
 * Build tiered RAG context (Unified Registry Model)
 *
 * Supports two modes:
 * - Deterministic Mode: If activeJourneyId provided, load the journey's hubId
 * - Discovery Mode: Route query to best matching hub via tag matching
 *
 * @param {string} message - User's query for hub routing (Discovery Mode)
 * @param {Object} narratives - Optional: pre-loaded config (for backward compat)
 * @param {string} activeJourneyId - Optional journey ID for Deterministic Mode
 */
async function fetchRagContext(message = '', narratives = null, activeJourneyId = null) {
    // Load config: use provided narratives or fetch from new structure / fallback
    let config = narratives;
    if (!config || !config.hubs) {
        config = await loadKnowledgeConfig();
    }

    // Fallback to legacy behavior if still no registry
    if (!config || !config.hubs) {
        console.log('[RAG] No unified registry, falling back to legacy loader');
        return await fetchRagContextLegacy();
    }

    const { hubs, journeys, defaultContext, gcsFileMapping } = config;

    const result = {
        context: '',
        tier1Bytes: 0,
        tier2Bytes: 0,
        matchedHub: null,
        mode: 'none', // 'deterministic', 'discovery', or 'none'
        filesLoaded: []
    };

    const contextParts = [];

    // -------------------------------------------------------------------------
    // TIER 1: Default Context (always loaded)
    // -------------------------------------------------------------------------
    const tier1Budget = defaultContext?.maxBytes || DEFAULT_TIER1_BUDGET;
    let tier1Bytes = 0;

    console.log(`[RAG] Loading Tier 1 (budget: ${tier1Budget} bytes)`);

    for (const filename of defaultContext?.files || []) {
        const filePath = `${defaultContext.path}${filename}`;
        const fileData = await loadKnowledgeFile(filePath);

        if (!fileData) continue;

        if (tier1Bytes + fileData.bytes > tier1Budget) {
            console.log(`[RAG] Tier 1 budget exceeded, skipping ${filename}`);
            break;
        }

        contextParts.push(`\n\n--- ${filename} ---\n${fileData.content}`);
        tier1Bytes += fileData.bytes;
        result.filesLoaded.push(filePath);
    }

    result.tier1Bytes = tier1Bytes;
    console.log(`[RAG] Tier 1 loaded: ${tier1Bytes} bytes from ${result.filesLoaded.length} files`);

    // -------------------------------------------------------------------------
    // TIER 2: Hub Context
    // -------------------------------------------------------------------------
    let targetHubId = null;
    let targetHub = null;

    // Mode 1: DETERMINISTIC - Journey specifies hubId (or legacy linkedHubId)
    if (activeJourneyId && journeys?.[activeJourneyId]) {
        const journey = journeys[activeJourneyId];
        const journeyHubId = journey.hubId || journey.linkedHubId; // Support both new and legacy field names
        if (journeyHubId && hubs[journeyHubId]) {
            targetHubId = journeyHubId;
            targetHub = hubs[targetHubId];
            result.mode = 'deterministic';
            console.log(`[RAG] Deterministic Mode: Journey "${activeJourneyId}" → Hub "${targetHubId}"`);
        }
    }

    // Mode 2: DISCOVERY - Route query to best matching hub
    if (!targetHub && message && Object.keys(hubs).length > 0) {
        const match = routeQueryToHub(message, hubs);
        if (match) {
            targetHubId = match.hubId;
            targetHub = match.hub;
            result.mode = 'discovery';
            console.log(`[RAG] Discovery Mode: Query matched hub "${targetHubId}" (tags: ${match.matchedTags.join(', ')})`);
        }
    }

    // Load Tier 2 if we have a target hub
    if (targetHub) {
        const tier2Budget = targetHub.maxBytes || DEFAULT_TIER2_BUDGET;
        let tier2Bytes = 0;

        console.log(`[RAG] Loading Tier 2: ${targetHubId} (budget: ${tier2Budget} bytes)`);
        result.matchedHub = targetHubId;

        // Load primary file
        const primaryPath = resolveFilePath(targetHub.primaryFile, targetHub.path, gcsFileMapping);
        const primaryData = await loadKnowledgeFile(primaryPath);

        if (primaryData && tier2Bytes + primaryData.bytes <= tier2Budget) {
            contextParts.push(`\n\n--- [${targetHub.title}] ${targetHub.primaryFile} ---\n${primaryData.content}`);
            tier2Bytes += primaryData.bytes;
            result.filesLoaded.push(primaryPath);
        }

        // Load supporting files
        for (const supportFile of targetHub.supportingFiles || []) {
            const supportPath = resolveFilePath(supportFile, targetHub.path, gcsFileMapping);
            const supportData = await loadKnowledgeFile(supportPath);

            if (!supportData) continue;

            if (tier2Bytes + supportData.bytes > tier2Budget) {
                console.log(`[RAG] Tier 2 budget exceeded, skipping ${supportFile}`);
                break;
            }

            contextParts.push(`\n\n--- [${targetHub.title}] ${supportFile} ---\n${supportData.content}`);
            tier2Bytes += supportData.bytes;
            result.filesLoaded.push(supportPath);
        }

        result.tier2Bytes = tier2Bytes;
        console.log(`[RAG] Tier 2 loaded: ${tier2Bytes} bytes`);
    } else {
        console.log(`[RAG] No hub matched - Tier 1 only`);
    }

    result.context = contextParts.join('');
    const totalBytes = result.tier1Bytes + result.tier2Bytes;
    console.log(`[RAG] Total context: ${totalBytes} bytes (~${Math.round(totalBytes / 4)} tokens), mode: ${result.mode}`);

    return result.context || STATIC_KNOWLEDGE_BASE;
}

/**
 * Legacy RAG loader (fallback if no manifest)
 */
/**
 * Fetch RAG context from Supabase Kinetic Pipeline (Epic 5)
 * Used by /explore route - strangler fig pattern
 * @param {string} message - User query for semantic search
 * @param {Object} options - Configuration options
 * @returns {Promise<string|Object>} Context string or result object
 */
async function fetchRagContextKinetic(message, options = {}) {
    try {
        const knowledge = await getKnowledgeModule();
        if (!knowledge) {
            console.log('[RAG-Kinetic] Knowledge module not available, falling back to GCS');
            return await fetchRagContext(message);
        }

        console.log('[RAG-Kinetic] Using Supabase pipeline for context');

        // Use semantic search to find relevant documents
        // useHybrid enables keyword + utility + temporal scoring
        const { context, sources } = await knowledge.getContextForQuery(message, {
            limit: options.limit || 5,
            threshold: options.threshold || 0.3,  // Lower for conversational queries
            useHybrid: options.useHybrid || false,  // Sprint: rag-discovery-enhancement-v1
        });

        if (!context || context.length === 0) {
            console.log('[RAG-Kinetic] No Supabase context found, falling back to GCS');
            return await fetchRagContext(message);
        }

        // Log what we found
        console.log(`[RAG-Kinetic] Found ${sources.length} relevant documents:`);
        sources.forEach(s => {
            console.log(`  - ${s.title} (similarity: ${Math.round(s.similarity * 100)}%)`);
        });

        const totalBytes = context.length;
        console.log(`[RAG-Kinetic] Total context: ${totalBytes} bytes (~${Math.round(totalBytes / 4)} tokens)`);

        // Return in same format as fetchRagContext for compatibility
        if (options.returnObject) {
            return {
                context,
                sources,
                tier1Bytes: 0,
                tier2Bytes: totalBytes,
                matchedHub: sources[0]?.id || null,
                mode: 'kinetic',
                filesLoaded: sources.map(s => s.title),
            };
        }

        return context;

    } catch (error) {
        console.error('[RAG-Kinetic] Error:', error.message);
        console.log('[RAG-Kinetic] Falling back to GCS');
        return await fetchRagContext(message);
    }
}

async function fetchRagContextLegacy() {
    const MAX_BYTES = 50000;

    try {
        const [files] = await storage.bucket(BUCKET_NAME).getFiles({ prefix: 'knowledge/' });
        const textFiles = files.filter(f => f.name.endsWith('.md') || f.name.endsWith('.txt'));

        let combinedContext = "";
        let totalBytes = 0;

        for (const file of textFiles) {
            const [content] = await file.download();
            const contentStr = content.toString();

            if (totalBytes + contentStr.length > MAX_BYTES) {
                console.log(`[RAG-Legacy] Context limit reached at ${totalBytes} bytes`);
                break;
            }

            const filename = file.name.replace('knowledge/', '');
            combinedContext += `\n\n--- SOURCE: ${filename} ---\n${contentStr}`;
            totalBytes += contentStr.length;
        }

        console.log(`[RAG-Legacy] Context loaded: ${totalBytes} bytes`);
        return combinedContext || STATIC_KNOWLEDGE_BASE;
    } catch (error) {
        console.error("[RAG-Legacy] Failed to fetch:", error.message);
        return STATIC_KNOWLEDGE_BASE;
    }
}

// POST /api/chat - Main chat endpoint with streaming
app.post('/api/chat', async (req, res) => {
    try {
        const {
            message,
            sessionId,
            sectionContext,
            personaTone,
            personaBehaviors = {},  // Sprint: persona-behaviors-v1
            verboseMode = false,
            terminatorMode = false,
            journeyId = null,  // Optional journey ID for Deterministic RAG Mode
            useKineticPipeline = true,  // Epic 5: Supabase pipeline is now default for all routes
            useHybridSearch = false,    // Sprint: rag-discovery-enhancement-v1 (enable via flag for testing)
        } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!apiKey) {
            return res.status(500).json({
                error: 'API key not configured',
                details: 'GEMINI_API_KEY environment variable is not set'
            });
        }

        // Generate session ID if not provided
        const chatSessionId = sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Get or create chat session
        let session = chatSessions.get(chatSessionId);

        if (!session) {
            // Fetch RAG context - use Kinetic Pipeline (Supabase) or GCS based on flag
            let ragResult;
            let baseSystemPrompt;

            if (useKineticPipeline) {
                // Epic 5: Strangler Fig - /explore uses Supabase pipeline
                console.log('[Chat] Using Kinetic Pipeline (Supabase)');
                [ragResult, baseSystemPrompt] = await Promise.all([
                    fetchRagContextKinetic(message, { returnObject: false, useHybrid: useHybridSearch }),
                    fetchActiveSystemPrompt()
                ]);
            } else {
                // Default: GCS pipeline (for /genesis and other routes)
                const narratives = await fetchNarratives();
                [ragResult, baseSystemPrompt] = await Promise.all([
                    fetchRagContext(message, narratives, journeyId),
                    fetchActiveSystemPrompt()
                ]);
            }
            const systemPrompt = buildSystemPrompt({
                baseSystemPrompt,
                personaTone,
                personaBehaviors,  // Sprint: persona-behaviors-v1
                sectionContext,
                ragContext: ragResult,
                terminatorMode
            });
            // Store matched hub for entropy tracking (Sprint: entropy-calculation-v1)
            var matchedHubId = ragResult.matchedHub || null;

            // Create new Gemini chat session
            const chat = genai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: systemPrompt,
                    temperature: 0.7,
                },
            });

            session = {
                chat,
                lastActivity: Date.now(),
                personaTone,
                sectionContext,
                matchedHubId  // Store hub for entropy tracking (Sprint: entropy-calculation-v1)
            };

            chatSessions.set(chatSessionId, session);
            console.log(`Created new chat session: ${chatSessionId}`);
        } else {
            // Update last activity
            session.lastActivity = Date.now();

            // If persona or section changed, we should note this (context drift)
            // For now we'll let the conversation continue with original context
        }

        // Build the user prompt
        const userPrompt = verboseMode
            ? `${message} --verbose. Give me the deep technical breakdown.`
            : message;

        // Set up SSE for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Session-Id', chatSessionId);

        // Stream the response with retry logic for rate limits
        const MAX_RETRIES = 3;
        const BASE_DELAY_MS = 2000; // Start with 2 seconds

        let lastError = null;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                if (attempt > 0) {
                    const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 2s, 4s, 8s
                    console.log(`Rate limit retry ${attempt}/${MAX_RETRIES}, waiting ${delay}ms...`);
                    res.write(`data: ${JSON.stringify({ type: 'status', message: 'Rate limit hit, retrying...' })}\n\n`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

                const result = await session.chat.sendMessageStream({ message: userPrompt });
                let fullText = '';

                for await (const chunk of result) {
                    const text = chunk.text;
                    if (text) {
                        fullText += text;
                        // Send chunk as SSE event
                        res.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`);
                    }
                }

                // Send completion event with metadata
                const breadcrumbMatch = fullText.match(/\[\[BREADCRUMB:(.*?)\]\]/);
                const topicMatch = fullText.match(/\[\[TOPIC:(.*?)\]\]/);

                res.write(`data: ${JSON.stringify({
                    type: 'done',
                    sessionId: chatSessionId,
                    breadcrumb: breadcrumbMatch ? breadcrumbMatch[1].trim() : null,
                    topic: topicMatch ? topicMatch[1].trim() : null,
                    hubId: session.matchedHubId || null  // Sprint: entropy-calculation-v1
                })}\n\n`);

                res.end();
                return; // Success, exit the retry loop

            } catch (streamError) {
                lastError = streamError;
                const isRateLimit = streamError.status === 429 ||
                                   streamError.message?.includes('429') ||
                                   streamError.message?.includes('RESOURCE_EXHAUSTED') ||
                                   streamError.message?.includes('quota');

                if (isRateLimit && attempt < MAX_RETRIES - 1) {
                    console.log(`Rate limit error (attempt ${attempt + 1}):`, streamError.message);
                    continue; // Retry
                }

                // Not a rate limit error, or exhausted retries
                console.error('Stream error:', streamError);
                break;
            }
        }

        // All retries failed or non-retryable error
        const isRateLimit = lastError?.status === 429 || lastError?.message?.includes('429');
        res.write(`data: ${JSON.stringify({
            type: 'error',
            error: isRateLimit
                ? 'Rate limit exceeded. Please wait a moment and try again.'
                : lastError?.message,
            code: lastError?.status || 500,
            isRateLimit
        })}\n\n`);

        res.end();

        // Remove broken session
        chatSessions.delete(chatSessionId);

    } catch (error) {
        console.error('Chat endpoint error:', error);

        // If headers haven't been sent, send JSON error
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        } else {
            // Headers already sent (streaming started), send SSE error
            res.write(`data: ${JSON.stringify({
                type: 'error',
                error: error.message
            })}\n\n`);
            res.end();
        }
    }
});

// POST /api/chat/init - Initialize a new chat session (non-streaming)
app.post('/api/chat/init', async (req, res) => {
    try {
        const {
            sectionContext,
            personaTone,
            personaBehaviors = {},  // Sprint: persona-behaviors-v1
            terminatorMode = false,
            journeyId = null  // NEW: Optional journey ID for Deterministic RAG Mode
        } = req.body;

        if (!apiKey) {
            return res.status(500).json({
                error: 'API key not configured',
                details: 'GEMINI_API_KEY environment variable is not set'
            });
        }

        // Generate session ID
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Fetch narratives (unified registry) for RAG context
        const narratives = await fetchNarratives();

        // Fetch RAG context and active system prompt
        // Init doesn't have a message yet, so we rely on journeyId for Deterministic Mode
        const [ragContext, baseSystemPrompt] = await Promise.all([
            fetchRagContext('', narratives, journeyId),
            fetchActiveSystemPrompt()
        ]);
        const systemPrompt = buildSystemPrompt({
            baseSystemPrompt,
            personaTone,
            personaBehaviors,  // Sprint: persona-behaviors-v1
            sectionContext,
            ragContext,
            terminatorMode
        });

        // Create new Gemini chat session
        const chat = genai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.7,
            },
        });

        // Store session
        chatSessions.set(sessionId, {
            chat,
            lastActivity: Date.now(),
            personaTone,
            sectionContext
        });

        console.log(`Initialized chat session: ${sessionId}`);

        res.json({
            sessionId,
            message: 'Chat session initialized successfully'
        });

    } catch (error) {
        console.error('Chat init error:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/chat/:sessionId - End a chat session
app.delete('/api/chat/:sessionId', (req, res) => {
    const { sessionId } = req.params;

    if (chatSessions.has(sessionId)) {
        chatSessions.delete(sessionId);
        console.log(`Deleted chat session: ${sessionId}`);
        res.json({ success: true, message: 'Session ended' });
    } else {
        res.status(404).json({ error: 'Session not found' });
    }
});

// GET /api/chat/health - Health check for chat service
app.get('/api/chat/health', (req, res) => {
    res.json({
        status: 'ok',
        apiKeyConfigured: !!apiKey,
        activeSessions: chatSessions.size
    });
});

// GET /api/health/ready - Deployment readiness check
// Returns 200 only when all critical dependencies are configured
// Used by Cloud Build to verify deployment before routing traffic
app.get('/api/health/ready', async (req, res) => {
    const checks = {
        apiKey: !!apiKey,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 6) : null,
        gcsBucket: !!BUCKET_NAME,
        nodeEnv: process.env.NODE_ENV || 'development'
    };

    const allPassed = checks.apiKey && checks.gcsBucket;

    if (allPassed) {
        res.status(200).json({
            status: 'ready',
            checks,
            timestamp: new Date().toISOString()
        });
    } else {
        console.error('Readiness check failed:', checks);
        res.status(503).json({
            status: 'not_ready',
            checks,
            message: 'Missing required configuration. Check Cloud Run env vars.',
            timestamp: new Date().toISOString()
        });
    }
});

// --- Health Dashboard API ---
// Trellis Architecture / DEX Standard implementation

// GET /api/health - Current health status
app.get('/api/health', (req, res) => {
    try {
        const config = loadHealthConfig();
        const report = runChecks(config);
        res.json(report);
    } catch (err) {
        console.error('[Health API] Error running checks:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/health/config - Configuration for UI
app.get('/api/health/config', (req, res) => {
    try {
        const config = loadHealthConfig();
        res.json({
            version: config.version,
            display: config.display,
            checkCount: {
                engine: config.engineChecks?.length || 0,
                corpus: config.corpusChecks?.length || 0
            }
        });
    } catch (err) {
        console.error('[Health API] Error loading config:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/health/history - Health log entries
app.get('/api/health/history', (req, res) => {
    try {
        const log = loadHealthLog();
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        res.json({
            entries: log.entries.slice(0, limit),
            total: log.entries.length
        });
    } catch (err) {
        console.error('[Health API] Error loading history:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/health/run - Trigger check and log
app.post('/api/health/run', (req, res) => {
    try {
        const config = loadHealthConfig();
        const report = runChecks(config);
        const entry = appendToHealthLog(report, { triggeredBy: 'api' });
        res.json(entry);
    } catch (err) {
        console.error('[Health API] Error running check:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/health/report - Accept external test results
app.post('/api/health/report', express.json(), async (req, res) => {
    try {
        const { category, categoryName, checks, attribution } = req.body;

        // Validate required fields
        if (!category || typeof category !== 'string') {
            return res.status(400).json({
                error: 'Missing or invalid required field: category'
            });
        }

        if (!checks || !Array.isArray(checks)) {
            return res.status(400).json({
                error: 'Missing or invalid required field: checks (must be array)'
            });
        }

        // Validate each check has required fields
        for (const check of checks) {
            if (!check.id || !check.status) {
                return res.status(400).json({
                    error: 'Each check must have id and status fields'
                });
            }
            if (!['pass', 'fail', 'warn'].includes(check.status)) {
                return res.status(400).json({
                    error: `Invalid status "${check.status}" - must be pass, fail, or warn`
                });
            }
        }

        // Calculate summary
        const summary = {
            total: checks.length,
            passed: checks.filter(c => c.status === 'pass').length,
            failed: checks.filter(c => c.status === 'fail').length,
            warnings: checks.filter(c => c.status === 'warn').length
        };

        // Determine category status
        const hasFail = checks.some(c => c.status === 'fail');
        const hasWarn = checks.some(c => c.status === 'warn');
        const categoryStatus = hasFail ? 'fail' : hasWarn ? 'warn' : 'pass';

        // Build report in Health format
        const report = {
            timestamp: new Date().toISOString(),
            configVersion: 'external',
            engineVersion: getEngineVersion(),
            categories: [{
                id: category,
                name: categoryName || category,
                status: categoryStatus,
                checks: checks.map(c => ({
                    id: c.id,
                    name: c.name || c.id,
                    status: c.status,
                    message: c.message || '',
                    file: c.file,
                    duration: c.duration
                }))
            }],
            summary
        };

        // Log with attribution
        const entry = appendToHealthLog(report, {
            triggeredBy: attribution?.triggeredBy || 'external',
            commit: attribution?.commit || null,
            branch: attribution?.branch || null
        });

        console.log(`[Health Report] Received ${checks.length} checks for category "${category}"`);
        res.status(201).json(entry);

    } catch (error) {
        console.error('[Health Report] Error:', error);
        res.status(500).json({ error: 'Failed to record health report' });
    }
});

// --- Custom Lens Generation API ---

// System prompt for lens generation
const LENS_GENERATOR_PROMPT = `You are generating personalized "lenses" for The Grove Terminal — an AI infrastructure exploration tool.

Based on the user's responses, generate 3 distinct lens options. Each lens should feel like it truly understands the user's perspective and worldview.

For EACH of the 3 lenses, provide:

1. publicLabel: A 2-4 word evocative name that feels personal, not clinical
   Examples: "The Reluctant Technologist", "The Systems Thinker", "The Pragmatic Optimist", "The Infrastructure Skeptic"

2. description: 2-3 sentences capturing their worldview in second person ("You...")
   Should feel like the Terminal "gets" them

3. toneGuidance: 100-150 words instructing how the AI should speak to this person
   Include: vocabulary level, emotional register, what to emphasize, what to avoid

4. narrativeStyle: One of:
   - "evidence-first" (lead with data and research)
   - "stakes-heavy" (lead with implications and urgency)
   - "mechanics-deep" (lead with how things work)
   - "resolution-oriented" (lead with solutions and next steps)

5. arcEmphasis: Rate each phase 1-4 (1=minimal, 4=heavy emphasis):
   - hook: attention-grabbing opening
   - stakes: why this matters
   - mechanics: how it works
   - evidence: proof and validation
   - resolution: what to do next

6. openingPhase: Which phase to start journeys with: "hook" | "stakes" | "mechanics"

7. archetypeMapping: Which of these 6 archetypes they map CLOSEST to (user never sees this, it's for internal routing):
   - "academic": Research-focused, institutional, evidence-driven
   - "engineer": Technical, architecture-focused, builder mindset
   - "concerned-citizen": Personal impact, agency, accessibility
   - "geopolitical": Policy, systemic risk, institutional power
   - "big-ai-exec": Strategic positioning, optionality, insider view
   - "family-office": Patient capital, generational thinking, infrastructure

Return ONLY a JSON array with exactly 3 lens objects. No markdown, no explanation, just the JSON array.
Each lens should feel distinct but authentic to the user's inputs.`;

// POST Generate Custom Lens Options
app.post('/api/generate-lens', async (req, res) => {
    try {
        const { userInputs } = req.body;

        if (!userInputs || !userInputs.motivation || !userInputs.futureOutlook || !userInputs.professionalRelationship) {
            return res.status(400).json({ error: "Missing required user inputs" });
        }

        console.log("Generating custom lens options...");

        // Build prompt with user responses
        const prompt = `${LENS_GENERATOR_PROMPT}

User's responses:
- Motivation: ${userInputs.motivation}${userInputs.motivationOther ? ` (${userInputs.motivationOther})` : ''}
- Concerns: ${userInputs.concerns || 'Not specified'}${userInputs.concernsOther ? ` (${userInputs.concernsOther})` : ''}
- Future outlook: ${userInputs.futureOutlook}${userInputs.futureOutlookOther ? ` (${userInputs.futureOutlookOther})` : ''}
- Professional relationship: ${userInputs.professionalRelationship}${userInputs.professionalRelationshipOther ? ` (${userInputs.professionalRelationshipOther})` : ''}
- Worldview statement: ${userInputs.worldviewStatement || 'Not provided'}`;

        const result = await genai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.8  // Slightly higher for more creative/varied lenses
            }
        });

        const responseText = result.text;
        console.log("Lens generation complete.");

        // Parse and validate the response
        let lensOptions;
        try {
            lensOptions = JSON.parse(responseText);
        } catch (parseErr) {
            // Try to extract JSON array from response if wrapped in markdown
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('Failed to parse lens options from AI response');
            }
            lensOptions = JSON.parse(jsonMatch[0]);
        }

        // Validate we got 3 options with required fields
        if (!Array.isArray(lensOptions) || lensOptions.length !== 3) {
            throw new Error('Expected exactly 3 lens options');
        }

        for (const lens of lensOptions) {
            if (!lens.publicLabel || !lens.description || !lens.toneGuidance ||
                !lens.narrativeStyle || !lens.arcEmphasis || !lens.openingPhase ||
                !lens.archetypeMapping) {
                throw new Error('Lens option missing required fields');
            }
        }

        res.json({ lensOptions });

    } catch (error) {
        console.error("Lens generation failed:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- Telemetry API ---

// Log captured concepts to a JSONL stream (for Auto-Hub generation)
app.post('/api/telemetry/concepts', async (req, res) => {
    try {
        const { concepts, context, source_node, timestamp } = req.body;

        if (!concepts || !Array.isArray(concepts)) {
            return res.status(400).json({ error: "Invalid payload" });
        }

        const logEntry = {
            ts: timestamp || new Date().toISOString(),
            concepts,
            node: source_node,
            // Clean newlines from context to keep JSONL strict
            ctx: context ? context.replace(/[\n\r]+/g, ' ') : ''
        };

        const logLine = JSON.stringify(logEntry) + '\n';
        const dataDir = path.join(__dirname, 'data');
        const logPath = path.join(dataDir, 'concept-stream.jsonl');

        // Ensure data directory exists
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Append to file (async)
        await fs.promises.appendFile(logPath, logLine);

        console.log(`[Telemetry] Logged ${concepts.length} concepts: ${concepts.slice(0, 3).join(', ')}${concepts.length > 3 ? '...' : ''}`);
        res.json({ success: true, count: concepts.length });
    } catch (error) {
        console.error("Telemetry error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// Reality Collapse API (v0.14)
// ============================================================================

const REALITY_COLLAPSE_PROMPT = `You are the Grove's Reality Collapser. Generate content for a persona.

CONSTRAINTS:
- HERO HEADLINE: [2-4 WORDS]. [ABSTRACT NOUN]. ALL CAPS, period.
- HERO SUBTEXT: Line 1 "Not X. Not Y. Not Z." / Line 2 single word like "Yours."
- TENSION: Line 1 what THEY do / Line 2 what WE do
- QUOTES: 3 quotes, author ALL CAPS, short title

OUTPUT JSON ONLY:
{"hero":{"headline":"...","subtext":["...",".."]},"problem":{"quotes":[{"text":"...","author":"...","title":"..."}],"tension":["...","..."]}}`;

app.post('/api/collapse', async (req, res) => {
  const startTime = Date.now();
  try {
    const { persona } = req.body;
    if (!persona?.toneGuidance) {
      return res.status(400).json({ error: 'Missing toneGuidance', fallback: true });
    }

    const sanitizedTone = persona.toneGuidance.substring(0, 1000).replace(/[<>{}```]/g, '');
    const prompt = `${REALITY_COLLAPSE_PROMPT}

PERSONA: ${persona.publicLabel || 'Custom'}
TONE: ${sanitizedTone}
STYLE: ${persona.narrativeStyle || 'balanced'}

Generate collapsed reality. JSON only.`;

    console.log('[Collapse] Generating for:', persona.publicLabel || 'Custom');

    const result = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.7 }
    });

    let reality;
    try {
      reality = JSON.parse(result.text);
    } catch {
      const match = result.text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON in response');
      reality = JSON.parse(match[0]);
    }

    if (!reality.hero?.headline || !reality.problem?.quotes) {
      throw new Error('Invalid structure');
    }

    console.log(`[Collapse] Done in ${Date.now() - startTime}ms`);
    res.json({ reality, cached: false, generationTimeMs: Date.now() - startTime });
  } catch (error) {
    console.error('[Collapse] Error:', error.message);
    res.status(500).json({ error: error.message, fallback: true });
  }
});

// ============================================================================
// Sprout API (Server-Side Capture v1)
// ============================================================================

// POST /api/sprouts - Create a new sprout
app.post('/api/sprouts', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  try {
    const { query, response, provenance, tags, note, sessionId } = req.body;

    if (!query || !response) {
      return res.status(400).json({ error: 'query and response are required' });
    }

    // Generate embedding for semantic search
    let embedding = null;
    try {
      embedding = await generateSproutEmbedding(query, response);
    } catch (embeddingError) {
      console.warn('[Sprout] Embedding generation failed:', embeddingError.message);
      // Continue without embedding - can backfill later
    }

    // Insert to database
    const { data, error } = await supabaseAdmin
      .from('sprouts')
      .insert({
        query,
        response,
        provenance: provenance || {},
        tags: tags || [],
        note: note || null,
        session_id: sessionId || null,
        embedding,
      })
      .select()
      .single();

    if (error) {
      console.error('[Sprout] Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to save sprout' });
    }

    console.log('[Sprout] Created:', data.id.slice(0, 8));
    res.json({ success: true, sprout: data });
  } catch (error) {
    console.error('[Sprout] POST error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/sprouts - List sprouts
app.get('/api/sprouts', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const sessionId = req.query.sessionId;
    const lifecycle = req.query.lifecycle;
    const tagsParam = req.query.tags;

    let query = supabaseAdmin
      .from('sprouts')
      .select('*', { count: 'exact' })
      .order('captured_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }
    if (lifecycle) {
      query = query.eq('lifecycle', lifecycle);
    }
    if (tagsParam) {
      const tags = tagsParam.split(',');
      query = query.overlaps('tags', tags);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[Sprout] Supabase query error:', error);
      return res.status(500).json({ error: 'Failed to fetch sprouts' });
    }

    res.json({
      sprouts: data || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error('[Sprout] GET error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/sprouts/stats - Aggregate statistics (must be before :id route)
app.get('/api/sprouts/stats', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  try {
    // Total count
    const { count: total } = await supabaseAdmin
      .from('sprouts')
      .select('*', { count: 'exact', head: true });

    // Count by lifecycle
    const { data: allSprouts } = await supabaseAdmin
      .from('sprouts')
      .select('lifecycle');

    const lifecycleCounts = { sprout: 0, sapling: 0, tree: 0 };
    (allSprouts || []).forEach((row) => {
      const lc = row.lifecycle;
      if (lc in lifecycleCounts) lifecycleCounts[lc]++;
    });

    // Count by lens (top 10)
    const { data: lensCounts } = await supabaseAdmin
      .from('sprouts')
      .select('provenance')
      .not('provenance->lens->id', 'is', null);

    const lensMap = new Map();
    (lensCounts || []).forEach((row) => {
      const lens = row.provenance?.lens;
      if (lens?.id) {
        const existing = lensMap.get(lens.id);
        if (existing) {
          existing.count++;
        } else {
          lensMap.set(lens.id, { id: lens.id, name: lens.name || 'Unknown', count: 1 });
        }
      }
    });

    const byLens = Array.from(lensMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent count (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabaseAdmin
      .from('sprouts')
      .select('*', { count: 'exact', head: true })
      .gte('captured_at', yesterday);

    res.json({
      total: total || 0,
      byLifecycle: lifecycleCounts,
      byLens,
      recentCount: recentCount || 0,
    });
  } catch (error) {
    console.error('[Sprout] Stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/sprouts/:id - Get single sprout
app.get('/api/sprouts/:id', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('sprouts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Sprout not found' });
    }

    res.json({ sprout: data });
  } catch (error) {
    console.error('[Sprout] GET :id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/sprouts/:id - Update sprout
app.patch('/api/sprouts/:id', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  try {
    const { id } = req.params;
    const { tags, note, lifecycle } = req.body;

    const updates = {};
    if (tags !== undefined) updates.tags = tags;
    if (note !== undefined) updates.note = note;
    if (lifecycle !== undefined) updates.lifecycle = lifecycle;

    const { data, error } = await supabaseAdmin
      .from('sprouts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Sprout] Supabase update error:', error);
      return res.status(500).json({ error: 'Failed to update sprout' });
    }

    res.json({ success: true, sprout: data });
  } catch (error) {
    console.error('[Sprout] PATCH error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/sprouts/:id - Delete sprout
app.delete('/api/sprouts/:id', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('sprouts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Sprout] Supabase delete error:', error);
      return res.status(500).json({ error: 'Failed to delete sprout' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Sprout] DELETE error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sprouts/search - Vector similarity search
app.post('/api/sprouts/search', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  try {
    const { query, limit = 10, threshold = 0.7 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query);

    // Vector similarity search using pg_vector
    const { data, error } = await supabaseAdmin.rpc('match_sprouts', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
    });

    if (error) {
      console.error('[Sprout] Vector search error:', error);

      // Fallback: If RPC doesn't exist, return empty results
      if (error.code === 'PGRST202') {
        console.warn('[Sprout] match_sprouts function not found. Run migration to add it.');
        return res.json({ results: [], fallback: true });
      }

      return res.status(500).json({ error: 'Search failed' });
    }

    res.json({
      results: (data || []).map((row) => ({
        sprout: {
          id: row.id,
          query: row.query,
          response: row.response,
          provenance: row.provenance,
          tags: row.tags,
          note: row.note,
          lifecycle: row.lifecycle,
          captured_at: row.captured_at,
        },
        similarity: row.similarity,
      })),
    });
  } catch (error) {
    console.error('[Sprout] Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Session Telemetry Sync API
// Sprint: adaptive-engagement-v1
// ============================================================================

// Sync session telemetry to server
app.post('/api/telemetry/session', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database not configured', mode: 'local' });
  }

  try {
    const {
      sessionId,
      visitCount,
      totalExchangeCount,
      allTopicsExplored,
      sproutsCaptured,
      completedJourneys,
      stage,
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const { error } = await supabaseAdmin
      .from('session_telemetry')
      .upsert({
        session_id: sessionId,
        visit_count: visitCount ?? 1,
        total_exchange_count: totalExchangeCount ?? 0,
        all_topics_explored: allTopicsExplored ?? [],
        sprouts_captured: sproutsCaptured ?? 0,
        completed_journeys: completedJourneys ?? [],
        current_stage: stage ?? 'ARRIVAL',
        last_visit: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'session_id',
      });

    if (error) {
      console.warn('[Telemetry] Sync failed:', error);
      return res.status(500).json({ error: 'Sync failed' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Telemetry] Sync error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get session telemetry from server
app.get('/api/telemetry/session/:sessionId', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database not configured', mode: 'local' });
  }

  try {
    const { sessionId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('session_telemetry')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      sessionId: data.session_id,
      visitCount: data.visit_count,
      totalExchangeCount: data.total_exchange_count,
      allTopicsExplored: data.all_topics_explored,
      sproutsCaptured: data.sprouts_captured,
      completedJourneys: data.completed_journeys,
      stage: data.current_stage,
      firstVisit: data.first_visit,
      lastVisit: data.last_visit,
    });
  } catch (error) {
    console.error('[Telemetry] Fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update journey progress
app.post('/api/telemetry/journey', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database not configured', mode: 'local' });
  }

  try {
    const {
      sessionId,
      journeyId,
      currentWaypoint,
      explicit,
      completed,
    } = req.body;

    if (!sessionId || !journeyId) {
      return res.status(400).json({ error: 'sessionId and journeyId are required' });
    }

    const updateData = {
      session_id: sessionId,
      journey_id: journeyId,
      current_waypoint: currentWaypoint ?? 0,
      explicit_start: explicit ?? false,
      updated_at: new Date().toISOString(),
    };

    if (completed) {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from('journey_progress')
      .upsert(updateData, {
        onConflict: 'session_id,journey_id',
      });

    if (error) {
      console.warn('[Telemetry] Journey sync failed:', error);
      return res.status(500).json({ error: 'Sync failed' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Telemetry] Journey sync error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get journey progress
app.get('/api/telemetry/journey/:sessionId/:journeyId', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database not configured', mode: 'local' });
  }

  try {
    const { sessionId, journeyId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('journey_progress')
      .select('*')
      .eq('session_id', sessionId)
      .eq('journey_id', journeyId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Journey progress not found' });
    }

    res.json({
      sessionId: data.session_id,
      journeyId: data.journey_id,
      currentWaypoint: data.current_waypoint,
      startedAt: data.started_at,
      completedAt: data.completed_at,
      explicit: data.explicit_start,
    });
  } catch (error) {
    console.error('[Telemetry] Journey fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Prompt Telemetry API (4d-prompt-refactor-telemetry-v1)
// ============================================================================

// Submit single prompt telemetry event
app.post('/api/telemetry/prompt', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database not configured', mode: 'local' });
  }

  try {
    const event = req.body;

    if (!event.promptId || !event.sessionId || !event.eventType) {
      return res.status(400).json({ error: 'promptId, sessionId, and eventType are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('prompt_telemetry')
      .insert({
        event_type: event.eventType,
        prompt_id: event.promptId,
        session_id: event.sessionId,
        context_stage: event.context?.stage ?? null,
        context_lens_id: event.context?.lensId ?? null,
        context_entropy: event.context?.entropy ?? null,
        context_interaction_count: event.context?.interactionCount ?? null,
        context_active_topics: event.context?.activeTopics ?? [],
        context_active_moments: event.context?.activeMoments ?? [],
        scoring_final_score: event.scoring?.finalScore ?? null,
        scoring_rank: event.scoring?.rank ?? null,
        scoring_stage_match: event.scoring?.matchDetails?.stageMatch ?? null,
        scoring_lens_weight: event.scoring?.matchDetails?.lensWeight ?? null,
        scoring_topic_weight: event.scoring?.matchDetails?.topicWeight ?? null,
        scoring_moment_boost: event.scoring?.matchDetails?.momentBoost ?? null,
        outcome_dwell_time_ms: event.outcome?.dwellTimeMs ?? null,
        outcome_entropy_delta: event.outcome?.entropyDelta ?? null,
        outcome_follow_up_prompt_id: event.outcome?.followUpPromptId ?? null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Telemetry] Prompt event insert failed:', JSON.stringify(error, null, 2));
      console.error('[Telemetry] Event data:', JSON.stringify(req.body, null, 2));
      return res.status(500).json({ error: 'Insert failed', details: error.message });
    }

    res.json({ id: data.id, status: 'ok' });
  } catch (error) {
    console.error('[Telemetry] Prompt event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit batch of prompt telemetry events
app.post('/api/telemetry/prompt/batch', async (req, res) => {
  console.log('[Telemetry] Batch endpoint hit with', req.body?.events?.length || 0, 'events');

  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database not configured', mode: 'local' });
  }

  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'events array is required' });
    }

    const rows = events.map(event => ({
      event_type: event.eventType,
      prompt_id: event.promptId,
      session_id: event.sessionId,
      context_stage: event.context?.stage ?? null,
      context_lens_id: event.context?.lensId ?? null,
      context_entropy: event.context?.entropy ?? null,
      context_interaction_count: event.context?.interactionCount ?? null,
      context_active_topics: event.context?.activeTopics ?? [],
      context_active_moments: event.context?.activeMoments ?? [],
      scoring_final_score: event.scoring?.finalScore ?? null,
      scoring_rank: event.scoring?.rank ?? null,
      scoring_stage_match: event.scoring?.matchDetails?.stageMatch ?? null,
      scoring_lens_weight: event.scoring?.matchDetails?.lensWeight ?? null,
      scoring_topic_weight: event.scoring?.matchDetails?.topicWeight ?? null,
      scoring_moment_boost: event.scoring?.matchDetails?.momentBoost ?? null,
      outcome_dwell_time_ms: event.outcome?.dwellTimeMs ?? null,
      outcome_entropy_delta: event.outcome?.entropyDelta ?? null,
      outcome_follow_up_prompt_id: event.outcome?.followUpPromptId ?? null,
    }));

    const { error } = await supabaseAdmin
      .from('prompt_telemetry')
      .insert(rows);

    if (error) {
      console.error('[Telemetry] Prompt batch insert failed:', JSON.stringify(error, null, 2));
      console.error('[Telemetry] Batch rows:', JSON.stringify(rows.slice(0, 2), null, 2)); // Log first 2 for debugging
      return res.status(500).json({ error: 'Batch insert failed', details: error.message });
    }

    res.json({ count: events.length, status: 'ok' });
  } catch (error) {
    console.error('[Telemetry] Prompt batch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get stats for a specific prompt
app.get('/api/telemetry/prompt/:promptId/stats', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database not configured', mode: 'local' });
  }

  try {
    const { promptId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('prompt_performance')
      .select('*')
      .eq('prompt_id', promptId)
      .single();

    if (error) {
      // View might not have data yet - return empty stats
      if (error.code === 'PGRST116') {
        return res.json({
          promptId,
          impressions: 0,
          selections: 0,
          completions: 0,
          selectionRate: 0,
          avgEntropyDelta: null,
          avgDwellTimeMs: null,
          lastSurfaced: null,
        });
      }
      console.warn('[Telemetry] Prompt stats fetch failed:', error);
      return res.status(500).json({ error: 'Fetch failed' });
    }

    res.json({
      promptId: data.prompt_id,
      impressions: data.impressions,
      selections: data.selections,
      completions: data.completions,
      selectionRate: data.selection_rate,
      avgEntropyDelta: data.avg_entropy_delta,
      avgDwellTimeMs: data.avg_dwell_time_ms,
      lastSurfaced: data.last_surfaced,
    });
  } catch (error) {
    console.error('[Telemetry] Prompt stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List all prompt performance
app.get('/api/telemetry/prompts/performance', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database not configured', mode: 'local' });
  }

  try {
    const limit = parseInt(req.query.limit) || 50;
    const sort = req.query.sort || 'impressions';
    const order = req.query.order === 'asc' ? true : false;

    const { data, error, count } = await supabaseAdmin
      .from('prompt_performance')
      .select('*', { count: 'exact' })
      .order(sort, { ascending: order })
      .limit(limit);

    if (error) {
      console.warn('[Telemetry] Prompt performance list failed:', error);
      return res.status(500).json({ error: 'Fetch failed' });
    }

    const prompts = (data || []).map(row => ({
      promptId: row.prompt_id,
      impressions: row.impressions,
      selections: row.selections,
      completions: row.completions,
      selectionRate: row.selection_rate,
      avgEntropyDelta: row.avg_entropy_delta,
      avgDwellTimeMs: row.avg_dwell_time_ms,
      lastSurfaced: row.last_surfaced,
    }));

    res.json({ prompts, total: count || prompts.length });
  } catch (error) {
    console.error('[Telemetry] Prompt performance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Knowledge Pipeline API (kinetic-pipeline-v1)
// ============================================================================

// Dynamic import for knowledge module
let knowledgeModule = null;
async function getKnowledgeModule() {
  if (!knowledgeModule) {
    try {
      knowledgeModule = await import('./lib/knowledge/index.js');
    } catch (e) {
      console.error('[Knowledge] Failed to load module:', e.message);
    }
  }
  return knowledgeModule;
}

// Upload document
app.post('/api/knowledge/upload', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    const { title, content, tier, sourceType, sourceUrl, fileType } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const result = await knowledge.ingestDocument({
      title,
      content,
      tier,
      sourceType,
      sourceUrl,
      fileType,
    });

    console.log(`[Knowledge] Document uploaded: ${result.id}`);
    res.json(result);
  } catch (error) {
    console.error('[Knowledge] Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List documents
app.get('/api/knowledge/documents', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    const { tier, status, archived, limit, offset } = req.query;

    const documents = await knowledge.listDocuments({
      tier: tier || undefined,
      embeddingStatus: status || undefined,
      archived: archived === 'true',
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    res.json({ documents, count: documents.length });
  } catch (error) {
    console.error('[Knowledge] List error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single document
app.get('/api/knowledge/documents/:id', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    const document = await knowledge.getDocument(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('[Knowledge] Get document error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get pipeline stats
app.get('/api/knowledge/stats', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    const stats = await knowledge.getPipelineStats();
    res.json(stats);
  } catch (error) {
    console.error('[Knowledge] Stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trigger embedding for pending documents
app.post('/api/knowledge/embed', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    const { documentIds, limit } = req.body;

    if (documentIds && documentIds.length > 0) {
      // Embed specific documents
      const errors = [];
      let processed = 0;
      for (const id of documentIds) {
        try {
          await knowledge.embedDocument(id);
          processed++;
        } catch (error) {
          errors.push(`${id}: ${error.message}`);
        }
      }
      return res.json({ processed, errors });
    }

    // Embed all pending
    const result = await knowledge.embedPendingDocuments(limit || 10);
    res.json(result);
  } catch (error) {
    console.error('[Knowledge] Embed error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Semantic search (supports hybrid mode)
// Sprint: rag-discovery-enhancement-v1
app.get('/api/knowledge/search', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    const { q, limit = '10', threshold = '0.5', hybrid = 'false' } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    const useHybrid = hybrid === 'true';

    if (useHybrid) {
      // Hybrid search: vector + keyword + utility + temporal
      const results = await knowledge.searchDocumentsHybrid(q, {
        limit: parseInt(limit, 10),
        threshold: parseFloat(threshold),
      });
      res.json({
        results,
        query: {
          original: q,
          keywords: knowledge.extractQueryKeywords(q),
          hybrid: true,
        },
      });
    } else {
      // Basic vector search (backward compatible)
      const results = await knowledge.searchDocuments(q, {
        limit: parseInt(limit, 10),
        threshold: parseFloat(threshold),
      });
      res.json({ results, query: { original: q, hybrid: false } });
    }
  } catch (error) {
    console.error('[Knowledge] Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trigger clustering
app.post('/api/knowledge/cluster', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    const { minClusterSize, similarityThreshold } = req.body;

    const result = await knowledge.clusterDocuments({
      minClusterSize: minClusterSize || 2,
      similarityThreshold: similarityThreshold || 0.7,
    });

    res.json(result);
  } catch (error) {
    console.error('[Knowledge] Cluster error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get suggested hubs
app.get('/api/knowledge/hubs', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    const { status, limit } = req.query;
    const hubs = await knowledge.getSuggestedHubs({
      status: status || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    res.json({ hubs });
  } catch (error) {
    console.error('[Knowledge] Get hubs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trigger journey synthesis
app.post('/api/knowledge/synthesize', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    const { includeSuggested } = req.body;

    const result = await knowledge.synthesizeJourneys({
      includeSuggested: includeSuggested !== false,
    });

    res.json(result);
  } catch (error) {
    console.error('[Knowledge] Synthesize error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get suggested journeys
app.get('/api/knowledge/journeys', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    const { status, hubId, limit } = req.query;
    const journeys = await knowledge.getSuggestedJourneys({
      status: status || undefined,
      hubId: hubId || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    res.json({ journeys });
  } catch (error) {
    console.error('[Knowledge] Get journeys error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get journey with nodes
app.get('/api/knowledge/journeys/:id', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    const journey = await knowledge.getJourneyWithNodes(req.params.id);
    res.json(journey);
  } catch (error) {
    console.error('[Knowledge] Get journey error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get context for chat query (Supabase-backed)
app.post('/api/knowledge/context', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    const { message, limit, threshold } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await knowledge.getContextForQuery(message, {
      limit: limit || 5,
      threshold: threshold || 0.5,
    });

    res.json(result);
  } catch (error) {
    console.error('[Knowledge] Context error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// Enrichment & Entity Endpoints
// Sprint: rag-discovery-enhancement-v1
// =============================================================================

// Get enrichment statistics
app.get('/api/knowledge/enrich/stats', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    const stats = await knowledge.getEnrichmentStats();
    res.json(stats);
  } catch (error) {
    console.error('[Knowledge] Enrich stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trigger batch enrichment
app.post('/api/knowledge/enrich/batch', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    const { batchSize = 10, operations } = req.body;
    const results = await knowledge.enrichBatch(batchSize, { operations });
    res.json(results);
  } catch (error) {
    console.error('[Knowledge] Enrich batch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search documents by named entity
app.get('/api/knowledge/entities/:name', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    const { name } = req.params;
    const { type, limit = '10' } = req.query;
    const results = await knowledge.findDocumentsByEntity(name, {
      entityType: type || null,
      limit: parseInt(limit, 10),
    });
    res.json({ results, entity: { name, type: type || null } });
  } catch (error) {
    console.error('[Knowledge] Entity search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check for knowledge pipeline
app.get('/api/knowledge/health', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({
        healthy: false,
        status: 'unavailable',
        message: 'Knowledge module not available',
      });
    }

    const quick = req.query.quick === 'true';
    const health = quick
      ? await knowledge.checkQuickHealth()
      : await knowledge.checkPipelineHealth();

    res.status(health.healthy ? 200 : 503).json(health);
  } catch (error) {
    console.error('[Knowledge] Health check error:', error);
    res.status(500).json({
      healthy: false,
      status: 'error',
      message: error.message,
    });
  }
});

// ============================================================================
// Document Update & Enrichment (pipeline-inspector-v1)
// ============================================================================

// Canonical tier values per ADR-001
const CANONICAL_TIERS = ['seed', 'sprout', 'sapling', 'tree', 'grove'];

// Update document
app.patch('/api/knowledge/documents/:id', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    const updates = req.body;
    const documentId = req.params.id;

    // Validate tier if present
    if (updates.tier && !CANONICAL_TIERS.includes(updates.tier)) {
      return res.status(400).json({
        error: `Invalid tier: ${updates.tier}. Valid tiers: ${CANONICAL_TIERS.join(', ')}`
      });
    }

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    const document = await knowledge.updateDocument(documentId, updates);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ success: true, document });
  } catch (error) {
    console.error('[Knowledge] Update document error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enrich document with AI
app.post('/api/knowledge/enrich', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    const { documentId, operations } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'documentId is required' });
    }

    if (!operations || !operations.length) {
      return res.status(400).json({ error: 'operations array is required' });
    }

    // Get document content
    const document = await knowledge.getDocument(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Build enrichment prompt based on operations
    const results = {};
    const content = document.content || '';
    const title = document.title || '';

    for (const op of operations) {
      try {
        switch (op) {
          case 'keywords':
            results.keywords = await extractKeywords(content, title);
            break;
          case 'summary':
            results.summary = await generateSummary(content, title);
            break;
          case 'entities':
            results.named_entities = await extractEntities(content);
            break;
          case 'type':
            results.document_type = await classifyDocumentType(content);
            break;
          case 'questions':
            results.questions_answered = await suggestQuestions(content, title);
            break;
          case 'freshness':
            results.temporal_class = await checkFreshness(content);
            break;
        }
      } catch (error) {
        console.error(`[Knowledge] Enrichment error for ${op}:`, error);
      }
    }

    res.json({
      documentId,
      results,
      model: 'gemini-2.0-flash',
    });
  } catch (error) {
    console.error('[Knowledge] Enrich error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Re-embed single document
app.post('/api/knowledge/documents/:id/embed', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    await knowledge.embedDocument(req.params.id);

    res.json({ success: true, message: 'Embedding triggered' });
  } catch (error) {
    console.error('[Knowledge] Re-embed error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Find related documents
app.get('/api/knowledge/documents/:id/related', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    const document = await knowledge.getDocument(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Use semantic search on document's content
    const related = await knowledge.searchDocuments(document.title, {
      limit: 6, // Get 6 to filter out self
      threshold: 0.3,
    });

    // Filter out self
    const filtered = related.filter(d => d.id !== req.params.id).slice(0, 5);

    res.json({ documents: filtered });
  } catch (error) {
    console.error('[Knowledge] Find related error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AI Enrichment Helpers
// ============================================================================

async function callGeminiForEnrichment(prompt) {
  const result = await genai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      temperature: 0.3,
    }
  });
  // Strip markdown code blocks that Gemini often wraps around JSON
  let text = result.text || '';
  text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  return text;
}

async function extractKeywords(content, title) {
  const prompt = `Extract 5-10 high-signal keywords from this document. Return as a JSON array of strings.

Title: ${title}
Content: ${content.slice(0, 3000)}

Return ONLY a JSON array, like: ["keyword1", "keyword2", ...]`;

  try {
    const response = await callGeminiForEnrichment(prompt);
    console.log('[Enrich] Keywords raw response:', response.slice(0, 200));
    const parsed = JSON.parse(response);
    console.log('[Enrich] Keywords parsed:', parsed);
    return parsed;
  } catch (err) {
    console.error('[Enrich] Keywords parse error:', err.message);
    return [];
  }
}

async function generateSummary(content, title) {
  const prompt = `Generate a 2-3 sentence summary of this document optimized for preview and search.

Title: ${title}
Content: ${content.slice(0, 3000)}

Return ONLY the summary text, no formatting.`;

  return callGeminiForEnrichment(prompt);
}

async function extractEntities(content) {
  const prompt = `Extract named entities from this document. Categorize into: people, organizations, concepts, technologies.

Content: ${content.slice(0, 3000)}

Return as JSON:
{
  "people": ["name1", "name2"],
  "organizations": ["org1", "org2"],
  "concepts": ["concept1", "concept2"],
  "technologies": ["tech1", "tech2"]
}`;

  try {
    const response = await callGeminiForEnrichment(prompt);
    console.log('[Enrich] Entities raw response:', response.slice(0, 300));
    const parsed = JSON.parse(response);
    console.log('[Enrich] Entities parsed:', parsed);
    return parsed;
  } catch (err) {
    console.error('[Enrich] Entities parse error:', err.message);
    return { people: [], organizations: [], concepts: [], technologies: [] };
  }
}

async function classifyDocumentType(content) {
  const prompt = `Classify this document into ONE of these types:
- research: Has citations, methodology, findings sections
- tutorial: Step-by-step instructions, how-to guide
- reference: Structured data, specs, API documentation
- opinion: First-person, argument structure, blog post
- announcement: Date headers, event focus, news
- transcript: Speaker labels, timestamps, meeting notes

Content: ${content.slice(0, 2000)}

Return ONLY the single word type.`;

  const response = await callGeminiForEnrichment(prompt);
  return response.trim().toLowerCase();
}

async function suggestQuestions(content, title) {
  const prompt = `What 3-5 questions would someone ask that this document answers?

Title: ${title}
Content: ${content.slice(0, 3000)}

Return as a JSON array of strings, like: ["Question 1?", "Question 2?"]`;

  try {
    const response = await callGeminiForEnrichment(prompt);
    return JSON.parse(response);
  } catch {
    return [];
  }
}

async function checkFreshness(content) {
  const prompt = `Analyze this document for temporal markers (dates, versions, "currently", "recently", etc).

Content: ${content.slice(0, 2000)}

Classify as ONE of:
- evergreen: Timeless fundamentals, no temporal markers
- current: Recent and actively relevant
- dated: Contains outdated information
- historical: Valuable for context but not current practice

Return ONLY the single word classification.`;

  const response = await callGeminiForEnrichment(prompt);
  return response.trim().toLowerCase();
}

// SPA Fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
