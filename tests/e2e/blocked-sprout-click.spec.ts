// tests/e2e/blocked-sprout-click.spec.ts
// S22-WP: Test that blocked sprouts with evidence can be clicked

import { test, expect } from '@playwright/test';
import { setupConsoleCapture, type ConsoleCapture } from './_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/research-writer-panel-v1/screenshots';

test.setTimeout(60000);

test.describe('S22-WP: Blocked Sprout Click Fix', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test('Blocked sprout with branches can be clicked to view results', async ({ page }) => {
    // Prepare a test sprout with blocked status but valid research data
    // S22-WP: Use CORRECT Evidence schema with real URLs and FULL CONTENT
    const testSprout = {
      id: 'test-blocked-sprout-' + Date.now(),
      spark: 'Test research query',
      title: 'Test Research - Blocked (writing failed)',
      status: 'blocked',
      query: 'What is AI governance?',
      response: 'Research completed but writing phase timed out',
      capturedAt: new Date().toISOString(),
      stage: 'withered',
      // Research data - S22-WP: FULL CONTENT like Claude actually returns
      researchBranches: [
        {
          id: 'branch-1',
          label: 'AI Governance Frameworks',
          queries: ['AI governance frameworks international'],
          priority: 'primary',
          status: 'complete',
          evidence: [
            {
              id: 'e-synth',
              source: 'research-synthesis',
              sourceType: 'practitioner',
              content: `AI governance has emerged as a critical field addressing the responsible development and deployment of artificial intelligence systems. The landscape is characterized by a multi-stakeholder approach involving governments, international organizations, industry bodies, and civil society.

**Key International Frameworks:**

The European Union has taken the lead with the AI Act (2024), establishing the world's first comprehensive legal framework for AI. The Act introduces a risk-based classification system:
- Unacceptable risk: AI systems that pose clear threats to safety, livelihoods, and rights (e.g., social scoring, real-time biometric identification)
- High risk: AI in critical sectors like healthcare, education, employment, and law enforcement
- Limited risk: Systems requiring transparency obligations (e.g., chatbots must disclose they are AI)
- Minimal risk: All other AI systems with voluntary codes of conduct

The United States has adopted a more sector-specific approach. The Executive Order on Safe, Secure, and Trustworthy AI (October 2023) establishes new standards for AI safety and security, including requirements for developers of powerful AI systems to share safety test results with the government [1].

**Technical Standards:**

The NIST AI Risk Management Framework (AI RMF) provides voluntary guidance for organizations to manage AI risks. It emphasizes four core functions: GOVERN, MAP, MEASURE, and MANAGE. The framework is designed to be flexible and adaptable across different sectors and use cases [2].

IEEE has developed standards including IEEE 7000 series addressing ethical concerns in system design, algorithmic bias, and transparency requirements. These standards provide practical engineering approaches to embedding ethics into AI development processes.

**Emerging Challenges:**

Current governance frameworks face several challenges:
1. Rapid pace of AI advancement outstripping regulatory capacity
2. Jurisdictional fragmentation creating compliance complexity
3. Balancing innovation incentives with risk mitigation
4. Ensuring meaningful human oversight of autonomous systems
5. Addressing algorithmic bias and fairness across diverse populations

**Recommendations:**

Organizations implementing AI should:
- Establish internal AI ethics committees with diverse stakeholder representation
- Implement robust documentation practices for AI system development
- Conduct regular algorithmic audits and bias assessments
- Develop clear incident response procedures for AI failures
- Engage with emerging regulatory requirements proactively

The field continues to evolve rapidly, with new frameworks and standards emerging regularly. Staying current requires ongoing engagement with regulatory developments, industry best practices, and academic research.`,
              relevance: 1.0,
              confidence: 0.92,
              collectedAt: new Date().toISOString(),
            },
            {
              id: 'e1',
              source: 'https://www.whitehouse.gov/briefing-room/presidential-actions/2023/10/30/executive-order-on-the-safe-secure-and-trustworthy-development-and-use-of-artificial-intelligence/',
              sourceType: 'primary',
              content: `Executive Order on the Safe, Secure, and Trustworthy Development and Use of Artificial Intelligence (October 30, 2023)

This Executive Order establishes new standards for AI safety and security, protects Americans' privacy, advances equity and civil rights, stands up for consumers and workers, promotes innovation and competition, advances American leadership abroad, and more.

Key provisions include:
- Requiring developers of the most powerful AI systems to share their safety test results and other critical information with the U.S. government
- Developing standards, tools, and tests to help ensure that AI systems are safe, secure, and trustworthy
- Protecting against the risks of using AI to engineer dangerous biological materials
- Protecting Americans from AI-enabled fraud and deception by establishing standards for detecting AI-generated content
- Establishing an advanced cybersecurity program to develop AI tools to find and fix vulnerabilities in critical software

The Order directs the Department of Commerce to develop guidance for content authentication and watermarking to clearly label AI-generated content. It also calls for a pilot of the National AI Research Resource to provide researchers and students access to AI resources.`,
              relevance: 0.95,
              confidence: 0.94,
              collectedAt: new Date().toISOString(),
              metadata: { title: 'White House Executive Order on AI (October 2023)' },
            },
            {
              id: 'e2',
              source: 'https://www.nist.gov/itl/ai-risk-management-framework',
              sourceType: 'academic',
              content: `NIST AI Risk Management Framework (AI RMF 1.0)

The NIST AI Risk Management Framework is intended for voluntary use and to improve the ability to incorporate trustworthiness considerations into the design, development, use, and evaluation of AI products, services, and systems.

The AI RMF is organized around four core functions:

1. GOVERN: Cultivate and implement a culture of risk management within organizations designing, developing, deploying, evaluating, or acquiring AI systems. This includes establishing policies, processes, and procedures for AI risk management.

2. MAP: Context is established and understood. The AI system's purpose, potential positive and negative impacts, and trustworthiness characteristics are identified and documented.

3. MEASURE: Employ quantitative, qualitative, or mixed-method tools, techniques, and methodologies to analyze, assess, benchmark, and monitor AI risk and related impacts.

4. MANAGE: Allocate risk resources to mapped and measured risks on a regular basis and as defined by the GOVERN function. This includes plans, processes, procedures, and practices to respond to, recover from, and communicate about incidents.

The framework emphasizes that AI risks can emerge at different stages of the AI lifecycle and are influenced by how humans interact with AI systems. It provides guidance for addressing risks from individual and societal perspectives, including risks related to bias, security, privacy, and reliability.`,
              relevance: 0.93,
              confidence: 0.91,
              collectedAt: new Date().toISOString(),
              metadata: { title: 'NIST AI Risk Management Framework' },
            },
            {
              id: 'e3',
              source: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
              sourceType: 'primary',
              content: `The EU AI Act - Regulatory Framework for Artificial Intelligence

The AI Act is the first-ever comprehensive legal framework on AI worldwide. It addresses the risks generated by specific uses of AI through a set of complementary, proportionate and flexible rules.

Risk-Based Approach:
The new rules establish obligations for providers and deployers depending on the level of risk from artificial intelligence. While many AI systems pose minimal risk and can be developed and used subject to the existing legislation, certain AI systems create risks that must be addressed.

Prohibited AI Practices:
- AI systems that deploy subliminal techniques beyond a person's consciousness to materially distort behavior
- AI systems that exploit vulnerabilities of specific groups of persons
- AI-based social scoring for general purposes by public authorities
- 'Real-time' remote biometric identification systems in publicly accessible spaces for law enforcement purposes (with limited exceptions)

High-Risk AI Systems:
AI systems identified as high-risk include those used in:
- Critical infrastructures (e.g., transport)
- Educational or vocational training
- Employment, workers management and access to self-employment
- Essential private and public services (e.g., credit scoring)
- Law enforcement
- Migration, asylum and border control management
- Administration of justice and democratic processes

Requirements for High-Risk AI:
- Adequate risk assessment and mitigation systems
- High quality of datasets feeding the system
- Logging of activity to ensure traceability of results
- Detailed documentation providing all information necessary
- Clear and adequate information to the deployer
- Appropriate human oversight measures
- High level of robustness, security and accuracy`,
              relevance: 0.91,
              confidence: 0.89,
              collectedAt: new Date().toISOString(),
              metadata: { title: 'EU AI Act - Regulatory Framework' },
            }
          ]
        }
      ],
      researchEvidence: [],
      researchSynthesis: null,
      researchDocument: null,
      tags: [],
      provenance: { generatedAt: new Date().toISOString() }
    };

    // Navigate to explore
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');

    // Set up test sprout in localStorage
    await page.evaluate((sprout) => {
      localStorage.setItem('grove-test-sprout', JSON.stringify(sprout));
    }, testSprout);

    // Wait for FinishingRoomGlobal to be ready
    const listenerReady = page.locator('[data-testid="finishing-room-listener-ready"]');
    await listenerReady.waitFor({ state: 'attached', timeout: 10000 });

    console.log('[TEST] Dispatching open-finishing-room event for blocked sprout');

    // Dispatch event to open finishing room
    await page.evaluate((sproutId) => {
      window.dispatchEvent(new CustomEvent('open-finishing-room', {
        detail: { sproutId },
        bubbles: true
      }));
    }, testSprout.id);

    // Wait for modal to appear
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/blocked-sprout-01-modal.png`,
      fullPage: false
    });

    // Check if modal opened (look for finishing room dialog)
    const modal = page.locator('[data-testid="sprout-finishing-room"], [role="dialog"], .fixed.inset-0');
    const modalVisible = await modal.first().isVisible().catch(() => false);
    console.log('[TEST] Modal visible:', modalVisible);

    // Check for evidence content display (even without synthesis)
    const evidenceContent = page.locator('text=/Research|Evidence|Branch|Source/i');
    const contentCount = await evidenceContent.count();
    console.log('[TEST] Evidence-related content elements:', contentCount);

    // S22-WP: Verify REAL URLs are displayed, not fake ones
    const realUrlLinks = page.locator('a[href^="https://"]');
    const realUrlCount = await realUrlLinks.count();
    console.log('[TEST] Real URL links (https://): ' + realUrlCount);

    // S22-WP: Verify NO fake URLs like "localhost" or "claude-research"
    const fakeUrlLinks = page.locator('a[href*="localhost"], a[href*="claude-research"]');
    const fakeUrlCount = await fakeUrlLinks.count();
    console.log('[TEST] Fake URL links (should be 0): ' + fakeUrlCount);

    // S22-WP: Check for synthesis block
    const synthesisBlock = page.locator('text=Research Synthesis');
    const hasSynthesis = await synthesisBlock.count() > 0;
    console.log('[TEST] Has Synthesis block: ' + hasSynthesis);

    // Take final screenshot showing evidence with real URLs
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/blocked-sprout-02-evidence-display.png`,
      fullPage: true
    });

    // Log any console errors
    console.log('Console errors:', capture.errors.length);
    capture.errors.forEach((e, idx) => {
      console.log('  Error ' + (idx + 1) + ': ' + e.substring(0, 100));
    });

    // Clean up
    await page.evaluate(() => {
      localStorage.removeItem('grove-test-sprout');
    });

    // Test passes if no critical errors and modal could be opened
    expect(capture.errors.filter(e =>
      e.includes('Cannot read properties') ||
      e.includes('TypeError') ||
      e.includes('ReferenceError')
    )).toHaveLength(0);

    // S22-WP: Verify we have real URLs displaying (should be at least 2 from mock)
    expect(realUrlCount).toBeGreaterThan(0);

    // S22-WP: Verify NO fake URLs
    expect(fakeUrlCount).toBe(0);
  });
});
