# HOTFIX: Fix Button → Copilot Prompt Population

> **Priority**: P1
> **Pattern**: Declarative interaction over automatic mutation
> **Philosophy**: "Forces thought and reason"

---

## Current Behavior (Wrong)

```
User clicks "Fix" → System auto-prepends text → Done
```

**Problem**: Mindless clicking. No engagement. User doesn't understand the fix.

---

## Desired Behavior (Right)

```
User clicks "Fix" → Copilot input populates with starter prompt → User reviews/edits → Submits
```

**Benefit**: Forces intentionality. User engages with the reasoning. Declarative exploration.

---

## Implementation

### 1. Add Copilot Input Setter

**File**: `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx`

Need a way to set the Copilot input from outside. Two options:

**Option A: Prop drilling**
```typescript
interface PromptEditorProps extends ObjectEditorProps<PromptPayload> {
  onSetCopilotInput?: (text: string) => void;
}
```

**Option B: Context/Store** (if Copilot state is centralized)
```typescript
import { useCopilotStore } from '@core/copilot/store';
const { setInput } = useCopilotStore();
```

### 2. Change Fix Handler

**File**: `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx`

**From:**
```typescript
const handleApplyFix = useCallback((issue: QAIssue) => {
  const patch = generateAutoFixPatch(issue, currentPrompt);
  if (patch) {
    onEdit([{ op: 'replace', path: patch.path, value: patch.value }]);
  }
}, [...]);
```

**To:**
```typescript
const handleApplyFix = useCallback((issue: QAIssue) => {
  // Generate starter prompt for Copilot instead of auto-applying
  const starterPrompt = generateCopilotStarterPrompt(issue, currentPrompt);
  onSetCopilotInput(starterPrompt);
}, [onSetCopilotInput]);
```

### 3. Create Starter Prompt Generator

**File**: `src/core/copilot/PromptQAActions.ts` (or new file)

```typescript
export function generateCopilotStarterPrompt(issue: QAIssue, currentPrompt: string): string {
  const promptTitle = currentPrompt.slice(0, 50) + (currentPrompt.length > 50 ? '...' : '');
  
  switch (issue.type) {
    case 'too_broad':
      return `/refine-prompt The current prompt "${promptTitle}" is too broad. Help me narrow the scope to focus on: `;
    
    case 'ambiguous_intent':
      return `/clarify-intent The prompt "${promptTitle}" has unclear intent. The user should understand they're exploring: `;
    
    case 'missing_context':
      return `/add-context The prompt "${promptTitle}" assumes context the reader may not have. Add grounding for: `;
    
    case 'too_narrow':
      return `/expand-scope The prompt "${promptTitle}" is too narrow for meaningful exploration. Broaden to include: `;
    
    case 'source_mismatch':
      return `/align-source The prompt "${promptTitle}" doesn't align with its source document. Adjust to better reflect: `;
    
    default:
      return `/fix-prompt Address this issue with "${promptTitle}": ${issue.description}`;
  }
}
```

### 4. Register Copilot Actions (if not exist)

**File**: `src/core/copilot/PromptCopilotActions.ts`

```typescript
// Add these actions if they don't exist
export const PROMPT_FIX_ACTIONS = [
  {
    id: 'refine-prompt',
    label: 'Refine Prompt Scope',
    description: 'Narrow a too-broad prompt to specific focus',
    handler: async (context, userInput) => {
      // AI-assisted refinement
    }
  },
  {
    id: 'clarify-intent', 
    label: 'Clarify User Intent',
    description: 'Make the exploration goal explicit',
    handler: async (context, userInput) => {
      // AI-assisted clarification
    }
  },
  {
    id: 'add-context',
    label: 'Add Missing Context',
    description: 'Ground the prompt for readers without background',
    handler: async (context, userInput) => {
      // AI-assisted context addition
    }
  },
  // ... etc
];
```

---

## UX Flow After Implementation

1. User runs QA Check → sees "Too Broad" issue
2. User clicks "Fix" button
3. Copilot input populates with: `/refine-prompt The current prompt "I keep seeing that AI capabilities are growing 'exponentially, not linearly'..." is too broad. Help me narrow the scope to focus on: `
4. User completes the thought: `...the specific claim about doubling times and what evidence supports it`
5. User submits → Copilot processes → Suggests refined prompt
6. User reviews and applies

---

## Button Label Change

Consider changing button from "Fix" to "Improve" or "Refine via Copilot":

```tsx
<button onClick={() => onApplyFix(issue)}>
  <span className="material-symbols-outlined">edit_note</span>
  Refine
</button>
```

---

## Files to Modify

| File | Change |
|------|--------|
| `PromptEditor.tsx` | Add `onSetCopilotInput` prop, change `handleApplyFix` |
| `PromptQAActions.ts` | Add `generateCopilotStarterPrompt` function |
| `QAResultsSection.tsx` | Change button label from "Fix" to "Refine" |
| Console factory or parent | Wire up Copilot input setter |
| `PromptCopilotActions.ts` | Add fix-related action handlers |

---

## Acceptance Criteria

- [ ] Clicking "Fix" (now "Refine") populates Copilot input
- [ ] Starter prompt includes issue type context
- [ ] Starter prompt ends with cursor-ready continuation point
- [ ] User can edit before submitting
- [ ] Copilot processes the refinement request
- [ ] No auto-mutation of prompt content
