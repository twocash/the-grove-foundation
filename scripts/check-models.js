
import { GoogleGenAI } from '@google/genai';

async function main() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("Error: GEMINI_API_KEY environment variable is not set.");
        process.exit(1);
    }

    const client = new GoogleGenAI({ apiKey });

    console.log("--- Listing Available Models ---");
    try {
        const listResp = await client.models.list();
        // The list response structure depends on the SDK version; trying to print safely
        if (Array.isArray(listResp)) {
            listResp.forEach(m => console.log(` - ${m.name}`));
        } else if (listResp.models) {
            listResp.models.forEach(m => console.log(` - ${m.name}`));
        } else {
            console.log("Raw List Response:", JSON.stringify(listResp, null, 2));
        }
    } catch (e) {
        console.log("List Models Failed:", e.message);
    }
    console.log("--------------------------------\n");

    const modelName = 'gemini-2.5-flash-preview-tts';

    // Test 1: Text Only (Baseline)
    console.log(`\n--- Test 1: ${modelName} (Text Only) ---`);
    try {
        const response = await client.models.generateContent({
            model: modelName,
            contents: [{ parts: [{ text: "Say hello." }] }],
        });
        console.log("✅ Text Success. Response:", response.text?.substring(0, 50) + "...");
    } catch (e) {
        console.log("❌ Text Failed:", e.message);
    }

    // Test 2: Audio (camelCase config)
    console.log(`\n--- Test 2: ${modelName} (Audio - camelCase) ---`);
    try {
        const response = await client.models.generateContent({
            model: modelName,
            contents: [{ parts: [{ text: "Say hello." }] }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: "Aoede"
                        }
                    }
                }
            }
        });
        if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
            console.log("✅ Audio Success (camelCase).");
        } else {
            console.log("❌ Audio Failed (camelCase). No inline data.");
            console.log("FULL RESPONSE:", JSON.stringify(response, null, 2));
        }
    } catch (e) {
        console.log("❌ Audio Failed (camelCase):", e.message);
    }
}

main();
