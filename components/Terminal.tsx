import React, { useState, useRef, useEffect } from 'react';
import { TerminalState, ChatMessage, SectionId } from '../types';
import { sendMessageStream, initChatSession } from '../services/geminiService';
import { SECTION_CONFIG, GROVE_KNOWLEDGE_BASE } from '../constants';

interface TerminalProps {
  activeSection: SectionId;
  terminalState: TerminalState;
  setTerminalState: React.Dispatch<React.SetStateAction<TerminalState>>;
  externalQuery?: { display: string; query: string } | null;
  onQueryHandled?: () => void;
}

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

const parseInline = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-grove-clay font-bold">
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
      const text = currentTextBuffer.join('\n');
      if (text.trim()) {
        elements.push(
          <span key={`text-${elements.length}`} className="whitespace-pre-wrap block mb-3 last:mb-0 leading-relaxed font-serif text-sm">
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
            <li key={i} className="pl-4 relative text-sm font-sans text-ink-muted">
              <span className="absolute left-0 text-grove-clay top-1.5 w-1 h-1 rounded-full bg-grove-clay"></span>
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

const Terminal: React.FC<TerminalProps> = ({ activeSection, terminalState, setTerminalState, externalQuery, onQueryHandled }) => {
  const [input, setInput] = useState('');
  const [dynamicSuggestion, setDynamicSuggestion] = useState<string>('');
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [isVerboseMode, setIsVerboseMode] = useState<boolean>(false);
  const [ragContext, setRagContext] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/context')
      .then(res => res.json())
      .then(data => {
        if (data.context) {
          console.log("Loaded Dynamic RAG Context");
          setRagContext(data.context);
        }
      })
      .catch(err => console.error("Failed to load RAG context:", err));
  }, []);

  useEffect(() => {
    // Prefer dynamic context, fallback to static constant if fetch hasn't finished or failed
    const knowledgeBase = ragContext || GROVE_KNOWLEDGE_BASE;
    const fullSystemPrompt = `${SYSTEM_PROMPT}\n\nCURRENT USER CONTEXT: Reading section "${activeSection}".\n\n**DYNAMIC KNOWLEDGE BASE:**\n${knowledgeBase}`;

    initChatSession(fullSystemPrompt);
    const defaultHint = SECTION_CONFIG[activeSection]?.promptHint || "What is The Grove?";
    setDynamicSuggestion(defaultHint);
    setCurrentTopic('');
  }, [activeSection, ragContext]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (terminalState.isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [terminalState.messages, terminalState.isOpen]);

  const handleSend = async (manualQuery?: string, manualDisplay?: string) => {
    const textToSend = manualQuery !== undefined ? manualQuery : input;
    if (!textToSend.trim()) return;

    const textToDisplay = manualDisplay !== undefined ? manualDisplay : textToSend;

    const displayId = Date.now().toString();
    const finalDisplayText = isVerboseMode ? `${textToDisplay} --verbose` : textToDisplay;

    setTerminalState(prev => ({
      ...prev,
      messages: [...prev.messages, { id: displayId, role: 'user', text: finalDisplayText }],
      isLoading: true
    }));
    setInput('');

    const botMessageId = (Date.now() + 1).toString();
    setTerminalState(prev => ({
      ...prev,
      messages: [...prev.messages, { id: botMessageId, role: 'model', text: '', isStreaming: true }]
    }));

    // Add context to the prompt sent to API, but don't show in UI
    const promptContext = `[Context: User is viewing the ${SECTION_CONFIG[activeSection]?.title || activeSection} section. Provide a substantive response that reinforces the section's message while adding depth.]`;
    const apiPrompt = isVerboseMode
      ? `${promptContext} ${textToSend} --verbose. Give me the deep technical breakdown.`
      : `${promptContext} ${textToSend}`;

    let accumulatedRawText = "";

    await sendMessageStream(apiPrompt, (chunk) => {
      accumulatedRawText += chunk;
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

    const breadcrumbMatch = accumulatedRawText.match(/\[\[BREADCRUMB:(.*?)\]\]/);
    const topicMatch = accumulatedRawText.match(/\[\[TOPIC:(.*?)\]\]/);

    if (breadcrumbMatch && breadcrumbMatch[1]) setDynamicSuggestion(breadcrumbMatch[1].trim());
    else setDynamicSuggestion("Tell me more about the architecture.");

    if (topicMatch && topicMatch[1]) setCurrentTopic(topicMatch[1].trim());

    setTerminalState(prev => ({
      ...prev,
      isLoading: false,
      messages: prev.messages.map(msg =>
        msg.id === botMessageId ? { ...msg, isStreaming: false } : msg
      )
    }));
  };

  useEffect(() => {
    if (externalQuery && onQueryHandled) {
      handleSend(externalQuery.query, externalQuery.display);
      onQueryHandled();
    }
  }, [externalQuery]);

  const toggleVerboseMode = () => setIsVerboseMode(prev => !prev);
  const handleSuggestion = (hint: string) => handleSend(hint);
  const toggleTerminal = () => setTerminalState(prev => ({ ...prev, isOpen: !prev.isOpen }));

  return (
    <>
      {/* Floating Action Button - Clean Ink Style */}
      <button
        onClick={toggleTerminal}
        className={`fixed bottom-8 right-8 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 border border-ink/10 ${terminalState.isOpen ? 'bg-white text-ink' : 'bg-ink text-white'
          }`}
      >
        {terminalState.isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        ) : (
          <span className="font-mono text-xl font-bold">{`>_`}</span>
        )}
      </button>

      {/* Drawer - Library Marginalia Style */}
      <div className={`fixed inset-y-0 right-0 z-40 w-full md:w-[480px] bg-white border-l border-ink/10 transform transition-transform duration-500 ease-in-out shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] ${terminalState.isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full text-ink font-sans">

          {/* Header */}
          <div className="p-6 border-b border-ink/5 flex justify-between items-center bg-white">
            <div className="flex items-center space-x-3">
              <div className="font-display font-bold text-lg text-ink">The Terminal 🌱</div>
              {isVerboseMode && (
                <span className="bg-grove-clay text-white px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase shadow-sm">
                  Scholar Mode
                </span>
              )}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-ink-muted">
              CTX: {SECTION_CONFIG[activeSection]?.title.toUpperCase() || 'INDEX'}
            </div>
          </div>

          {/* Messages Area - Thread Style */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 terminal-scroll bg-white">
            {terminalState.messages.map((msg, idx) => {
              // Check if message is a system error
              const isSystemError = msg.text.startsWith('SYSTEM ERROR') || msg.text.startsWith('Error:');

              return (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

                  {/* Avatar / Label */}
                  <div className="text-[10px] font-mono text-ink-muted mb-2 uppercase tracking-widest">
                    {msg.role === 'user' ? 'You' : 'The Grove'}
                  </div>

                  {/* Message Body */}
                  <div className={`max-w-[95%] text-sm ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.role === 'user' ? (
                      <div className="bg-paper-dark px-4 py-3 rounded-tr-xl rounded-bl-xl rounded-tl-xl text-ink font-serif border border-ink/5">
                        {msg.text.replace(' --verbose', '')}
                      </div>
                    ) : (
                      <div className={`pl-4 border-l-2 ${isSystemError ? 'border-red-500 text-red-700 bg-red-50/50 py-2 pr-2' : 'border-grove-forest/30'}`}>
                        <MarkdownRenderer content={msg.text} />
                        {msg.isStreaming && <span className="inline-block w-1.5 h-3 ml-1 bg-ink/50 cursor-blink align-middle"></span>}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Interactions Area */}
          <div className="p-6 border-t border-ink/5 bg-paper/50">

            {/* Suggested Action - Reference Card Style */}
            <div className="mb-4">
              <button
                onClick={() => handleSuggestion(dynamicSuggestion)}
                className="w-full text-left p-4 bg-white border border-ink/5 rounded-sm hover:border-grove-forest/30 hover:shadow-sm transition-all group"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] text-grove-clay font-bold uppercase tracking-widest">
                    Suggested Inquiry
                  </span>
                  <span className="text-[9px] text-ink-muted group-hover:text-grove-forest transition-colors font-mono">
                    →
                  </span>
                </div>
                <div className="font-serif text-ink italic text-sm group-hover:text-grove-forest transition-colors">
                  "{dynamicSuggestion || "Start the sequence..."}"
                </div>
              </button>
            </div>

            <div className="flex items-center space-x-3 mb-4">
              {/* Verbose Toggle - Wax Seal Style */}
              <button
                onClick={toggleVerboseMode}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${isVerboseMode
                    ? 'bg-grove-clay text-white shadow-sm'
                    : 'bg-transparent text-ink-muted border border-ink/10 hover:border-grove-clay hover:text-grove-clay'
                  }`}
              >
                {isVerboseMode ? 'Scholar Mode: ON' : 'Enable Scholar Mode'}
              </button>
              {currentTopic && <span className="text-[10px] font-mono text-ink-muted">Ref: {currentTopic}</span>}
            </div>

            {/* Input Area */}
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Write a query..."
                className="w-full bg-white border border-ink/20 p-3 pl-4 pr-10 text-sm font-serif text-ink focus:outline-none focus:border-grove-forest focus:ring-1 focus:ring-grove-forest/20 transition-all rounded-sm placeholder:italic"
                disabled={terminalState.isLoading}
                autoComplete="off"
              />
              <button
                onClick={() => handleSend()}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-grove-forest transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Terminal;