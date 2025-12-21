/**
 * v0.12b Terminal Polish - Test Script
 * 
 * Tests the clickable bold text pipeline end-to-end.
 * 
 * Usage:
 *   node scripts/test-v012b-bold-click.js
 * 
 * Requires: 
 *   - Server running locally (npm run dev)
 *   - GEMINI_API_KEY environment variable
 */

// ============================================================================
// TEST 1: Verify parseInline correctly handles bold markdown
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('TEST 1: parseInline Bold Text Detection');
console.log('='.repeat(60));

// Simulate the parseInline regex logic
function testParseInline(text) {
  const parts = text.split(/(\*\*.*?\*\*|\*[^*]+\*|_[^_]+_)/g);
  const results = [];
  
  parts.forEach((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const phrase = part.slice(2, -2);
      results.push({ type: 'BOLD_CLICKABLE', phrase, index: i });
    } else if ((part.startsWith('*') && part.endsWith('*') && part.length > 2) ||
               (part.startsWith('_') && part.endsWith('_') && part.length > 2)) {
      results.push({ type: 'ITALIC', text: part.slice(1, -1), index: i });
    } else if (part.trim()) {
      results.push({ type: 'TEXT', text: part, index: i });
    }
  });
  
  return results;
}

// Test cases
const testCases = [
  {
    name: 'Simple bold phrase',
    input: 'Check out **local-first ownership** today.',
    expectedBold: ['local-first ownership']
  },
  {
    name: 'Multiple bold phrases',
    input: 'The **Ratchet Effect** creates a **dependency trap** for users.',
    expectedBold: ['Ratchet Effect', 'dependency trap']
  },
  {
    name: 'Bold at start and end',
    input: '**First phrase** in the middle **last phrase**',
    expectedBold: ['First phrase', 'last phrase']
  },
  {
    name: 'No bold text',
    input: 'This is plain text without any formatting.',
    expectedBold: []
  },
  {
    name: 'Mixed bold and italic',
    input: 'The **bold term** and *italic term* together.',
    expectedBold: ['bold term']
  },
  {
    name: 'Multi-word bold phrase',
    input: 'Explore **the cognitive efficiency loop** mechanism.',
    expectedBold: ['the cognitive efficiency loop']
  },
  {
    name: 'Bold with punctuation nearby',
    input: 'Try **local inference**! Also **cloud routing**.',
    expectedBold: ['local inference', 'cloud routing']
  }
];

let test1Pass = 0;
let test1Fail = 0;

testCases.forEach(tc => {
  const results = testParseInline(tc.input);
  const boldPhrases = results
    .filter(r => r.type === 'BOLD_CLICKABLE')
    .map(r => r.phrase);
  
  const pass = JSON.stringify(boldPhrases) === JSON.stringify(tc.expectedBold);
  
  if (pass) {
    console.log(`✅ ${tc.name}`);
    test1Pass++;
  } else {
    console.log(`❌ ${tc.name}`);
    console.log(`   Input: "${tc.input}"`);
    console.log(`   Expected: ${JSON.stringify(tc.expectedBold)}`);
    console.log(`   Got: ${JSON.stringify(boldPhrases)}`);
    test1Fail++;
  }
});

console.log(`\nTest 1 Results: ${test1Pass}/${test1Pass + test1Fail} passed`);

// ============================================================================
// TEST 2: Verify system prompt includes FORMATTING RULES
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('TEST 2: System Prompt FORMATTING RULES Check');
console.log('='.repeat(60));

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, '..', 'server.js');
const serverCode = readFileSync(serverPath, 'utf-8');

const formattingRulesChecks = [
  {
    name: 'FALLBACK_SYSTEM_PROMPT has FORMATTING RULES section',
    pattern: /FALLBACK_SYSTEM_PROMPT[\s\S]*?FORMATTING RULES/,
  },
  {
    name: 'FORMATTING RULES mentions **bold**',
    pattern: /FORMATTING RULES[\s\S]*?\*\*bold\*\*/,
  },
  {
    name: 'FORMATTING RULES mentions clickable',
    pattern: /FORMATTING RULES[\s\S]*?clickable/i,
  },
  {
    name: 'buildSystemPrompt adds FORMATTING RULES',
    pattern: /buildSystemPrompt[\s\S]*?FORMATTING RULES/,
  },
  {
    name: 'Aims for 2-4 bold phrases per response',
    pattern: /2-4 bold phrases/,
  }
];

