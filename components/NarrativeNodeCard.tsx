import React from 'react';
import { NarrativeNode } from '../types';

interface NarrativeNodeCardProps {
  node: NarrativeNode;
  allNodeIds: string[];
  onChange: (updatedNode: NarrativeNode) => void;
  onDelete: (id: string) => void;
}

const NarrativeNodeCard: React.FC<NarrativeNodeCardProps> = ({ node, allNodeIds, onChange, onDelete }) => {

  const handleNextChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    onChange({ ...node, next: selectedOptions });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow relative group">

      {/* Header / ID */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-mono uppercase text-gray-400 tracking-widest">ID: {node.id}</span>
          <input
            type="text"
            value={node.label}
            onChange={(e) => onChange({ ...node, label: e.target.value })}
            className="font-bold text-lg text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-green-600 focus:outline-none transition-colors w-full mt-1"
            placeholder="Button Label..."
          />
        </div>
        <button onClick={() => onDelete(node.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1 ml-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>

      {/* Query Editor */}
      <div className="mb-4">
        <div className="flex items-center text-xs font-mono text-gray-500 mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>Prompt Query</span>
        </div>
        <textarea
          value={node.query}
          onChange={(e) => onChange({ ...node, query: e.target.value })}
          className="w-full h-20 text-sm p-2 bg-gray-50 border border-gray-200 rounded focus:border-green-500 focus:outline-none resize-none"
        />
      </div>

      {/* Context Snippet (RAG) */}
      <div className="mb-4">
        <div className="flex items-center text-xs font-mono text-gray-500 mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21c0 1 0 1 1 1z"></path>
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
          </svg>
          <span>Context Snippet (Truth Grounding)</span>
        </div>
        <textarea
          value={node.contextSnippet || ''}
          onChange={(e) => onChange({ ...node, contextSnippet: e.target.value })}
          className="w-full h-16 text-xs font-mono p-2 bg-white border border-gray-200 rounded text-gray-600 focus:text-gray-900 focus:border-green-500 focus:outline-none resize-none"
          placeholder="Optional: Paste exact text from PDF here..."
        />
      </div>

      {/* Section ID */}
      <div className="mb-4">
        <div className="flex items-center text-xs font-mono text-gray-500 mb-1">
          <span>Section (Entry Point)</span>
        </div>
        <select
          value={node.sectionId || ''}
          onChange={(e) => onChange({ ...node, sectionId: e.target.value as any || undefined })}
          className="w-full text-sm p-2 bg-white border border-gray-200 rounded focus:border-green-500 focus:outline-none"
        >
          <option value="">None (not an entry)</option>
          <option value="stakes">Stakes</option>
          <option value="ratchet">Ratchet</option>
          <option value="what_is_grove">What Is Grove</option>
          <option value="architecture">Architecture</option>
          <option value="economics">Economics</option>
          <option value="differentiation">Differentiation</option>
          <option value="network">Network</option>
          <option value="get_involved">Get Involved</option>
        </select>
      </div>

      {/* Connections (Next) */}
      <div>
        <div className="flex items-center text-xs font-mono text-orange-600 mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          <span>Leads To...</span>
        </div>
        <select
          multiple
          value={node.next}
          onChange={handleNextChange}
          className="w-full h-24 text-xs bg-white border border-gray-200 rounded p-2 focus:border-green-500 focus:outline-none"
        >
          {allNodeIds.filter(id => id !== node.id).map(id => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
        <p className="text-[10px] text-gray-400 mt-1 italic">Hold Ctrl/Cmd to select multiple paths.</p>
      </div>

      {/* Dead End Warning */}
      {node.next.length === 0 && (
        <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
          Warning: This node has no connections (Dead End)
        </div>
      )}
    </div>
  );
};

export default NarrativeNodeCard;
