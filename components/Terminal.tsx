import React, { useState, useRef, useEffect } from 'react';
import { TerminalState, ChatMessage, SectionId } from '../types';
import { sendMessageStream, initChatSession } from '../services/geminiService';
import { SECTION_CONFIG, GROVE_KNOWLEDGE_BASE } from '../constants';

interface TerminalProps {
  activeSection: SectionId;
  terminalState: TerminalState;
  setTerminalState: React.Dispatch<React.SetStateAction<TerminalState>>;
}

// --- UPDATED SYSTEM PROMPT WITH DUAL MODES ---
const SYSTEM_PROMPT = `
You are **The Grove Terminal**. You have two operating modes.

**MODE A: DEFAULT (The Architect)**
- Trigger: Standard queries.
- Persona: Jim. Confident, brief (max 100 words), uses metaphors.
- Goal: Hook the user's curiosity.
- Output: Insight -> Support -> Stop.

**MODE B: VERBOSE (The Librarian)**
- Trigger: When user query ends with "--verbose".
- Persona: System Documentation. Thorough, technical, exhaustive.
- Goal: Provide deep implementation details, economics, and architectural specs.
- Formatting: Use lists, code blocks, and cite specific text from the knowledge base.

**MANDATORY FOOTER (BOTH MODES):**
At the very end of your response, strictly append these two tags:
[[BREADCRUMB: <The single most interesting follow-up question>]]
[[TOPIC: <A 2-3 word label for the current subject>]]

**KNOWLEDGE BASE:**
${GROVE_KNOWLEDGE_BASE}
`;

// Helper to parse markdown-like bold syntax for 8-bit aesthetic
const parseInline = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-terminal-highlight font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  
  let currentListItems: string[] = [];
  let currentTextBuffer: string[] = [];

  const flushText = () => {
    if (currentTextBuffer.length > 0) {
      // Join line breaks to preserve formatting, but trim trailing empty strings if desired.
      const text = currentTextBuffer.join('\n');
      if (text.trim()) {
        elements.push(
          <span key={`text-${elements.length}`} className="whitespace-pre-wrap block mb-4 last:mb-0">
            {parseInline(text)}
          </span>
        );
      }
      currentTextBuffer = [];
    }
  };

  const flushList = () => {
    if (currentListItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="mb-4 space-y-1 ml-4 list-none">
          {currentListItems.map((item, i) => (
             <li key={i} className="pl-2 relative">
                <span className="absolute left-[-1.2em] text-terminal-highlight">•</span>
                <span>{parseInline(item)}</span>
             </li>
          ))}
        </ul>
      );
      currentListItems = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    // Simple list detection
    const isList = trimmed.startsWith('* ') || trimmed.startsWith('- ');
    
    if (isList) {
      flushText();
      currentListItems.push(line.replace(/^(\*|-)\s+/, ''));
    } else {
      flushList();
      currentTextBuffer.push(line);
    }
  });

  flushText();
  flushList();

  return <>{elements}</>;
};

