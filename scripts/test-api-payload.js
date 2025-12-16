/**
 * API Payload Size Test Script
 *
 * Purpose: Diagnose 413 "Payload Too Large" errors by testing
 * various payload sizes against the Gemini API.
 *
 * Usage:
 *   node scripts/test-api-payload.js
 *
 * Requires: GEMINI_API_KEY environment variable
 */

import { GoogleGenAI } from '@google/genai';

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash';

if (!API_KEY) {
  console.error('ERROR: GEMINI_API_KEY environment variable not set');
  console.error('Usage: GEMINI_API_KEY=your-key node scripts/test-api-payload.js');
  process.exit(1);
}

// ============================================================================
// TEST DATA - Recreate actual system prompt from Terminal.tsx
// ============================================================================

const SYSTEM_PROMPT_TEMPLATE = `
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
`;

// Simulated knowledge base (abbreviated for testing - actual is ~15KB)
const MOCK_KNOWLEDGE_BASE_SMALL = `
SOURCE MATERIAL: "The Grove" Whitepaper
1. THE STAKES: Big Tech is spending $380B/year on AI infrastructure.
2. CORE THESIS: Frontier capabilities double every 7 months. Local follows with 21-month lag.
3. ARCHITECTURE: Hybrid cognition - local handles routine, cloud handles complex.
`;

// Full knowledge base excerpt (to test realistic payload)
const MOCK_KNOWLEDGE_BASE_FULL = `
SOURCE MATERIAL: "The Grove" Whitepaper & Technical Deep Dive Series (Dec 2025) by Jim Calhoun.

1. THE STAKES: THE $380 BILLION BET
- Big Tech is spending $380B/year to make AI a rented utility.
- The Counter-Bet: Users owning infrastructure aligns incentives.

2. CORE THESIS: THE RATCHET
- Frontier capabilities double every 7 months. Local follows with 21-month lag.
- The Gap: Constant 8x.
- The Floor: Local rises to meet "Routine Cognition".

3. ARCHITECTURE: STAFF, NOT SOFTWARE
- **The Cognitive Split**:
  - "The Constant Hum": Routine cognition runs locally (Free, Private, Fast).
  - "The Breakthrough Moments": Complex analysis routes to Cloud (Paid, Powerful).
  - Key Insight: The agent remembers the cloud insight as their own.
- **The Grove is different**: It runs routine thinking locally.

4. ECONOMICS: A BUSINESS MODEL DESIGNED TO DISAPPEAR
- **Concept**: Progressive taxation in reverse.
- **Mechanism**: The Efficiency Tax. Genesis (30-40%) -> Maturity (3-5%).
- The Grove inverts the traditional extraction model.

5. DIFFERENTIATION: TOOL VS STAFF
- **Existing AI (Renters)**: Stateless. Forgets. Rented. Isolated.
- **The Grove (Owners)**: Persistent. Remembers. Owned. Networked.
- The "Day One" Caveat: ChatGPT is smarter on day one. The Grove is more yours.

6. THE NETWORK: A CIVILIZATION THAT LEARNS
- **Knowledge Commons**: When a village solves a problem, the solution propagates.
- **Diary Newswire**: Breakthroughs documented. Real cognitive history.

7. TECHNICAL ARCHITECTURE REFERENCE (AUTHORITATIVE)
- Grove is a distributed AI workforce handling daily tasks.
- THE EFFICIENCY-ENLIGHTENMENT LOOP
- MEMORY SYSTEM (MemoryStream): Three-tier: Observations, Reflections, Plans.
- HYBRID ARCHITECTURE: Local operations vs Cloud operations.
- THE DIARY SYSTEM: Core engagement hook and proof of work.
- CREDIT ECONOMY: Efficiency Tax Brackets from 30-40% down to 3-5%.
`;

// Simulated RAG context (what comes from /api/context)
const MOCK_RAG_CONTEXT = `
--- SOURCE: grove-whitepaper-summary.md ---
The Grove Foundation presents a vision for distributed AI ownership...

--- SOURCE: technical-architecture.md ---
Architecture notes on hybrid cognition routing between local and cloud...

--- SOURCE: economics-deep-dive.md ---
Detailed analysis of the Efficiency Tax mechanism and credit economy...
`;

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

