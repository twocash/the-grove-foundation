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
        color: 'violet',
        enabled: true,
        toneGuidance: '[PERSONA: Investor] Focus on investment thesis.',
        narrativeStyle: 'resolution-oriented',
        arcEmphasis: { hook: 2, stakes: 3, mechanics: 2, evidence: 3, resolution: 4 },
        openingPhase: 'stakes',
        defaultThreadLength: 4,
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
app.get('/api/narrative', async (req, res) => {
    try {
        const file = storage.bucket(BUCKET_NAME).file('narratives.json');
        const [exists] = await file.exists();

        if (!exists) {
            // Return empty modern schema for new installations
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

        // Auto-migrate legacy schema on read (doesn't save - client handles that)
        if (isLegacySchema(json)) {
            console.log("Migrating legacy schema to modern format...");
            const modernSchema = migrateV1ToV2(json);
            return res.json(modernSchema);
        }

        // Modern schema - return as-is
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

**MANDATORY FOOTER (BOTH MODES):**
At the very end of your response, strictly append these two tags:
[[BREADCRUMB: <The single most interesting follow-up question>]]
[[TOPIC: <A 2-3 word label for the current subject>]]
`;

// Helper: Fetch narratives.json from GCS (for topicHubs, personas, etc.)
async function fetchNarratives() {
    try {
        const file = storage.bucket(BUCKET_NAME).file('narratives.json');
        const [exists] = await file.exists();

        if (!exists) {
            console.log('No narratives.json found');
            return null;
        }

        const [content] = await file.download();
        return JSON.parse(content.toString());
    } catch (error) {
        console.error('Error fetching narratives:', error.message);
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
function buildSystemPrompt(options = {}) {
    const {
        baseSystemPrompt = FALLBACK_SYSTEM_PROMPT,
        personaTone = '',
        sectionContext = '',
        ragContext = '',
        terminatorMode = false
    } = options;

    const parts = [baseSystemPrompt];

    if (personaTone) {
        parts.push(`\n**ACTIVE PERSONA LENS:**\n${personaTone}`);
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

    // Always include formatting rules for clickable bold text
    parts.push(`\n\n**FORMATTING RULES:**
- Use **bold** to highlight key concepts and terms the user might want to explore
- Bold text is clickable - users can tap any **bolded phrase** to ask about it
- Aim for 2-4 bold phrases per response for natural exploration paths`);

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
 * - Deterministic Mode: If activeJourneyId provided, load the journey's linkedHubId
 * - Discovery Mode: Route query to best matching hub via tag matching
 *
 * @param {string} message - User's query for hub routing (Discovery Mode)
 * @param {Object} narratives - Full unified narratives.json schema (V2.1)
 * @param {string} activeJourneyId - Optional journey ID for Deterministic Mode
 */
async function fetchRagContext(message = '', narratives = null, activeJourneyId = null) {
    // Fallback to legacy behavior if no unified registry
    if (!narratives || !narratives.hubs) {
        console.log('[RAG] No unified registry, falling back to legacy loader');
        return await fetchRagContextLegacy();
    }

    const { hubs, journeys, defaultContext, gcsFileMapping } = narratives;

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

    // Mode 1: DETERMINISTIC - Journey specifies linkedHubId
    if (activeJourneyId && journeys?.[activeJourneyId]) {
        const journey = journeys[activeJourneyId];
        if (journey.linkedHubId && hubs[journey.linkedHubId]) {
            targetHubId = journey.linkedHubId;
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
            verboseMode = false,
            terminatorMode = false,
            journeyId = null  // NEW: Optional journey ID for Deterministic RAG Mode
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
            // Fetch narratives (unified registry with hubs, journeys, etc.)
            const narratives = await fetchNarratives();

            // Fetch RAG context using unified registry
            // - If journeyId provided: Deterministic Mode (load linkedHubId)
            // - Otherwise: Discovery Mode (route by query tags)
            const [ragContext, baseSystemPrompt] = await Promise.all([
                fetchRagContext(message, narratives, journeyId),
                fetchActiveSystemPrompt()
            ]);
            const systemPrompt = buildSystemPrompt({
                baseSystemPrompt,
                personaTone,
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

            session = {
                chat,
                lastActivity: Date.now(),
                personaTone,
                sectionContext
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
                    topic: topicMatch ? topicMatch[1].trim() : null
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

// SPA Fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
