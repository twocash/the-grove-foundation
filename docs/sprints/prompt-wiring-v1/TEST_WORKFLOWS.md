# TEST_WORKFLOWS.md - prompt-wiring-v1

> **Purpose**: Automated test commands for Claude CLI to verify sprint completion

---

## Quick Verification (Run First)

```bash
# From C:\GitHub\the-grove-foundation

# 1. Build passes
npm run build

# 2. Run new unit tests
npx vitest run tests/unit/copilot/prompt-wiring.test.ts

# 3. Run all copilot tests
npx vitest run tests/unit/copilot/
```

---

## Full Test Suite

```bash
# All unit tests
npx vitest run tests/unit/

# All tests (may take longer)
npm test
```

---

## Manual Verification Checklist

### Epic 1: Prepend Command

```bash
# Start dev server
npm run dev

# In browser, go to /foundation/prompts
# Select any prompt
# In Copilot, type: prepend execution with: Test prefix -
# Verify: execution prompt now starts with "Test prefix - "
```

**Expected Result**: Execution prompt is PREPENDED, not replaced entirely.

### Epic 2: /make-compelling

```bash
# With prompt selected, type in Copilot:
/make-compelling

# Or any alias:
make compelling
better title
```

**Expected Result**: 
- See 3 title variants
- Each has format label (question, exploration, insight, challenge)
- Clickable suggestions to apply

### Epic 3: /suggest-targeting

```bash
# With prompt that has salienceDimensions, type:
/suggest-targeting

# Or any alias:
suggest stages
what stages
```

**Expected Result**:
- See suggested stages (genesis → exploration → etc.)
- See reasoning text
- See lens affinities with percentages
- Clickable "Apply" suggestion

### Epic 4: Extraction Pipeline

```bash
# Trigger extraction:
# 1. Go to Documents console
# 2. Select a document with extractable concepts
# 3. Run extraction (or it runs automatically)
# 4. Check new prompts in Prompt Workshop

# Verify in database or UI:
# - targeting.stages is populated (not empty array)
# - targeting.lensAffinities has entries
```

**Expected Result**: New extractions have targeting pre-populated based on salience.

---

## Automated Test Commands for Claude CLI

### Option 1: Run specific test file
```bash
npx vitest run tests/unit/copilot/prompt-wiring.test.ts --reporter=verbose
```

### Option 2: Run with watch mode for development
```bash
npx vitest tests/unit/copilot/prompt-wiring.test.ts
```

### Option 3: Run and generate coverage
```bash
npx vitest run tests/unit/copilot/prompt-wiring.test.ts --coverage
```

---

## Expected Test Output

```
✓ prompt-wiring-v1
  ✓ prepend command
    ✓ parses "prepend execution with: prefix text"
    ✓ parses "prepend title with: prefix"
    ✓ handles colon separator correctly
    ✓ returns null for non-prepend commands
  ✓ TitleTransforms
    ✓ generateVariants returns 3 variants
    ✓ toConceptName strips prefixes
    ✓ transformTitle creates question format
    ✓ transformTitle creates exploration format
  ✓ TargetingInference
    ✓ infers stages from technical salience
    ✓ infers stages from philosophical salience
    ✓ returns lens affinities with weights
    ✓ always includes genesis stage
  ✓ lib/targeting-inference.js
    ✓ exports inferTargetingFromSalience function
    ✓ produces consistent results with TypeScript version
  ✓ QA starter prompts
    ✓ generates prepend format for too_broad
    ✓ generates prepend format for missing_context
```

---

## If Tests Fail

### Import errors
- Check path aliases in vitest.config.ts
- May need to update paths

### Function not found
- Check export names in source files
- Verify function exists

### Module not found (lib/targeting-inference.js)
- File may not exist
- Check server.js for dynamic import path

### Inconsistent results (TS vs JS)
- Logic may have diverged
- Sync lib/targeting-inference.js with TargetingInference.ts

---

## Post-Test Actions

After all tests pass:

```bash
# Update DEVLOG with test results
echo "Tests passed: $(date)" >> docs/sprints/prompt-wiring-v1/DEVLOG.md

# Commit test file
git add tests/unit/copilot/prompt-wiring.test.ts
git commit -m "test: add prompt-wiring-v1 test suite"
```
