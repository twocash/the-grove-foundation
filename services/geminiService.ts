import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from '../types';

let chatSession: Chat | null = null;

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    throw new Error("API Key missing");
  }
  // Sanity check for key format to help debugging
  if (!apiKey.startsWith("AIza")) {
     console.warn("Potential API Key configuration issue: Key does not start with 'AIza'.");
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
    chatSession = null;
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
    
    if (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID")) {
        console.warn(`API Key rejected. Ensure this domain is allowed in Google Cloud Console: ${window.location.origin}/*`);
        // Specific advice for the most common production error
        errorMsg = "SYSTEM ERROR: API Key Rejected. Check 'Application Restrictions' (HTTP Referrers) in Google Cloud Console to ensure this domain is allowed.";
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
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Context: ${context}. \n\n Task: ${prompt}. \n\n Output format: detailed technical markdown or JSON/YAML where appropriate.`,
    });
    return response.text || "Artifact generation failed.";
  } catch (error: any) {
    console.error("Artifact generation error", error);
    const errorMessage = error.message || error.toString();
    if (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID")) {
        console.warn(`API Key rejected. Ensure this domain is allowed in Google Cloud Console: ${window.location.origin}/*`);
        return "SYSTEM ERROR: API Key Rejected. Check Domain Restrictions in Google Cloud Console.";
    }
    return "Error: Unable to generate artifact. Check API Configuration.";
  }
};