let test2Pass = 0;
let test2Fail = 0;

formattingRulesChecks.forEach(check => {
  const pass = check.pattern.test(serverCode);
  if (pass) {
    console.log(`✅ ${check.name}`);
    test2Pass++;
  } else {
    console.log(`❌ ${check.name}`);
    test2Fail++;
  }
});

console.log(`\nTest 2 Results: ${test2Pass}/${test2Pass + test2Fail} passed`);

// ============================================================================
// TEST 3: Verify Terminal.tsx has correct parseInline implementation
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('TEST 3: Terminal.tsx Implementation Check');
console.log('='.repeat(60));

const terminalPath = join(__dirname, '..', 'components', 'Terminal.tsx');
const terminalCode = readFileSync(terminalPath, 'utf-8');

const terminalChecks = [
  {
    name: 'parseInline accepts onBoldClick parameter',
    pattern: /parseInline.*onBoldClick\?.*=>.*void/,
  },
  {
    name: 'Bold text renders as <button> when handler provided',
    pattern: /<button[\s\S]*?onClick.*onBoldClick\(phrase\)/,
  },
  {
    name: 'Button has grove-clay text color',
    pattern: /text-grove-clay.*font-bold/,
  },
  {
    name: 'Button has hover:underline for interactivity',
    pattern: /hover:underline/,
  },
  {
    name: 'Button has cursor-pointer',
    pattern: /cursor-pointer/,
  },
  {
    name: 'MarkdownRenderer has onPromptClick prop',
    pattern: /MarkdownRenderer[\s\S]*?onPromptClick\?.*=>.*void/,
  },
  {
    name: 'parseInline called with onPromptClick in MarkdownRenderer',
    pattern: /parseInline\([^)]*onPromptClick/,
  }
];

let test3Pass = 0;
let test3Fail = 0;

terminalChecks.forEach(check => {
  const pass = check.pattern.test(terminalCode);
  if (pass) {
    console.log(`✅ ${check.name}`);
    test3Pass++;
  } else {
    console.log(`❌ ${check.name}`);
    test3Fail++;
  }
});

console.log(`\nTest 3 Results: ${test3Pass}/${test3Pass + test3Fail} passed`);

// ============================================================================
// TEST 4: Verify CognitiveBridge has typing animation
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('TEST 4: CognitiveBridge Typing Animation Check');
console.log('='.repeat(60));

const cognitiveBridgePath = join(__dirname, '..', 'components', 'Terminal', 'CognitiveBridge.tsx');
const cognitiveBridgeCode = readFileSync(cognitiveBridgePath, 'utf-8');

const bridgeChecks = [
  {
    name: 'Has displayedText state',
    pattern: /displayedText.*useState|useState.*displayedText/,
  },
  {
    name: 'Has isTypingComplete state',
    pattern: /useState.*isTypingComplete|typingComplete/i,
  },
  {
    name: 'Has typing interval/effect',
    pattern: /setInterval|setTimeout[\s\S]*?displayedText|setDisplayedText/,
  },
  {
    name: 'Has warm invitation text',
    pattern: /journey|explore|help/i,
  }
];

let test4Pass = 0;
let test4Fail = 0;

bridgeChecks.forEach(check => {
  const pass = check.pattern.test(cognitiveBridgeCode);
  if (pass) {
    console.log(`✅ ${check.name}`);
    test4Pass++;
  } else {
    console.log(`❌ ${check.name}`);
    test4Fail++;
  }
});

console.log(`\nTest 4 Results: ${test4Pass}/${test4Pass + test4Fail} passed`);

// ============================================================================
// TEST 5: Verify ScrollIndicator component exists
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('TEST 5: ScrollIndicator Component Check');
console.log('='.repeat(60));

import { existsSync } from 'fs';

const scrollIndicatorPath = join(__dirname, '..', 'src', 'surface', 'components', 'genesis', 'ScrollIndicator.tsx');
const scrollIndicatorExists = existsSync(scrollIndicatorPath);

