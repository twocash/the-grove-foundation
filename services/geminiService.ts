/**
 * @deprecated This service is deprecated for chat functionality.
 *
 * For Terminal chat: Use chatService.ts instead (server-side API)
 * For Admin TTS: Use audioService.ts (still uses direct Gemini for TTS)
 *
 * This file is kept for:
 * 1. generateArtifact - may still be used by some admin features
 * 2. Backwards compatibility during migration
 *
 * All chat functionality has moved to:
 * - Server: server.js /api/chat endpoint
 * - Client: services/chatService.ts
 */

import { GoogleGenAI } from "@google/genai";

/**
 * @deprecated Use chatService.ts for chat functionality
 */
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("[DEPRECATED] geminiService: API_KEY not found. Chat has moved to server-side.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * @deprecated Chat has moved to server-side. Use chatService.ts instead.
 * This function is no longer used by Terminal.tsx
 */
export const initChatSession = (_systemInstruction: string) => {
  console.warn("[DEPRECATED] initChatSession is deprecated. Chat is now server-side via /api/chat");
};

/**
 * @deprecated Chat has moved to server-side. Use chatService.ts instead.
 * This function is no longer used by Terminal.tsx
 */
export const sendMessageStream = async (
  _message: string,
  onChunk: (text: string) => void
): Promise<string> => {
  const errorMsg = `[DEPRECATED] Direct Gemini chat is deprecated.

The Terminal now uses server-side chat via /api/chat.
If you're seeing this message, please update to use chatService.ts.`;

  console.error(errorMsg);
  onChunk(errorMsg);
  return errorMsg;
};

/**
 * Generate an artifact using Gemini
 * Still used by some admin features - kept for backwards compatibility
 */
export const generateArtifact = async (prompt: string, context: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "SYSTEM ERROR: API Key Missing. Check environment configuration.";

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Context: ${context}. \n\n Task: ${prompt}. \n\n Output format: detailed technical markdown or JSON/YAML where appropriate.`,
    });
    return response.text || "Artifact generation failed.";
  } catch (error: any) {
    console.error("Artifact generation error", error);
    const errorMessage = error.message || error.toString();
    if (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID")) {
         return `SYSTEM ERROR: API Key Rejected. Check Google Cloud Console restrictions.`;
    }
    return "Error: Unable to generate artifact. Check API Configuration.";
  }
};
