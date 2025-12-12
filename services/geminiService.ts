import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from '../types';

let chatSession: Chat | null = null;

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const initChatSession = (systemInstruction: string) => {
  try {
    const ai = getAIClient();
    chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });
  } catch (error) {
    console.error("Failed to initialize chat session", error);
  }
};

export const sendMessageStream = async (
  message: string, 
  onChunk: (text: string) => void
): Promise<string> => {
  if (!chatSession) {
    // Re-init if lost, though ideally should be persistent
    initChatSession("You are The Grove Terminal. Helpful, precise, cyberpunk persona.");
  }

  if (!chatSession) {
    return "Error: Terminal Offline.";
  }

  try {
    const result = await chatSession.sendMessageStream({ message });
    let fullText = "";
    
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      const text = c.text;
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Stream error:", error);
    return "Error: Connection interrupted.";
  }
};

export const generateArtifact = async (prompt: string, context: string): Promise<string> => {
  const ai = getAIClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Context: ${context}. \n\n Task: ${prompt}. \n\n Output format: detailed technical markdown or JSON/YAML where appropriate.`,
    });
    return response.text || "Artifact generation failed.";
  } catch (error) {
    return "Error: Unable to generate artifact.";
  }
};