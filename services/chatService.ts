/**
 * Chat Service - Frontend client for server-side chat API
 *
 * This service handles communication with the /api/chat endpoint,
 * managing sessions and SSE streaming for real-time responses.
 *
 * Architecture:
 * - All Gemini API calls are made server-side (API key never exposed)
 * - Uses Server-Sent Events (SSE) for streaming responses
 * - Manages session lifecycle (create, use, cleanup)
 */

// Types
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ChatOptions {
  sessionId?: string;
  sectionContext?: string;
  personaTone?: string;
  verboseMode?: boolean;
  terminatorMode?: boolean;
}

export interface ChatResponse {
  sessionId: string;
  breadcrumb: string | null;
  topic: string | null;
}

export interface ChatHealthStatus {
  status: 'ok' | 'error';
  apiKeyConfigured: boolean;
  activeSessions: number;
}

// Session state (singleton)
let currentSessionId: string | null = null;

/**
 * Initialize a new chat session
 * Call this when the user changes lens/persona or starts fresh
 */
export async function initChatSession(options: Omit<ChatOptions, 'sessionId' | 'verboseMode'>): Promise<string> {
  try {
    const response = await fetch('/api/chat/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sectionContext: options.sectionContext,
        personaTone: options.personaTone,
        terminatorMode: options.terminatorMode ?? false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to initialize chat session');
    }

    const data = await response.json();
    currentSessionId = data.sessionId;
    console.log('Chat session initialized:', currentSessionId);
    return currentSessionId;
  } catch (error) {
    console.error('Failed to init chat session:', error);
    throw error;
  }
}

/**
 * Send a message and stream the response
 * Uses SSE for real-time streaming
 */
export async function sendMessageStream(
  message: string,
  onChunk: (text: string) => void,
  options: ChatOptions = {}
): Promise<ChatResponse> {
  const requestBody = {
    message,
    sessionId: options.sessionId ?? currentSessionId,
    sectionContext: options.sectionContext,
    personaTone: options.personaTone,
    verboseMode: options.verboseMode ?? false,
    terminatorMode: options.terminatorMode ?? false
  };

  return new Promise((resolve, reject) => {
    // Use fetch with streaming
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    }).then(async (response) => {
      if (!response.ok) {
        // Try to parse error JSON
        try {
          const error = await response.json();
          reject(new Error(error.error || `HTTP ${response.status}`));
        } catch {
          reject(new Error(`HTTP ${response.status}`));
        }
        return;
      }

      // Get session ID from header (for new sessions)
      const sessionId = response.headers.get('X-Session-Id');
      if (sessionId && !currentSessionId) {
        currentSessionId = sessionId;
      }

      // Process SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        reject(new Error('Response body not readable'));
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      let responseData: ChatResponse = {
        sessionId: sessionId || currentSessionId || '',
        breadcrumb: null,
        topic: null
      };

      const processChunk = async () => {
        try {
          const { done, value } = await reader.read();

          if (done) {
            resolve(responseData);
            return;
          }

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events (separated by \n\n)
          const events = buffer.split('\n\n');
          buffer = events.pop() || ''; // Keep incomplete event in buffer

          for (const event of events) {
            if (!event.trim()) continue;

            // Parse SSE data line
            const dataMatch = event.match(/^data:\s*(.+)$/m);
            if (!dataMatch) continue;

            try {
              const data = JSON.parse(dataMatch[1]);

              switch (data.type) {
                case 'chunk':
                  fullText += data.text;
                  onChunk(data.text);
                  break;

                case 'done':
                  responseData = {
                    sessionId: data.sessionId || responseData.sessionId,
                    breadcrumb: data.breadcrumb,
                    topic: data.topic
                  };
                  // Update current session ID
                  if (data.sessionId) {
                    currentSessionId = data.sessionId;
                  }
                  break;

                case 'error':
                  reject(new Error(data.error || 'Stream error'));
                  return;
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', dataMatch[1]);
            }
          }

          // Continue reading
          processChunk();
        } catch (readError) {
          reject(readError);
        }
      };

      processChunk();
    }).catch(reject);
  });
}

/**
 * Send a message without streaming (for simpler use cases)
 * Collects all chunks and returns the complete response
 */
export async function sendMessage(
  message: string,
  options: ChatOptions = {}
): Promise<{ text: string } & ChatResponse> {
  let fullText = '';

  const response = await sendMessageStream(
    message,
    (chunk) => { fullText += chunk; },
    options
  );

  return {
    text: fullText,
    ...response
  };
}

/**
 * End the current chat session
 */
export async function endChatSession(sessionId?: string): Promise<void> {
  const idToEnd = sessionId ?? currentSessionId;
  if (!idToEnd) return;

  try {
    await fetch(`/api/chat/${idToEnd}`, { method: 'DELETE' });
    if (idToEnd === currentSessionId) {
      currentSessionId = null;
    }
    console.log('Chat session ended:', idToEnd);
  } catch (error) {
    console.warn('Failed to end chat session:', error);
  }
}

/**
 * Reset the session (for persona/lens changes)
 * Ends current session and clears state
 */
export async function resetSession(): Promise<void> {
  if (currentSessionId) {
    await endChatSession();
  }
  currentSessionId = null;
}

/**
 * Get current session ID
 */
export function getSessionId(): string | null {
  return currentSessionId;
}

/**
 * Check chat service health
 */
export async function checkChatHealth(): Promise<ChatHealthStatus> {
  try {
    const response = await fetch('/api/chat/health');
    if (!response.ok) {
      return { status: 'error', apiKeyConfigured: false, activeSessions: 0 };
    }
    return await response.json();
  } catch {
    return { status: 'error', apiKeyConfigured: false, activeSessions: 0 };
  }
}

/**
 * Format error messages for display
 */
export function formatChatError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;

    // Handle common error cases
    if (message.includes('API key not configured')) {
      return `SYSTEM ERROR: API Key Missing.

The server cannot find the Gemini API key.

**Action Required:**
Please check your deployment settings to ensure GEMINI_API_KEY is correctly configured.`;
    }

    if (message.includes('429') || message.includes('rate limit')) {
      return 'SYSTEM ERROR: Rate limit exceeded. Please wait a moment and try again.';
    }

    if (message.includes('Failed to fetch') || message.includes('network')) {
      return 'SYSTEM ERROR: Network connectivity issue. Please check your connection.';
    }

    if (message.includes('413') || message.includes('Payload Too Large')) {
      return 'SYSTEM ERROR: Request too large. Please try a shorter message.';
    }

    return `Error: ${message}`;
  }

  return 'Error: Connection interrupted.';
}
