/**
 * Proxy Limit Test Script
 *
 * Purpose: Test the production api-proxy endpoint at the-grove.ai
 * to identify the exact body size limit causing 413 errors.
 *
 * Usage:
 *   node scripts/test-proxy-limits.js [--production]
 *
 * By default tests localhost. Use --production to test the-grove.ai
 */

// Configuration
const PRODUCTION_BASE = 'https://the-grove.ai';
const LOCAL_BASE = 'http://localhost:8080';
const USE_PRODUCTION = process.argv.includes('--production');
const BASE_URL = USE_PRODUCTION ? PRODUCTION_BASE : LOCAL_BASE;

console.log(`🔬 PROXY LIMIT TEST`);
console.log(`Testing: ${BASE_URL}`);
console.log('=' .repeat(60));

// Test payloads of increasing sizes
const TEST_SIZES = [
  1024,        // 1 KB
  5 * 1024,    // 5 KB
  10 * 1024,   // 10 KB
  50 * 1024,   // 50 KB
  100 * 1024,  // 100 KB (likely limit)
  500 * 1024,  // 500 KB
  1024 * 1024, // 1 MB
];

function generatePayload(sizeBytes) {
  const base = {
    message: 'Test message',
    systemPrompt: 'You are a helpful assistant. ',
    context: ''
  };

  // Fill context to reach target size
  const currentSize = JSON.stringify(base).length;
  const fillNeeded = sizeBytes - currentSize;
  if (fillNeeded > 0) {
    base.context = 'x'.repeat(fillNeeded);
  }

  return base;
}

async function testEndpoint(sizeBytes) {
  const payload = generatePayload(sizeBytes);
  const actualSize = JSON.stringify(payload).length;
  const sizeLabel = actualSize < 1024
    ? `${actualSize} B`
    : actualSize < 1024 * 1024
      ? `${(actualSize / 1024).toFixed(1)} KB`
      : `${(actualSize / (1024 * 1024)).toFixed(2)} MB`;

  process.stdout.write(`Testing ${sizeLabel.padStart(10)}... `);

  try {
    // We're not testing the actual Gemini proxy, just the body parsing limits
    // Using the narrative endpoint as a proxy for body limits
    const response = await fetch(`${BASE_URL}/api/admin/narrative`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '2.0',
        globalSettings: { test: payload.context },
        personas: {},
        cards: {}
      }),
    });

    if (response.ok) {
      console.log(`✅ OK (${response.status})`);
      return { success: true, size: actualSize };
    } else if (response.status === 413) {
      console.log(`❌ 413 PAYLOAD TOO LARGE`);
      return { success: false, size: actualSize, status: 413 };
    } else {
      const text = await response.text().catch(() => '');
      console.log(`⚠️  ${response.status}: ${text.substring(0, 50)}`);
      return { success: null, size: actualSize, status: response.status };
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return { success: false, size: actualSize, error: error.message };
  }
}

async function findLimit() {
  const results = [];

  for (const size of TEST_SIZES) {
    const result = await testEndpoint(size);
    results.push(result);

    // If we hit 413, we've found the limit
    if (result.status === 413) {
      break;
    }
  }

  // Binary search to find exact limit if we have a range
  const lastSuccess = results.filter(r => r.success === true).pop();
  const firstFailure = results.find(r => r.status === 413);

  if (lastSuccess && firstFailure) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTS');
    console.log('='.repeat(60));
    console.log(`Last successful size: ${(lastSuccess.size / 1024).toFixed(1)} KB`);
    console.log(`First failed size:    ${(firstFailure.size / 1024).toFixed(1)} KB`);
    console.log(`\n💡 Body size limit is between ${(lastSuccess.size / 1024).toFixed(1)} KB and ${(firstFailure.size / 1024).toFixed(1)} KB`);
  } else if (results.every(r => r.success === true)) {
    console.log('\n✅ All tests passed - no 413 errors detected');
    console.log('   The limit may be higher than 1 MB or there is no limit');
  } else {
    console.log('\n⚠️  Inconclusive results - check individual test outputs');
  }

  return results;
}

// Also test the express.json() limit
async function checkExpressBodyLimit() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 EXPRESS BODY PARSER LIMIT CHECK');
  console.log('='.repeat(60));

  console.log(`
Current server.js configuration:
- express.json() is used WITHOUT explicit limit parameter
- Default express.json() limit is 100 KB

Recommended fix for server.js:
  app.use(express.json({ limit: '10mb' }));

This would allow larger payloads through the server.
`);
}

// Run tests
async function main() {
  if (USE_PRODUCTION) {
    console.log('\n⚠️  Testing PRODUCTION - be careful with rate limits!\n');
  }

  await findLimit();
  await checkExpressBodyLimit();

  console.log('\n' + '='.repeat(60));
  console.log('📝 NEXT STEPS');
  console.log('='.repeat(60));
  console.log(`
1. If 413 errors occur at small sizes:
   → Add 'limit' option to express.json() in server.js

2. If 413 occurs only in production via api-proxy:
   → Check the proxy server's body size configuration
   → Consider using server-side chat endpoint instead

3. To test production proxy directly:
   node scripts/test-proxy-limits.js --production
`);
}

main().catch(console.error);
