import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Storage } from '@google-cloud/storage';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'grove-assets';

// Initialize Clients
const storage = new Storage();
const apiKey = process.env.GEMINI_API_KEY;
const genai = new GoogleGenAI({ apiKey });

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
            // Assuming public access or constructing public URL
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
            // Return default empty structure if strictly new
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
        const manifestData = req.body; // Express.json() middleware handles this

        // Validation: Ensure it looks like a manifest
        if (!manifestData.tracks || !manifestData.placements) {
            return res.status(400).json({ error: "Invalid manifest structure" });
        }

        const file = storage.bucket(BUCKET_NAME).file('manifest.json');

        await file.save(JSON.stringify(manifestData, null, 2), {
            contentType: 'application/json',
            metadata: {
                cacheControl: 'public, max-age=0, no-transform', // Important: Disable caching for the manifest so updates are instant
            }
        });

        res.json({ success: true, message: "Manifest updated" });
    } catch (error) {
        console.error("Error saving manifest:", error);
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
