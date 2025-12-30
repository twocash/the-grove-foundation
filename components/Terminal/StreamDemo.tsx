// components/Terminal/StreamDemo.tsx
// Demo component to test StreamRenderer with motion
// Usage: Import and render this component to see animations

import React, { useState } from 'react';
import { StreamRenderer } from './Stream';
import type { StreamItem } from '../../src/core/schema/stream';

const DEMO_ITEMS: StreamItem[] = [
  {
    id: 'q1',
    type: 'query',
    timestamp: Date.now() - 5000,
    content: 'What is the Ratchet Effect?',
    createdBy: 'user',
    role: 'user'
  },
  {
    id: 'r1',
    type: 'response',
    timestamp: Date.now() - 4000,
    content: 'The **Ratchet Effect** describes how AI capabilities advance in discrete, irreversible steps. Once a capability threshold is crossed, there is no going back. This creates a one-way pressure toward increasingly powerful systems.',
    createdBy: 'ai',
    role: 'assistant',
    isGenerating: false,
    suggestedPaths: [
      { id: 'p1', label: 'Tell me about the 21-month doubling' },
      { id: 'p2', label: 'What are the implications?' }
    ]
  },
  {
    id: 's1',
    type: 'system',
    timestamp: Date.now() - 3000,
    content: 'Journey started: Understanding the Ratchet',
    createdBy: 'system'
  }
];

export function StreamDemo() {
  const [items, setItems] = useState<StreamItem[]>([]);
  const [currentItem, setCurrentItem] = useState<StreamItem | null>(null);

  const addNextItem = () => {
    if (items.length < DEMO_ITEMS.length) {
      const nextItem = DEMO_ITEMS[items.length];
      // Simulate streaming for responses
      if (nextItem.type === 'response') {
        setCurrentItem({ ...nextItem, isGenerating: true });
        setTimeout(() => {
          setCurrentItem(null);
          setItems(prev => [...prev, nextItem]);
        }, 1500);
      } else {
        setItems(prev => [...prev, nextItem]);
      }
    }
  };

  const reset = () => {
    setItems([]);
    setCurrentItem(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex gap-4">
          <button
            onClick={addNextItem}
            disabled={items.length >= DEMO_ITEMS.length}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50 hover:bg-emerald-500 transition-colors"
          >
            Add Message ({items.length}/{DEMO_ITEMS.length})
          </button>
          <button
            onClick={reset}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 min-h-[400px]">
          <StreamRenderer
            items={items}
            currentItem={currentItem}
            onSpanClick={(span) => console.log('Span clicked:', span)}
            onPromptSubmit={(prompt) => console.log('Prompt submitted:', prompt)}
          />

          {items.length === 0 && !currentItem && (
            <p className="text-slate-500 text-center py-8">
              Click "Add Message" to see animations
            </p>
          )}
        </div>

        <div className="mt-6 text-slate-400 text-sm">
          <h3 className="font-semibold text-slate-300 mb-2">What to observe:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Query blocks slide in from the right</li>
            <li>Response blocks slide in from the left</li>
            <li>System blocks fade in subtly</li>
            <li>Suggestion chips stagger in one by one</li>
            <li>Blinking cursor during "generation"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default StreamDemo;
