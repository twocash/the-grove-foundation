import React, { useState, useEffect } from 'react';
import { SectionId } from '../types';
import { SECTION_HOOKS } from '../constants';
import { useNarrative } from '../hooks/useNarrative';

interface PromptHooksProps {
  sectionId: SectionId;
  onHookClick: (data: { nodeId?: string; display: string; query: string }) => void;
  className?: string;
  variant?: 'light' | 'dark';
}

const PromptHooks: React.FC<PromptHooksProps> = ({ sectionId, onHookClick, className = '', variant = 'dark' }) => {
  const { getSectionNodes, loading } = useNarrative();
  const narrativeNodes = getSectionNodes(sectionId);

  // Fallback to static hooks if no narrative nodes
  const staticHooks = SECTION_HOOKS[sectionId] || [];

  const [activeIndex, setActiveIndex] = useState(0);

  // Determine which source to use
  const useNarrativeData = narrativeNodes.length > 0;
  const itemCount = useNarrativeData ? narrativeNodes.length : staticHooks.length;

  useEffect(() => {
    if (itemCount <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % itemCount);
    }, 6000);
    return () => clearInterval(interval);
  }, [itemCount]);

  // Loading or empty state
  if (loading) return null;
  if (itemCount === 0) return null;

  // Visual Styles
  const textColor = variant === 'light' ? 'text-white/80 hover:text-white' : 'text-ink/60 hover:text-grove-forest';
  const borderColor = variant === 'light' ? 'border-white/20 hover:border-white/40' : 'border-ink/10 hover:border-grove-forest/30';
  const iconColor = variant === 'light' ? 'text-grove-clay' : 'text-grove-clay';
  const dividerColor = variant === 'light' ? 'bg-white/20' : 'bg-ink/10';

  // If using narrative data, render from graph
  if (useNarrativeData) {
    return (
      <div className={`flex flex-wrap justify-center gap-3 ${className}`}>
        {narrativeNodes.map((node, index) => (
          <button
            key={node.id}
            onClick={() => onHookClick({
              nodeId: node.id,
              display: node.label,
              query: node.query
            })}
            className={`group relative flex items-center space-x-3 px-5 py-2.5 rounded-full border ${borderColor} bg-transparent transition-all duration-300 hover:shadow-sm ${
              index === activeIndex ? 'ring-2 ring-grove-forest/20' : ''
            }`}
          >
            <span className={`text-[10px] font-mono uppercase tracking-widest ${iconColor}`}>
              Ask
            </span>
            <span className={`w-px h-3 ${dividerColor}`}></span>
            <span className={`font-serif text-sm italic ${textColor} transition-colors text-left`}>
              {node.label}
            </span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] ml-2 text-grove-forest">
              →
            </span>
          </button>
        ))}
      </div>
    );
  }

  // Fallback to static hooks (original behavior)
  const currentHook = staticHooks[activeIndex];

  return (
    <div className={`flex justify-center ${className}`}>
      <button
        onClick={() => onHookClick({ display: currentHook.text, query: currentHook.prompt })}
        className={`group relative flex items-center space-x-3 px-5 py-2.5 rounded-full border ${borderColor} bg-transparent transition-all duration-500`}
      >
        <span className={`text-[10px] font-mono uppercase tracking-widest ${iconColor}`}>
          Ask the Village
        </span>
        <span className={`w-px h-3 ${dividerColor}`}></span>
        <span className={`font-serif text-sm italic ${textColor} transition-colors text-left`}>
          {currentHook.text}
        </span>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] ml-2 text-grove-forest">
          →
        </span>
      </button>
    </div>
  );
};

export default PromptHooks;