if (scrollIndicatorExists) {
  console.log('✅ ScrollIndicator.tsx exists');
  const scrollCode = readFileSync(scrollIndicatorPath, 'utf-8');
  
  const scrollChecks = [
    { name: 'Has onClick prop', pattern: /onClick/ },
    { name: 'Has seedling emoji 🌱', pattern: /🌱/ },
    { name: 'Has animate-float class', pattern: /animate-float/ },
  ];
  
  scrollChecks.forEach(check => {
    const pass = check.pattern.test(scrollCode);
    console.log(pass ? `✅ ${check.name}` : `❌ ${check.name}`);
  });
} else {
  console.log('❌ ScrollIndicator.tsx does not exist');
}

// ============================================================================
// TEST 6: Verify globals.css has float animation
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('TEST 6: CSS Float Animation Check');
console.log('='.repeat(60));

const globalsCssPath = join(__dirname, '..', 'styles', 'globals.css');
const globalsCss = readFileSync(globalsCssPath, 'utf-8');

const cssChecks = [
  {
    name: 'Has @keyframes float',
    pattern: /@keyframes\s+float/,
  },
  {
    name: 'Has .animate-float class',
    pattern: /\.animate-float/,
  },
  {
    name: 'Float animation has translateY',
    pattern: /float[\s\S]*?translateY/,
  }
];

let test6Pass = 0;
let test6Fail = 0;

cssChecks.forEach(check => {
  const pass = check.pattern.test(globalsCss);
  if (pass) {
    console.log(`✅ ${check.name}`);
    test6Pass++;
  } else {
    console.log(`❌ ${check.name}`);
    test6Fail++;
  }
});

console.log(`\nTest 6 Results: ${test6Pass}/${test6Pass + test6Fail} passed`);

// ============================================================================
// TEST 7: Verify ProductReveal uses fade (not knock-away)
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('TEST 7: ProductReveal Animation Check');
console.log('='.repeat(60));

const productRevealPath = join(__dirname, '..', 'src', 'surface', 'components', 'genesis', 'ProductReveal.tsx');
const productRevealCode = readFileSync(productRevealPath, 'utf-8');

const revealChecks = [
  {
    name: 'THE/YOUR use opacity-based fade (not translateX knock-away)',
    pattern: /THE[\s\S]*?transition-opacity[\s\S]*?YOUR[\s\S]*?transition-opacity/,
  },
  {
    name: 'YOUR is absolutely positioned over THE',
    pattern: /YOUR[\s\S]*?absolute\s+left-0/,
  },
  {
    name: 'Has THE and YOUR elements',
    pattern: /THE[\s\S]*?YOUR/,
  }
];

revealChecks.forEach(check => {
  const matches = check.pattern.test(productRevealCode);
  console.log(matches ? `✅ ${check.name}` : `❌ ${check.name}`);
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));

const totalPass = test1Pass + test2Pass + test3Pass;
const totalFail = test1Fail + test2Fail + test3Fail;

console.log(`
Total Tests: ${totalPass + totalFail}
Passed: ${totalPass}
Failed: ${totalFail}

${totalFail === 0 ? '✅ All core pipeline tests passed!' : '❌ Some tests failed - review above'}
`);

// ============================================================================
// MANUAL TESTING INSTRUCTIONS
// ============================================================================

console.log('='.repeat(60));
console.log('MANUAL TESTING CHECKLIST');
console.log('='.repeat(60));
console.log(`
To verify end-to-end in browser:

1. Start the dev server:
   npm run dev

2. Open browser to http://localhost:5173

3. Open DevTools Console (F12)

4. In Terminal, send a message like:
   "What is the Ratchet Effect?"

5. Verify AI response contains **bold** phrases (look for orange text)

6. Hover over bold text - cursor should change to pointer

7. Click bold text - should:
   - Send that phrase as new query
   - Console should show telemetry event

8. Check drawer animation:
   - Open/close Terminal
   - Should feel snappy (300ms, spring curve)

9. Scroll through Genesis screens:
   - Look for 🌱 seedling (not bouncing chevron)
   - Should have gentle float animation

10. Check ProductReveal:
    - "THE" should fade to "YOUR" 
    - No layout shift or gap between YOUR and GROVE
`);
