import { GoogleGenAI } from "@google/genai";

// Helper: Add WAV Header to Raw PCM Data
const addWavHeader = (pcmData: Uint8Array, sampleRate: number = 24000, numChannels: number = 1): Blob => {
    const header = new ArrayBuffer(44);
    const view = new DataView(header);

    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };

    const byteRate = sampleRate * numChannels * 2; // 16-bit = 2 bytes
    const blockAlign = numChannels * 2;

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + pcmData.length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true);  // AudioFormat (1 = PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // BitsPerSample
    writeString(view, 36, 'data');
    view.setUint32(40, pcmData.length, true);

    return new Blob([header, pcmData], { type: 'audio/wav' });
};

export const generateAudioBlob = async (script: string, config: { host: string, expert: string }): Promise<Blob> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key Missing");

    const ai = new GoogleGenAI({ apiKey });
    const voiceName = config.host || 'Aoede';

    const geminiConfig = {
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ role: "user", parts: [{ text: script }] }],
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: voiceName
                    }
                }
            }
        }
    };

    console.log("Requesting Audio...");
    const response = await ai.models.generateContent(geminiConfig);

    // Handle SDK Response structure
    const candidates = response.candidates || (response as any).response?.candidates;
    const audioData = candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
        throw new Error("Gemini API returned no audio data.");
    }

    // Check if result is empty
    if (audioData.length < 100) {
        throw new Error("Gemini returned invalid short data.");
    }

    console.log(`Audio Data Received (Base64). Length: ${audioData.length}`);

    // Decode Base64 to Raw Bytes (PCM)
    const binaryString = window.atob(audioData);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    // Safety Check: Detect Silence (all zeros)
    let nonZeroCount = 0;
    // Check first 1000 bytes just to be fast, or sample
    for (let i = 0; i < len; i++) {
        if (bytes[i] !== 0) nonZeroCount++;
    }

    if (nonZeroCount === 0) {
        console.error("CRITICAL: Silent Buffer.");
        throw new Error("Generated audio is silent (all zeros).");
    }

    console.log(`Constructing WAV Blob. 24kHz Mono 16-bit. Size: ${len}`);

    // Wrap Raw PCM in WAV Header
    return addWavHeader(bytes, 24000, 1);
};
