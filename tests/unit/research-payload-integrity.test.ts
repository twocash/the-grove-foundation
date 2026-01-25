// tests/unit/research-payload-integrity.test.ts
// S22-WP: Verify research payload is not truncated through the system
// The Full Report tab must show the COMPLETE synthesis content

import { describe, it, expect } from 'vitest';
import {
  sproutSynthesisToRenderTree,
  sproutFullReportToRenderTree,
  sproutSourcesToRenderTree,
} from '../../src/surface/components/modals/SproutFinishingRoom/json-render/evidence-transform';
import type { Sprout } from '../../src/core/schema/sprout';

// Canonical research payload from user - represents actual Claude API response
const CANONICAL_SYNTHESIS_CONTENT = `# Research Summary: NVIDIA Rubin and the 10x Inference Improvement

## Executive Summary

NVIDIA's Rubin platform delivers a 10x reduction in inference token costs compared to Blackwell, while requiring 4x fewer GPUs to train mixture-of-experts (MoE) models. This breakthrough reinforces rather than invalidates the capability propagation thesis—historically, frontier improvements at $30,000+ datacenter price points reach consumer-accessible cloud pricing within 18-24 months, suggesting Rubin-class inference economics will democratize agentic AI capabilities by late 2026 or early 2027.

## Key Findings

### The Rubin Platform Performance Claims

The Rubin platform achieves up to 10x reduction in inference token cost and 4x reduction in number of GPUs needed to train MoE models compared to Blackwell. Central to this is the Rubin GPU (R200) with 336 billion transistors delivering 50 Petaflops of NVFP4 compute performance. These advancements enable hardware-accelerated adaptive compression, contributing to the 10x cost reduction per inference token.

NVIDIA is framing the Rubin platform as ideal for agentic AI, advanced reasoning models, and mixture-of-experts (MoE) models. This positions it to make "persistent, always-on AI agents economically viable for the first time, effectively democratizing high-level intelligence at a scale previously thought impossible."

### Historical Capability Propagation Pattern

The Blackwell timeline provides a clear propagation model: Blackwell was officially detailed for consumers at CES 2025 (January 6) with consumer cards arriving by end of month, approximately 6-8 months after datacenter variants. Consumer Blackwell GPUs are now available starting at $299 (RTX 5060) to $429 (RTX 5060 Ti).

Current cloud pricing for B200 GPUs ranges from $6.25/hour on serverless platforms, with breakeven against $6-8/hour cloud rates happening at ~60% utilization over 18 months for $30k cards. This suggests Blackwell's lower cost-per-performance theoretically enables more actors to access massive computing, though early waves are absorbed mainly by Big Tech, with broader accessibility coming as supply catches up.

### METR Capability Tracking Framework

METR's research shows AI task completion ability has been "consistently exponentially increasing over the past 6 years, with a doubling time of around 7 months," with this trend well-predicted by an exponential curve on logarithmic scale. If this trend continues, "frontier AI systems will be capable of autonomously carrying out month-long projects" by decade's end, with AI agents independently completing "a large fraction of software tasks that currently take humans days or weeks."

METR's methodology involves "tracking AI progress over time using the task completion time horizon: the duration of tasks that models can complete at a certain success probability," operationalized as "the X%-(task completion) time horizon–the length of tasks that models can complete approximately X% of the time."

However, there are methodological concerns. Critics argue one could "fit any function" to such sparse, noisy data on a log scale, with "reliance on a small number of tasks for calculating the 50% time horizon of early GPT-4 models" weakening robustness of specific data points.

### GPU Price/Performance Historical Trends

NVIDIA maintains "an aggressive yet predictable hardware release cadence" with "major GPU architectures approximately every 24 months–Ampere (2020), Hopper (2022), Blackwell (2024), Rubin (expected 2026)," plus "enhanced 'Ultra' GPUs within architectural families annually."

Performance per watt has improved across generations: "Ampere A100 delivered more performance at 400W than V100 did at 300W (roughly 3× the throughput for 1.3× power in AI tasks)" while "Hopper H100 at 500W delivered 9× the training speed of A100," and "Blackwell excels in perf-per-watt for large deployments—e.g. 30× the inference performance of H100 for 1/25th the energy in a full rack."

## Market Implications and Hybrid Architecture Opportunities

Rubin systems are "scheduled for the second half of 2026" with "roughly nine months to prepare infrastructure for the transition." For startups, "the 90% drop in token costs means that the 'LLM wrapper' business model is effectively dead," forcing "AI startups to shift focus toward proprietary data flywheels and specialized agentic workflows."

The 10x improvement creates new hybrid architecture possibilities. As frontier inference costs drop dramatically, the economic threshold for routing decisions between local and cloud compute shifts substantially. More complex reasoning operations become viable for cloud processing while simpler tasks can be handled locally.

## Gaps and Areas for Further Research

Several critical areas need deeper investigation:

1. **Non-uniform propagation patterns**: How MoE-specific optimizations propagate versus general inference improvements
2. **Quantization acceleration effects**: Whether techniques like GGML and llama.cpp could accelerate capability propagation to consumer hardware
3. **Economic modeling**: Precise breakeven analysis for hybrid architectures at different capability levels
4. **Regulatory considerations**: How export controls and geopolitical factors might affect propagation timelines

The sparse data points in METR's exponential trend, while compelling, would benefit from additional validation through alternative methodologies and broader task distributions.

## Confidence Assessment

**High confidence (80-90%)**: The basic propagation pattern holds—frontier datacenter capabilities reach consumer-accessible pricing within 18-24 months based on clear historical precedent from Blackwell and previous generations.

**Medium confidence (60-70%)**: The specific 10x improvement claims and 2026-2027 timeline for consumer accessibility, dependent on production scaling and competitive dynamics.

**Low confidence (40-50%)**: METR's exponential doubling pattern continuing unchanged, given methodological concerns and the possibility of architectural or regulatory disruptions.

The research strongly supports the thesis that Rubin accelerates rather than forecloses distributed AI architectures, providing another data point in the capability propagation pattern while creating new opportunities for hybrid local-cloud systems.

---

**Sources:**

[1] NVIDIA Technical Blog - Inside the NVIDIA Rubin Platform
[2] Yahoo Finance - Nvidia launches Vera Rubin at CES 2026
[3] NVIDIA Newsroom - Rubin Platform AI Supercomputer
[4-6] Various financial and technical analyses of Rubin announcement
[11-20] Blackwell consumer accessibility and pricing sources
[21-30] METR capability tracking methodology and findings
[31-40] GPU price/performance historical analysis sources`;