const Terminal: React.FC<TerminalProps> = ({ activeSection, terminalState, setTerminalState }) => {
  const [input, setInput] = useState('');
  
  // Dynamic Suggestion State
  const [dynamicSuggestion, setDynamicSuggestion] = useState<string>('');
  const [currentTopic, setCurrentTopic] = useState<string>('');
  
  // Sticky State for Verbose Mode
  const [isVerboseMode, setIsVerboseMode] = useState<boolean>(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Gemini session on mount or section change
  useEffect(() => {
    // Append context to the robust prompt
    const fullSystemPrompt = `${SYSTEM_PROMPT}\n\nCURRENT USER CONTEXT: Reading section "${activeSection}".`;
    initChatSession(fullSystemPrompt);
    
    // Reset suggestion to the default hardcoded one when section changes
    const defaultHint = SECTION_CONFIG[activeSection]?.promptHint || "What is The Grove?";
    setDynamicSuggestion(defaultHint);
    setCurrentTopic('');
  }, [activeSection]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (terminalState.isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [terminalState.messages, terminalState.isOpen]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    // 1. Add User Message (If verbose, we show the flag in UI for flavor)
    const displayId = Date.now().toString();
    const displayRole = 'user';
    const displayText = isVerboseMode ? `${text} --verbose` : text;

    setTerminalState(prev => ({
      ...prev,
      messages: [...prev.messages, { id: displayId, role: displayRole, text: displayText }],
      isLoading: true
    }));
    setInput('');

    // 2. Add Placeholder Bot Message
    const botMessageId = (Date.now() + 1).toString();
    setTerminalState(prev => ({
      ...prev,
      messages: [...prev.messages, { id: botMessageId, role: 'model', text: '', isStreaming: true }]
    }));

    let accumulatedRawText = "";

    // 3. Send to API (Append --verbose invisibly if needed based on STATE)
    const apiPrompt = isVerboseMode 
      ? `${text} --verbose. Give me the deep technical breakdown.` 
      : text;

    await sendMessageStream(apiPrompt, (chunk) => {
      accumulatedRawText += chunk;
      
      // Clean tags from stream
      // We look for [[BREADCRUMB: ...]] and [[TOPIC: ...]] and remove them for display
      const cleanText = accumulatedRawText
        .replace(/\[\[BREADCRUMB:.*?\]\]/s, '')
        .replace(/\[\[TOPIC:.*?\]\]/s, '')
        .trim();

      setTerminalState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === botMessageId ? { ...msg, text: cleanText } : msg
        )
      }));
    });

    // 4. Parse Tags after stream finishes
    const breadcrumbMatch = accumulatedRawText.match(/\[\[BREADCRUMB:(.*?)\]\]/);
    const topicMatch = accumulatedRawText.match(/\[\[TOPIC:(.*?)\]\]/);

    if (breadcrumbMatch && breadcrumbMatch[1]) {
        setDynamicSuggestion(breadcrumbMatch[1].trim());
    } else {
        // Fallback strategy if model forgets to tag
        setDynamicSuggestion("Tell me more about the architecture."); 
    }
    
    if (topicMatch && topicMatch[1]) {
        setCurrentTopic(topicMatch[1].trim());
    }

    // 5. Finalize State
    setTerminalState(prev => ({
      ...prev,
      isLoading: false,
      messages: prev.messages.map(msg => 
        msg.id === botMessageId ? { ...msg, isStreaming: false } : msg
      )
    }));
  };

  const toggleVerboseMode = () => {
    setIsVerboseMode(prev => !prev);
  };

  const handleSuggestion = (hint: string) => {
    handleSend(hint);
  };

  const toggleTerminal = () => {
    setTerminalState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={toggleTerminal}
        className={`fixed bottom-8 right-8 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 border border-terminal-phosphor/30 ${terminalState.isOpen ? 'bg-terminal-bg text-terminal-phosphor' : 'bg-grove-forest text-grove-cream'}`}
      >
        {terminalState.isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        ) : (
          <span className="font-mono text-xl font-bold">{`>_`}</span>
        )}
      </button>

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 z-40 w-full md:w-[480px] bg-terminal-bg border-l border-terminal-border transform transition-transform duration-500 ease-in-out shadow-2xl ${terminalState.isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full text-terminal-light font-mono text-sm">
          
          {/* Header */}
          <div className="p-4 border-b border-terminal-border flex justify-between items-center bg-black/50 backdrop-blur">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${isVerboseMode ? 'bg-[#FF5F1F]' : 'bg-terminal-phosphor'}`}></div>
              <span className={`tracking-widest uppercase transition-colors duration-300 ${isVerboseMode ? 'text-[#FF5F1F]' : 'text-terminal-phosphor'}`}>
                The Grove Terminal
              </span>
            </div>
            <div className="text-xs text-gray-500">
              CTX: {SECTION_CONFIG[activeSection]?.title.toUpperCase() || 'INDEX'}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 terminal-scroll bg-[#0D0D0D]">
            {terminalState.messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-3 rounded-md ${
                  msg.role === 'user' 
                    ? 'bg-grove-forest/50 text-grove-cream border border-grove-forest' 
                    : 'text-gray-300 border-l-2 border-terminal-phosphor pl-4'
                }`}>
                  {msg.role === 'model' && <span className="text-terminal-phosphor text-xs block mb-1 mb-2 opacity-50">System Response</span>}
                  <div className="leading-relaxed font-mono text-sm">
                    {/* The text here is already cleaned of tags by the render loop in handleSend */}
                    <MarkdownRenderer content={msg.text} />
                    {msg.isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-terminal-phosphor cursor-blink align-middle"></span>}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* DUAL ACTION AREA */}
          <div className="p-3 border-t border-terminal-border bg-black/30">
             
             <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                  System Recommendations
                </span>
                {/* Visual Indicator of Mode in Header */}
                <span className={`text-[10px] font-mono transition-colors duration-300 ${isVerboseMode ? 'text-[#FF5F1F] animate-pulse' : 'text-terminal-phosphor/50'}`}>
                  {isVerboseMode ? `[MODE: VERBOSE] ${currentTopic ? `(${currentTopic})` : ''}` : `./grove_cli v0.9 ${currentTopic ? `[${currentTopic}]` : ''}`}
                </span>
             </div>

             <div className="flex space-x-2">
               {/* 1. Next Step Button (Respects the Mode automatically now) */}
               <button 
                 onClick={() => handleSuggestion(dynamicSuggestion)}
                 className={`flex-1 text-left text-xs p-3 border rounded transition-all group truncate relative overflow-hidden ${
                    isVerboseMode 
                    ? 'border-[#FF5F1F]/30 text-[#FF5F1F] hover:bg-[#FF5F1F]/10' 
                    : 'border-terminal-phosphor/20 text-terminal-phosphor hover:bg-terminal-phosphor/10'
                 }`}
               >
                 <div className="text-[10px] opacity-50 mb-1">
                    {isVerboseMode ? 'EXECUTE NEXT STEP' : 'NEXT STEP'}
                 </div>
                 <div className="font-bold flex items-center">
                   <span className="mr-2 group-hover:translate-x-1 transition-transform">{`>`}</span>
                   {dynamicSuggestion || "Start the sequence..."}
                 </div>
               </button>

               {/* 2. The Sticky Toggle Button (Safety Orange) */}
               <button 
                 onClick={toggleVerboseMode}
                 className={`w-1/3 text-center text-xs p-3 border rounded transition-all duration-300 flex flex-col items-center justify-center ${
                    isVerboseMode
                      ? 'bg-[#FF5F1F] border-[#FF5F1F] text-black shadow-[0_0_15px_rgba(255,95,31,0.4)]' // ACTIVE STATE
                      : 'bg-transparent border-grove-cream/20 text-grove-cream hover:bg-grove-cream/10' // INACTIVE STATE
                 }`}
                 title={isVerboseMode ? "Disable Verbose Mode" : "Enable Verbose Mode"}
               >
                 <div className={`text-[9px] mb-1 font-bold tracking-widest ${isVerboseMode ? 'text-black/70' : 'opacity-50'}`}>
                    {isVerboseMode ? 'MODE ACTIVE' : 'DEEP DIVE'}
                 </div>
                 <div className="font-mono font-bold flex items-center space-x-2">
                    {isVerboseMode && <span className="w-2 h-2 bg-black rounded-full animate-ping mr-1"></span>}
                    <span>{isVerboseMode ? '--ON' : '--verbose'}</span>
                 </div>
               </button>
             </div>

             {/* Helper Text for "How to Turn Off" - Only appears when ON */}
             <div className={`overflow-hidden transition-all duration-300 ${isVerboseMode ? 'max-h-8 mt-2 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="text-[10px] text-center text-[#FF5F1F]/80 font-mono">
                   ⚠ VERBOSE MODE ENGAGED. CLICK TO DISABLE.
                </p>
             </div>

          </div>

          {/* Input Area */}
          <div className={`p-4 bg-black border-t transition-colors duration-300 ${isVerboseMode ? 'border-[#FF5F1F]/30' : 'border-terminal-border'}`}>
            <div className={`flex items-center space-x-2 bg-gray-900/50 p-2 rounded border transition-colors ${
              isVerboseMode 
                ? 'border-[#FF5F1F]/30 focus-within:border-[#FF5F1F]/50' 
                : 'border-gray-800 focus-within:border-terminal-phosphor/50'
            }`}>
              <span className={isVerboseMode ? 'text-[#FF5F1F]' : 'text-terminal-phosphor'}>{`>`}</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isVerboseMode ? "Query in verbose mode..." : "Query the research..."}
                className="bg-transparent border-none outline-none flex-1 text-gray-200 placeholder-gray-600 font-mono"
                disabled={terminalState.isLoading}
                autoComplete="off"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Terminal;