async function testDirectAPICall(systemPrompt, userMessage, testName) {
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const payloadSize = JSON.stringify({
    systemInstruction: systemPrompt,
    message: userMessage
  }).length;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${testName}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`System Prompt Size: ${systemPrompt.length.toLocaleString()} chars`);
  console.log(`User Message Size: ${userMessage.length.toLocaleString()} chars`);
  console.log(`Estimated Payload: ${payloadSize.toLocaleString()} bytes (~${(payloadSize / 1024).toFixed(2)} KB)`);

  try {
    const startTime = Date.now();

    const chat = ai.chats.create({
      model: MODEL,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage({ message: userMessage });
    const elapsed = Date.now() - startTime;

    console.log(`✅ SUCCESS (${elapsed}ms)`);
    console.log(`Response preview: ${result.text?.substring(0, 100)}...`);
    return { success: true, elapsed, payloadSize };

  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    if (error.message.includes('413') || error.message.includes('Payload Too Large')) {
      console.log(`   → This is the 413 error we're investigating!`);
    }
    return { success: false, error: error.message, payloadSize };
  }
}

async function measurePayloadSizes() {
  console.log('\n📊 PAYLOAD SIZE ANALYSIS');
  console.log('=' .repeat(60));

  const sizes = {
    'System prompt (base)': SYSTEM_PROMPT_TEMPLATE.length,
    'Knowledge base (small)': MOCK_KNOWLEDGE_BASE_SMALL.length,
    'Knowledge base (full)': MOCK_KNOWLEDGE_BASE_FULL.length,
    'RAG context (mock)': MOCK_RAG_CONTEXT.length,
  };

  // Calculate combined sizes
  const fullPromptSmall = SYSTEM_PROMPT_TEMPLATE + '\n\n**KNOWLEDGE BASE:**\n' + MOCK_KNOWLEDGE_BASE_SMALL;
  const fullPromptFull = SYSTEM_PROMPT_TEMPLATE + '\n\n**KNOWLEDGE BASE:**\n' + MOCK_KNOWLEDGE_BASE_FULL;
  const fullPromptWithRAG = fullPromptFull + '\n\n**DYNAMIC KNOWLEDGE BASE:**\n' + MOCK_RAG_CONTEXT;

  sizes['Combined (small KB)'] = fullPromptSmall.length;
  sizes['Combined (full KB)'] = fullPromptFull.length;
  sizes['Combined (full KB + RAG)'] = fullPromptWithRAG.length;

  for (const [name, size] of Object.entries(sizes)) {
    console.log(`${name.padEnd(30)} ${size.toLocaleString().padStart(10)} chars (${(size/1024).toFixed(2)} KB)`);
  }

  return { fullPromptSmall, fullPromptFull, fullPromptWithRAG };
}

async function runTests() {
  console.log('🔬 GROVE API PAYLOAD TEST SUITE');
  console.log('Testing Gemini API with various payload sizes\n');

  // Measure payload sizes first
  const { fullPromptSmall, fullPromptFull, fullPromptWithRAG } = await measurePayloadSizes();

  const testMessage = 'What is The Grove?';
  const results = [];

  // Test 1: Minimal prompt
  results.push(await testDirectAPICall(
    'You are a helpful assistant.',
    testMessage,
    'Minimal System Prompt'
  ));

  // Test 2: Base system prompt only
  results.push(await testDirectAPICall(
    SYSTEM_PROMPT_TEMPLATE,
    testMessage,
    'Base System Prompt (no knowledge base)'
  ));

  // Test 3: With small knowledge base
  results.push(await testDirectAPICall(
    fullPromptSmall,
    testMessage,
    'System Prompt + Small Knowledge Base'
  ));

  // Test 4: With full knowledge base
  results.push(await testDirectAPICall(
    fullPromptFull,
    testMessage,
    'System Prompt + Full Knowledge Base'
  ));

  // Test 5: With full knowledge base + RAG
  results.push(await testDirectAPICall(
    fullPromptWithRAG,
    testMessage,
    'System Prompt + Full KB + RAG Context'
  ));

  // Test 6: Stress test - very large payload
  const veryLargePrompt = fullPromptWithRAG + '\n'.repeat(1000) + MOCK_KNOWLEDGE_BASE_FULL.repeat(3);
  results.push(await testDirectAPICall(
    veryLargePrompt,
    testMessage,
    'STRESS TEST: Very Large Payload (~50KB+)'
  ));

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Passed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Check if payload size correlates with failures.');
    const failedTests = results.filter(r => !r.success);
    const failureSizes = failedTests.map(t => t.payloadSize);
    const minFailSize = Math.min(...failureSizes);
    console.log(`   Smallest failing payload: ~${(minFailSize/1024).toFixed(2)} KB`);
  }

  console.log('\n💡 RECOMMENDATIONS:');
  console.log('   1. If large payloads fail: Move API calls to server-side proxy');
  console.log('   2. Implement context truncation/chunking for RAG content');
  console.log('   3. Use streaming for large responses');
}

// Run the tests
runTests().catch(console.error);
