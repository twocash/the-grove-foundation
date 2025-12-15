import express from 'express';
import path from 'path';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'grove-assets';

// Initialize Clients
const storage = new Storage();
const apiKey = process.env.GEMINI_API_KEY;
console.log('GEMINI_API_KEY configured:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');

// Explicitly set vertexai: false to ensure we use API key auth (Gemini API)
// rather than service account auth (Vertex AI) which requires different scopes
const genai = new GoogleGenAI({ apiKey, vertexai: false });

// Configure Multer (Memory Storage for immediate processing)
const upload = multer({ storage: multer.memoryStorage() });

// Middleware for JSON bodies
app.use(express.json());

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

const DEFAULT_GLOBAL_SETTINGS_V2 = {
    defaultToneGuidance: '',
    scholarModePromptAddition: 'Give me the deep technical breakdown.',
    noLensBehavior: 'nudge-after-exchanges',
    nudgeAfterExchanges: 3
};

// Helper: Check if schema is v1 format
function isV1Schema(data) {
    return data && data.version === "1.0" && typeof data.nodes === 'object';
}

// Helper: Check if schema is v2 format
function isV2Schema(data) {
    return data && data.version === "2.0" &&
           typeof data.personas === 'object' &&
           typeof data.cards === 'object' &&
           typeof data.globalSettings === 'object';
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
        version: "2.0",
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
            // Return empty v2 schema for new installations
            return res.json({
                version: "2.0",
                globalSettings: DEFAULT_GLOBAL_SETTINGS_V2,
                personas: DEFAULT_PERSONAS_V2,
                cards: {}
            });
        }

        const [content] = await file.download();
        const json = JSON.parse(content.toString());

        // Auto-migrate v1 to v2 on read (doesn't save - client handles that)
        if (isV1Schema(json)) {
            console.log("Migrating v1 narrative schema to v2 format...");
            const v2Schema = migrateV1ToV2(json);
            return res.json(v2Schema);
        }

        // Already v2 or unknown format - return as-is
        res.json(json);
    } catch (error) {
        console.error("Error reading narrative graph:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST (Save) Narrative Graph (supports both v1 and v2)
app.post('/api/admin/narrative', async (req, res) => {
    try {
        const graphData = req.body;

        // Validate based on version
        if (graphData.version === "2.0") {
            // V2 schema validation
            if (!graphData.personas || !graphData.cards || !graphData.globalSettings) {
                return res.status(400).json({
                    error: "Invalid v2 schema: 'personas', 'cards', and 'globalSettings' are required."
                });
            }
            console.log(`Saving v2 narrative schema. Cards: ${Object.keys(graphData.cards).length}, Personas: ${Object.keys(graphData.personas).length}`);
        } else if (graphData.version === "1.0" || graphData.nodes) {
            // V1 schema validation (backwards compatibility)
            if (!graphData.nodes) {
                return res.status(400).json({ error: "Invalid v1 schema: 'nodes' is required." });
            }
            console.log(`Saving v1 narrative schema. Nodes: ${Object.keys(graphData.nodes).length}`);
        } else {
            return res.status(400).json({ error: "Unknown schema version. Expected '1.0' or '2.0'." });
        }

        const file = storage.bucket(BUCKET_NAME).file('narratives.json');

        await file.save(JSON.stringify(graphData, null, 2), {
            contentType: 'application/json',
            metadata: {
                cacheControl: 'public, max-age=0, no-transform',
            }
        });

        res.json({ success: true, message: "Narrative graph updated" });
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

// SPA Fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
