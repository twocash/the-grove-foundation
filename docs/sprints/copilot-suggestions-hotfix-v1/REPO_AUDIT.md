# REPO_AUDIT.md - copilot-suggestions-hotfix-v1

> **Sprint**: copilot-suggestions-hotfix-v1
> **Audited**: 2026-01-06

---

## Files to Modify

### 1. `src/bedrock/patterns/console-factory.types.ts`

**Purpose**: Add suggestions to CopilotActionResult type

**Current State (line ~83):**
```typescript
export interface CopilotActionResult {
  success: boolean;
  message: string;
  operations?: PatchOperation[];
}
```

**Missing**: `suggestions?: SuggestedAction[]`

---

### 2. `src/bedrock/primitives/BedrockCopilot.tsx`

**Purpose**: Render clickable suggestions in Copilot panel

**Current State:**
- Local `ActionResult` interface (line ~24) lacks suggestions
- Local `CopilotMessage` interface (line ~14) lacks suggestions
- No UI for rendering suggestions after messages

**Needs:**
- Add suggestions to both interfaces
- Capture suggestions from action result
- Render clickable buttons after message content

---

### 3. `src/bedrock/consoles/PromptWorkshop/PromptCopilotActions.ts`

**Purpose**: Update handlers to return suggestions array

**Current State:**
- `make-compelling` case (line ~343) returns only message text
- `suggest-targeting` case (line ~245) returns only message text

**Needs:**
- Import SuggestedAction type
- Add suggestions array to both handlers' return values

---

## Files to Reference (Read-Only)

| File | Provides |
|------|----------|
| `src/core/copilot/schema.ts` | `SuggestedAction` interface |
| `src/shared/inspector/SuggestedActions.tsx` | Example rendering (not used, but pattern reference) |

---

## Type Definition (Already Exists)

From `src/core/copilot/schema.ts`:
```typescript
export interface SuggestedAction {
  label: string;
  template: string;
  icon?: string;
}
```

---

## Import Paths

```typescript
// In console-factory.types.ts
import type { SuggestedAction } from '@core/copilot/schema';

// In BedrockCopilot.tsx
import type { SuggestedAction } from '../../core/copilot/schema';

// In PromptCopilotActions.ts
import type { SuggestedAction } from '@core/copilot/schema';
```

---

## Build Verification

```bash
npm run build
npm run typecheck
```
