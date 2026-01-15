// src/explore/mocks/mock-research-document.ts
// Mock ResearchDocument for development and testing
// Sprint: results-display-v1
//
// @deprecated Use sprout.researchDocument or sproutToResearchDocument() instead.
// This mock was replaced in results-wiring-v1 sprint.
// Kept for test fixtures and ResultsDisplayDemo component.
//
// This generates realistic mock data for the Results Display components.

import type { ResearchDocument, Citation } from '@core/schema/research-document';
import { createResearchDocument, createInsufficientEvidenceDocument } from '@core/schema/research-document';

/**
 * Generate a mock ResearchDocument for testing
 */
export function createMockResearchDocument(
  query: string = 'What is the current state of quantum computing in 2024?',
  options: {
    status?: ResearchDocument['status'];
    confidenceScore?: number;
    citationCount?: number;
  } = {}
): ResearchDocument {
  const {
    status = 'complete',
    confidenceScore = 0.85,
    citationCount = 4,
  } = options;

  if (status === 'insufficient-evidence') {
    return createInsufficientEvidenceDocument(
      `doc-mock-${Date.now().toString(36)}`,
      `bundle-mock-${Date.now().toString(36)}`,
      query
    );
  }

  const mockCitations = generateMockCitations(citationCount);

  const mockAnalysis = `
## Overview

Quantum computing has made significant strides in recent years, with several major developments pushing the field closer to practical applications [1]. This analysis examines the current landscape, key players, and remaining challenges.

## Current State

### Hardware Developments

Major tech companies have achieved important milestones:

- **Google** demonstrated quantum supremacy with their Sycamore processor [1]
- **IBM** has released quantum processors with increasing qubit counts [2]
- **Ionq** and other startups are exploring alternative approaches [3]

### Error Correction

One of the most significant challenges remains **quantum error correction**. Current systems are still considered "noisy intermediate-scale quantum" (NISQ) devices [2]. Key findings:

- Error rates have decreased but remain too high for many practical applications
- Surface codes and other error correction schemes show promise
- Fault-tolerant quantum computing is still several years away

## Challenges

Despite progress, several key challenges remain:

1. **Decoherence**: Qubits lose their quantum state quickly
2. **Scalability**: Adding more qubits increases complexity exponentially
3. **Cost**: Quantum computers require extreme cooling and shielding [4]

## Applications

Near-term applications include:

- **Optimization problems** in logistics and finance
- **Drug discovery** through molecular simulation
- **Cryptography** and security applications

However, the promised "quantum advantage" for practical problems remains elusive for most use cases.

## Conclusion

While quantum computing has made remarkable progress, the technology is still in its early stages. The field is evolving rapidly, with new breakthroughs announced regularly. However, expectations should be tempered – truly transformative quantum applications are likely still 5-10 years away for most industries.
`.trim();

  return createResearchDocument(
    `doc-mock-${Date.now().toString(36)}`,
    `bundle-mock-${Date.now().toString(36)}`,
    query,
    'Quantum computing has achieved notable milestones but remains in early developmental stages, with practical, large-scale applications still several years away.',
    mockAnalysis,
    mockCitations,
    confidenceScore,
    status === 'partial' ? 'Some sources were unavailable or behind paywalls, limiting the depth of analysis in certain areas.' : undefined
  );
}

/**
 * Generate mock citations
 */
function generateMockCitations(count: number): Citation[] {
  const citationPool: Omit<Citation, 'index'>[] = [
    {
      title: 'Google Achieves Quantum Supremacy',
      url: 'https://blog.google/technology/ai/quantum-supremacy-milestone/',
      snippet: 'Our Sycamore processor took about 200 seconds to sample one instance of a quantum circuit a million times—our benchmarks currently indicate that the equivalent task for a state-of-the-art classical supercomputer would take approximately 10,000 years.',
      domain: 'blog.google',
      accessedAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    },
    {
      title: 'IBM Quantum Network Expands Access',
      url: 'https://research.ibm.com/quantum-computing',
      snippet: 'IBM Quantum offers cloud-based access to the most advanced quantum computers available. Users can explore and prototype on IBM Quantum Composer and Qiskit, then run on systems with 127+ qubits.',
      domain: 'research.ibm.com',
      accessedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    },
    {
      title: 'IonQ: Trapped Ion Quantum Computing',
      url: 'https://ionq.com/technology',
      snippet: 'IonQ uses trapped ion technology, which offers longer coherence times and higher gate fidelities compared to superconducting approaches. Our systems have achieved industry-leading performance metrics.',
      domain: 'ionq.com',
      accessedAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    },
    {
      title: 'The Quantum Computing Market Report 2024',
      url: 'https://www.nature.com/articles/quantum-market-analysis',
      snippet: 'The global quantum computing market is projected to grow from $866 million in 2023 to $4.375 billion by 2028, at a CAGR of 38.3%. Key growth drivers include increased government funding and enterprise adoption.',
      domain: 'nature.com',
      accessedAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    },
    {
      title: 'Quantum Error Correction: Progress and Prospects',
      url: 'https://arxiv.org/abs/quantum-error-correction',
      snippet: 'Recent advances in quantum error correction have demonstrated the possibility of extending qubit coherence times by orders of magnitude. Surface codes remain the leading candidate for large-scale fault tolerance.',
      domain: 'arxiv.org',
      accessedAt: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
    },
    {
      title: 'Wikipedia: Quantum Computing',
      url: 'https://en.wikipedia.org/wiki/Quantum_computing',
      snippet: 'Quantum computing is a type of computation that harnesses the collective properties of quantum states, such as superposition, interference, and entanglement, to perform calculations.',
      domain: 'wikipedia.org',
      accessedAt: new Date(Date.now() - 518400000).toISOString(), // 6 days ago
    },
  ];

  return citationPool.slice(0, count).map((citation, index) => ({
    ...citation,
    index: index + 1,
  }));
}

/**
 * Generate a mock document with minimal content (for compact views)
 */
export function createMockMinimalDocument(): ResearchDocument {
  return createMockResearchDocument(
    'What is the capital of France?',
    {
      confidenceScore: 0.95,
      citationCount: 1,
    }
  );
}

/**
 * Generate a mock document with partial status
 */
export function createMockPartialDocument(): ResearchDocument {
  return createMockResearchDocument(
    'What are the latest developments in fusion energy?',
    {
      status: 'partial',
      confidenceScore: 0.6,
      citationCount: 2,
    }
  );
}

/**
 * Generate a mock document with insufficient evidence
 */
export function createMockInsufficientDocument(): ResearchDocument {
  return createMockResearchDocument(
    'What is the secret recipe for Coca-Cola?',
    {
      status: 'insufficient-evidence',
      confidenceScore: 0,
      citationCount: 0,
    }
  );
}
