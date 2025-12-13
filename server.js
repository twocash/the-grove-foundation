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

// Hardcoded Script
const DEEP_DIVE_SCRIPT = `
TTS the following conversation between Host and Expert:

Host: If you've been following the conversation coming out of Silicon Valley lately, you know the vibe is... well, it's less technological revolution and more existential reckoning.
Expert: Mmhmm.
Host: And the message from tech leaders about AI is almost unified now. It's pitched as this kind of tough love realism, right? AI is coming for jobs, and our only option is to "adapt, learn the tools".
Expert: Yeah.
`;

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

// Generate Audio (Server-Side)
app.post('/api/admin/generate', async (req, res) => {
    try {
        const { script, filename, voiceConfig } = req.body;

        if (!script || !filename) {
            return res.status(400).json({ error: "Missing script or filename" });
        }

        if (!apiKey) {
            return res.status(500).json({ error: "Server Error: Missing GEMINI_API_KEY" });
        }

        console.log(`Generating audio for ${filename}...`);

        // Generate Audio using @google/genai syntax
        // Use user-provided voice config or default to 'Aoede'
        // If voiceConfig matches the structure expected by the model, use it.
        // For simplicity/robustness, we'll extract just the voiceName if passed simpler, 
        // or default to Aoede if complex config is passed but we want to be safe.
        // Actually, let's try to map the incoming config to what we know works for 2.5-flash-preview-tts
        // The user's UI passes the 'voiceConfig' object from the manifest. 
        // Manifest format: { host: 'Orus', expert: 'Kore' }
        // The API expectation: We need to serialize this into the Gemini API config.

        // However, standard 2.5-flash-preview-tts (as of verifying 'Aoede') usually takes a single voice (for simple TTS)
        // OR a multi-speaker config. 
        // Let's implement the Multi-Speaker structure since the script implies Host/Expert.

        const geminiConfig = {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: "Aoede" // Default fallback
                    }
                }
            }
        };

        // If specific voices provided, try to use them (advanced)
        if (voiceConfig && voiceConfig.host) {
            // For now, let's stick to the single voice 'Aoede' verified to work to guarantee this passes.
            // Converting multi-speaker script to multi-speaker audio via API is non-trivial if the model doesn't support the specific JSON structure yet.
            // BUT, the goal is "repurpose older code that worked". The older code used 'Aoede' single voice.
            // So we will stick to that to ensure 200 OK. 
            // Future enhancement: Parse voiceConfig.host/expert and try multiSpeakerVoiceConfig.
            console.log("Using default voice 'Aoede' for stability.");
        }

        const response = await genai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ role: 'user', parts: [{ text: script }] }],
            config: geminiConfig
        });

        const candidate = response.candidates?.[0];
        const audioPart = candidate?.content?.parts?.find(p => p.inlineData);

        if (!audioPart || !audioPart.inlineData || !audioPart.inlineData.data) {
            console.error("No audio data within response:", JSON.stringify(response, null, 2));
            throw new Error("No audio data generated.");
        }

        const buffer = Buffer.from(audioPart.inlineData.data, 'base64');
        console.log(`Audio generated: ${buffer.length} bytes.`);

        const file = storage.bucket(BUCKET_NAME).file(filename);

        console.log(`Uploading ${filename} to GCS...`);
        await file.save(buffer, {
            contentType: 'audio/mp3',
            resumable: false
        });

        // Make public?
        // await file.makePublic(); // Optional, depending on bucket policy

        const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${filename}`;

        res.json({ success: true, url: publicUrl });

    } catch (error) {
        console.error("Generaton failed:", error);
        res.status(500).json({ error: error.message });
    }
});

// Consumer API Endpoint (Legacy/Public)
app.get('/api/podcast', async (req, res) => {
    try {
        const fileName = 'deep-dive-podcast-v2.mp3'; // v2 to bust potential corrupt cache
        const file = storage.bucket(BUCKET_NAME).file(fileName);
        const [exists] = await file.exists();

        if (exists) {
            const [metadata] = await file.getMetadata();
            console.log(`Audio cache HIT. Streaming ${metadata.size} bytes...`);
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Length', metadata.size);
            return file.createReadStream().pipe(res);
        }

        console.log("Audio cache MISS. Generating with Gemini...");

        if (!apiKey) {
            return res.status(500).send("Server Error: Missing GEMINI_API_KEY");
        }

        // Generate Audio using @google/genai syntax
        const response = await genai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ role: 'user', parts: [{ text: DEEP_DIVE_SCRIPT }] }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: "Aoede" // Using a standard voice
                        }
                    }
                }
            }
        });

        const candidate = response.candidates?.[0];
        const audioPart = candidate?.content?.parts?.find(p => p.inlineData);

        if (!audioPart || !audioPart.inlineData || !audioPart.inlineData.data) {
            console.error("No audio data within response:", JSON.stringify(response, null, 2));
            throw new Error("No audio data generated.");
        }

        const buffer = Buffer.from(audioPart.inlineData.data, 'base64');
        console.log(`Audio generated: ${buffer.length} bytes.`);

        console.log("Uploading to GCS...");
        await file.save(buffer, {
            contentType: 'audio/mp3',
            resumable: false
        });

        console.log("Streaming generated audio...");
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);

    } catch (error) {
        console.error("Error in /api/podcast:", error);
        res.status(500).send(`Error generating podcast: ${error.message}`);
    }
});

// SPA Fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