// Mock sprout with canonical research data
function createMockSproutWithResearch(): Sprout {
  return {
    id: 'test-sprout',
    query: 'NVIDIA Rubin 10x inference improvement',
    response: '',
    status: 'captured',
    capturedAt: new Date().toISOString(),
    researchBranches: [
      {
        id: 'branch-main',
        label: 'Main Research',
        status: 'complete',
        queries: ['NVIDIA Rubin'],
        evidence: [
          {
            id: 'ev-source-1',
            source: 'https://developer.nvidia.com/blog/inside-the-nvidia-rubin-platform',
            content: 'Performance and efficiency at scale: How Rubin converts architecture into real gains...',
            metadata: { title: 'Inside the NVIDIA Rubin Platform' },
            relevance: 0.9,
            confidence: 0.9,
            sourceType: 'practitioner',
            collectedAt: new Date().toISOString(),
          },
          {
            id: 'ev-source-2',
            source: 'https://nvidianews.nvidia.com/news/rubin-platform',
            content: 'The Rubin platform harnesses extreme codesign across hardware and software...',
            metadata: { title: 'NVIDIA Rubin Platform' },
            relevance: 0.9,
            confidence: 0.9,
            sourceType: 'practitioner',
            collectedAt: new Date().toISOString(),
          },
          // The synthesis evidence - the FULL research report
          {
            id: 'ev-synthesis',
            source: 'research-synthesis',
            content: CANONICAL_SYNTHESIS_CONTENT,
            relevance: 1,
            confidence: 0.9,
            sourceType: 'practitioner',
            collectedAt: new Date().toISOString(),
          },
        ],
        priority: 'primary',
      },
    ],
    researchEvidence: [
      {
        id: 'ev-source-1',
        source: 'https://developer.nvidia.com/blog/inside-the-nvidia-rubin-platform',
        content: 'Performance and efficiency at scale: How Rubin converts architecture into real gains...',
        metadata: { title: 'Inside the NVIDIA Rubin Platform' },
        relevance: 0.9,
        confidence: 0.9,
        sourceType: 'practitioner',
        collectedAt: new Date().toISOString(),
      },
      {
        id: 'ev-source-2',
        source: 'https://nvidianews.nvidia.com/news/rubin-platform',
        content: 'The Rubin platform harnesses extreme codesign across hardware and software...',
        metadata: { title: 'NVIDIA Rubin Platform' },
        relevance: 0.9,
        confidence: 0.9,
        sourceType: 'practitioner',
        collectedAt: new Date().toISOString(),
      },
      // The synthesis evidence - the FULL research report
      {
        id: 'ev-synthesis',
        source: 'research-synthesis',
        content: CANONICAL_SYNTHESIS_CONTENT,
        relevance: 1,
        confidence: 0.9,
        sourceType: 'practitioner',
        collectedAt: new Date().toISOString(),
      },
    ],
    researchSynthesis: {
      model: 'unknown',
      status: 'complete',
      wordCount: 0,
      documentId: 'doc-test',
      generatedAt: new Date().toISOString(),
    },
  } as unknown as Sprout;
}

