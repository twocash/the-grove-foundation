import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from '../types';

let chatSession: Chat | null = null;

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    // We intentionally don't throw here to allow the UI to handle the missing key state gracefully
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const initChatSession = (systemInstruction: string) => {
  try {
    const ai = getAIClient();
    if (!ai) {
        console.warn("API Key missing during initialization.");
        chatSession = null;
        return;
    }
    chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });
  } catch (error) {
    console.error("Failed to initialize chat session", error);
    chatSession = null;
  }
};

export const sendMessageStream = async (
  message: string, 
  onChunk: (text: string) => void
): Promise<string> => {
  // Check for API Key first
  if (!process.env.API_KEY) {
      const errorMsg = `SYSTEM ERROR: API Key Missing.

The application cannot find the 'API_KEY' environment variable.

**Action Required:**
Please check your deployment settings or environment configuration to ensure the API_KEY is correctly defined.`;
      
      onChunk(errorMsg);
      return errorMsg;
  }

  if (!chatSession) {
    // Re-init if lost
    initChatSession("You are The Grove Terminal. Helpful, precise, cyberpunk persona.");
  }

  if (!chatSession) {
    const errorMsg = "Error: Terminal Offline. Check API Configuration.";
    onChunk(errorMsg);
    return errorMsg;
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
  } catch (error: any) {
    console.error("Stream error:", error);
    
    let errorMsg = "Error: Connection interrupted.";
    const errorMessage = error.message || error.toString();
    
    // Check for common API key restriction errors
    if (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID")) {
        errorMsg = `SYSTEM ERROR: API Key Rejected.
        
**Troubleshooting:**
1. Go to Google Cloud Console > Credentials.
2. Edit your API Key.
3. Check 'Application restrictions'.
4. Ensure your current domain is allowed.`;
        
        console.warn("API Key rejected. Check Google Cloud Console restrictions.");
    } else if (errorMessage.includes("429")) {
        errorMsg = "SYSTEM ERROR: Rate limit exceeded.";
    } else if (errorMessage.includes("Failed to fetch")) {
        errorMsg = "SYSTEM ERROR: Network connectivity issue.";
    }

    onChunk(errorMsg);
    return errorMsg;
  }
};

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