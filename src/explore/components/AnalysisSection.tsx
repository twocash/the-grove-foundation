// src/explore/components/AnalysisSection.tsx
// Markdown analysis renderer with inline citations
// Sprint: results-display-v1
//
// DEX: Provenance as Infrastructure
// Inline citations [1], [2] link directly to source evidence.

import { useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import type { Citation } from '@core/schema/research-document';
import { InlineCitation } from './CitationBlock';

interface AnalysisSectionProps {
  /** Markdown analysis content */
  analysis: string;
  /** Citations for inline reference links */
  citations: Citation[];
  /** Callback when inline citation is clicked */
  onCitationClick?: (index: number) => void;
}

/**
 * AnalysisSection - Markdown renderer with inline citations
 *
 * Features:
 * - Full markdown rendering (headings, lists, bold, etc.)
 * - Inline citations [1], [2] as superscript links
 * - Clicking citation scrolls to CitationsSection
 * - Clean typography with proper spacing
 */
export function AnalysisSection({
  analysis,
  citations,
  onCitationClick,
}: AnalysisSectionProps) {
  // Process markdown to replace [N] patterns with citation components
  // We'll do this as a post-processing step on rendered text
  const processedAnalysis = useMemo(() => {
    // The citations pattern [1], [2], etc. will be handled by custom components
    return analysis;
  }, [analysis]);

  // Custom scroll handler
  const handleCitationClick = useCallback(
    (index: number) => {
      if (onCitationClick) {
        onCitationClick(index);
      } else {
        // Default: smooth scroll to citation block
        const element = document.getElementById(`citation-${index}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight animation
          element.classList.add('ring-2', 'ring-purple-500', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-purple-500', 'ring-offset-2');
          }, 2000);
        }
      }
    },
    [onCitationClick]
  );

  // Custom components for react-markdown
  const components: Components = useMemo(
    () => ({
      // Custom paragraph to process citation patterns
      p: ({ children }) => {
        const processed = processChildren(children, handleCitationClick, citations);
        return (
          <p className="mb-4 last:mb-0 text-slate-700 dark:text-slate-300 leading-7">
            {processed}
          </p>
        );
      },
      // Headings
      h1: ({ children }) => (
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 mt-6 first:mt-0">
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 mt-5 first:mt-0">
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2 mt-4 first:mt-0">
          {children}
        </h3>
      ),
      // Lists
      ul: ({ children }) => (
        <ul className="list-disc list-outside ml-5 mb-4 space-y-1.5 text-slate-700 dark:text-slate-300">
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol className="list-decimal list-outside ml-5 mb-4 space-y-1.5 text-slate-700 dark:text-slate-300">
          {children}
        </ol>
      ),
      li: ({ children }) => {
        const processed = processChildren(children, handleCitationClick, citations);
        return <li className="leading-7">{processed}</li>;
      },
      // Emphasis
      strong: ({ children }) => (
        <strong className="font-semibold text-slate-900 dark:text-slate-100">
          {children}
        </strong>
      ),
      em: ({ children }) => (
        <em className="italic">{children}</em>
      ),
      // Code
      code: ({ children }) => (
        <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800
                         text-sm font-mono text-slate-800 dark:text-slate-200">
          {children}
        </code>
      ),
      // Blockquote
      blockquote: ({ children }) => (
        <blockquote className="pl-4 border-l-4 border-purple-300 dark:border-purple-700
                               italic text-slate-600 dark:text-slate-400 mb-4">
          {children}
        </blockquote>
      ),
      // Links
      a: ({ href, children }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-600 dark:text-purple-400 hover:underline"
        >
          {children}
        </a>
      ),
    }),
    [handleCitationClick, citations]
  );

  return (
    <div className="prose-container">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-slate-400 text-lg">
          description
        </span>
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
          Analysis
        </h3>
      </div>

      {/* Markdown content */}
      <div className="text-sm leading-7">
        <ReactMarkdown components={components}>
          {processedAnalysis}
        </ReactMarkdown>
      </div>
    </div>
  );
}

/**
 * Process React children to replace [N] citation patterns with InlineCitation components
 */
function processChildren(
  children: React.ReactNode,
  onCitationClick: (index: number) => void,
  citations: Citation[]
): React.ReactNode {
  if (typeof children === 'string') {
    return processTextForCitations(children, onCitationClick, citations);
  }

  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === 'string') {
        return (
          <span key={i}>
            {processTextForCitations(child, onCitationClick, citations)}
          </span>
        );
      }
      return child;
    });
  }

  return children;
}

/**
 * Process text string to replace [N] patterns with InlineCitation components
 */
function processTextForCitations(
  text: string,
  onCitationClick: (index: number) => void,
  citations: Citation[]
): React.ReactNode {
  // Pattern to match [1], [2], etc.
  const citationPattern = /\[(\d+)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = citationPattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const citationIndex = parseInt(match[1], 10);
    // Only render as citation if it exists in our citations array
    const citationExists = citations.some((c) => c.index === citationIndex);

    if (citationExists) {
      parts.push(
        <InlineCitation
          key={`citation-${match.index}-${citationIndex}`}
          index={citationIndex}
          onClick={() => onCitationClick(citationIndex)}
        />
      );
    } else {
      // Not a valid citation, keep as text
      parts.push(match[0]);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : parts;
}

export default AnalysisSection;
