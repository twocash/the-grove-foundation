// src/explore/ResultsDisplayDemo.tsx
// Demo page for Results Display components
// Sprint: results-display-v1
//
// This page renders the Results Display components with mock data
// for visual testing and screenshots.

import { useState } from 'react';
import { ResearchResultsView } from './components/ResearchResultsView';
import {
  createMockResearchDocument,
  createMockPartialDocument,
  createMockInsufficientDocument,
} from './mocks/mock-research-document';

type DemoMode = 'complete' | 'partial' | 'insufficient';

export function ResultsDisplayDemo() {
  const [mode, setMode] = useState<DemoMode>('complete');

  // Get document based on mode
  const document = (() => {
    switch (mode) {
      case 'partial':
        return createMockPartialDocument();
      case 'insufficient':
        return createMockInsufficientDocument();
      default:
        return createMockResearchDocument();
    }
  })();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Demo Controls */}
      <div className="sticky top-0 z-50 bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold text-purple-400">
            Results Display Demo
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('complete')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                mode === 'complete'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Complete
            </button>
            <button
              onClick={() => setMode('partial')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                mode === 'partial'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Partial
            </button>
            <button
              onClick={() => setMode('insufficient')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                mode === 'insufficient'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Insufficient
            </button>
          </div>
        </div>
      </div>

      {/* Results View Container */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <ResearchResultsView
            document={document}
            onBack={() => alert('Back button clicked')}
            onCopy={() => console.log('Document copied')}
          />
        </div>
      </div>

      {/* Debug Info */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <details className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-400">
            Debug: Document JSON
          </summary>
          <pre className="mt-4 text-xs text-slate-500 overflow-auto max-h-64">
            {JSON.stringify(document, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

export default ResultsDisplayDemo;