describe('S22-WP: Research Payload Integrity', () => {
  const mockSprout = createMockSproutWithResearch();
  const originalContentLength = CANONICAL_SYNTHESIS_CONTENT.length;

  describe('Canonical Content Metrics', () => {
    it('canonical synthesis content is substantial (6000+ chars)', () => {
      console.log(`[PAYLOAD INTEGRITY] Original synthesis content length: ${originalContentLength} chars`);
      expect(originalContentLength).toBeGreaterThan(6000);
    });

    it('canonical content includes all required sections', () => {
      expect(CANONICAL_SYNTHESIS_CONTENT).toContain('## Executive Summary');
      expect(CANONICAL_SYNTHESIS_CONTENT).toContain('## Key Findings');
      expect(CANONICAL_SYNTHESIS_CONTENT).toContain('### The Rubin Platform Performance Claims');
      expect(CANONICAL_SYNTHESIS_CONTENT).toContain('### Historical Capability Propagation Pattern');
      expect(CANONICAL_SYNTHESIS_CONTENT).toContain('### METR Capability Tracking Framework');
      expect(CANONICAL_SYNTHESIS_CONTENT).toContain('### GPU Price/Performance Historical Trends');
      expect(CANONICAL_SYNTHESIS_CONTENT).toContain('## Market Implications');
      expect(CANONICAL_SYNTHESIS_CONTENT).toContain('## Gaps and Areas for Further Research');
      expect(CANONICAL_SYNTHESIS_CONTENT).toContain('## Confidence Assessment');
      expect(CANONICAL_SYNTHESIS_CONTENT).toContain('**Sources:**');
    });
  });

  describe('Full Report Tab - COMPLETE content required', () => {
    it('Full Report tree contains synthesis with FULL content', () => {
      const fullReportTree = sproutFullReportToRenderTree(mockSprout);

      expect(fullReportTree).not.toBeNull();

      // Find SynthesisBlock elements
      const synthesisBlocks = fullReportTree!.children.filter(
        (el) => el.type === 'SynthesisBlock'
      );

      console.log(`[FULL REPORT] Found ${synthesisBlocks.length} SynthesisBlock element(s)`);
      expect(synthesisBlocks.length).toBeGreaterThan(0);

      // Get the content from synthesis block(s)
      const fullReportContent = synthesisBlocks
        .map((block) => (block.props as { content: string }).content)
        .join('\n');

      console.log(`[FULL REPORT] Total content length: ${fullReportContent.length} chars`);
      console.log(`[FULL REPORT] Original length: ${originalContentLength} chars`);
      console.log(`[FULL REPORT] Ratio: ${(fullReportContent.length / originalContentLength * 100).toFixed(1)}%`);

      // CRITICAL: Full Report must contain 95%+ of original content
      expect(fullReportContent.length).toBeGreaterThanOrEqual(originalContentLength * 0.95);

      // Must contain all major sections
      expect(fullReportContent).toContain('## Key Findings');
      expect(fullReportContent).toContain('## Market Implications');
      expect(fullReportContent).toContain('## Confidence Assessment');
    });

    it('Full Report includes detailed Key Findings subsections', () => {
      const fullReportTree = sproutFullReportToRenderTree(mockSprout);
      const synthesisBlocks = fullReportTree!.children.filter(
        (el) => el.type === 'SynthesisBlock'
      );
      const fullContent = synthesisBlocks
        .map((block) => (block.props as { content: string }).content)
        .join('\n');

      // All Key Findings subsections must be present
      expect(fullContent).toContain('### The Rubin Platform Performance Claims');
      expect(fullContent).toContain('### Historical Capability Propagation Pattern');
      expect(fullContent).toContain('### METR Capability Tracking Framework');
      expect(fullContent).toContain('### GPU Price/Performance Historical Trends');
    });
  });

  describe('Summary Tab - Executive Summary ONLY', () => {
    it('Summary tree contains ONLY executive summary section', () => {
      const summaryTree = sproutSynthesisToRenderTree(mockSprout);

      expect(summaryTree).not.toBeNull();

      const synthesisBlocks = summaryTree!.children.filter(
        (el) => el.type === 'SynthesisBlock'
      );

      expect(synthesisBlocks.length).toBeGreaterThan(0);

      const summaryContent = synthesisBlocks
        .map((block) => (block.props as { content: string }).content)
        .join('\n');

      console.log(`[SUMMARY] Summary content length: ${summaryContent.length} chars`);
      console.log(`[SUMMARY] Original length: ${originalContentLength} chars`);
      console.log(`[SUMMARY] Ratio: ${(summaryContent.length / originalContentLength * 100).toFixed(1)}%`);

      // Summary should be MUCH shorter than full report (< 30% of original)
      expect(summaryContent.length).toBeLessThan(originalContentLength * 0.30);

      // Summary should contain Executive Summary
      expect(summaryContent).toContain('Executive Summary');

      // Summary should NOT contain later sections
      expect(summaryContent).not.toContain('## Key Findings');
      expect(summaryContent).not.toContain('## Market Implications');
      expect(summaryContent).not.toContain('## Confidence Assessment');
    });
  });

  describe('Sources Tab - Source cards ONLY', () => {
    it('Sources tree contains source cards, NOT synthesis', () => {
      const sourcesTree = sproutSourcesToRenderTree(mockSprout);

      expect(sourcesTree).not.toBeNull();

      // Should have SourceCard elements
      const sourceCards = sourcesTree!.children.filter(
        (el) => el.type === 'SourceCard'
      );

      console.log(`[SOURCES] Found ${sourceCards.length} SourceCard element(s)`);
      expect(sourceCards.length).toBeGreaterThan(0);

      // Should NOT have SynthesisBlock elements
      const synthesisBlocks = sourcesTree!.children.filter(
        (el) => el.type === 'SynthesisBlock'
      );

      expect(synthesisBlocks.length).toBe(0);
    });

    it('Sources tab shows URL sources, not research-synthesis', () => {
      const sourcesTree = sproutSourcesToRenderTree(mockSprout);
      const sourceCards = sourcesTree!.children.filter(
        (el) => el.type === 'SourceCard'
      );

      // All source cards should have actual URLs, not 'research-synthesis'
      for (const card of sourceCards) {
        const url = (card.props as { url: string }).url;
        expect(url).not.toBe('research-synthesis');
        expect(url).toMatch(/^https?:\/\//);
      }
    });
  });

  describe('Content Length Comparison: Summary vs Full Report', () => {
    it('Full Report content is significantly longer than Summary', () => {
      const fullReportTree = sproutFullReportToRenderTree(mockSprout);
      const summaryTree = sproutSynthesisToRenderTree(mockSprout);

      const fullReportBlocks = fullReportTree!.children.filter(el => el.type === 'SynthesisBlock');
      const summaryBlocks = summaryTree!.children.filter(el => el.type === 'SynthesisBlock');

      const fullReportLength = fullReportBlocks
        .map(b => (b.props as { content: string }).content.length)
        .reduce((a, b) => a + b, 0);

      const summaryLength = summaryBlocks
        .map(b => (b.props as { content: string }).content.length)
        .reduce((a, b) => a + b, 0);

      console.log(`[COMPARISON] Full Report: ${fullReportLength} chars`);
      console.log(`[COMPARISON] Summary: ${summaryLength} chars`);
      console.log(`[COMPARISON] Full Report is ${(fullReportLength / summaryLength).toFixed(1)}x longer`);

      // Full Report should be at least 3x longer than Summary
      expect(fullReportLength).toBeGreaterThan(summaryLength * 3);
    });
  });
});
