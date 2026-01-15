# Execution Prompt: S3||SFR-Actions

**Sprint:** S3||SFR-Actions - Action Panel & Integration
**Codename:** S3||SFR-Actions
**Branch:** `feat/s3-sfr-actions`
**Dependencies:** S1-SFR-Shell ✅, S2||SFR-Display ✅
**Stories:** US-D001, US-D002, US-D003, US-D004, US-D005, US-E001 (6 total)

---

## Sprint Contract

### Pre-Flight Checklist

- [ ] Pull latest from main (includes S1 + S2 merged code)
- [ ] Create branch: `git checkout -b feat/s3-sfr-actions`
- [ ] Verify npm dependencies: `npm install`
- [ ] Read this entire document before coding

### Execution Rules

1. **One commit per story** - Atomic commits with format: `feat(sfr): US-D00X - Description`
2. **No scope creep** - Only implement what's in acceptance criteria
3. **Follow existing patterns** - Use CollapsibleSection, engagement events from S2
4. **TypeScript strict** - No `any` types, proper interfaces

### Definition of Done

- [ ] All 6 stories implemented with passing acceptance criteria
- [ ] ActionPanel replaces placeholder with real functionality
- [ ] GardenTray entry point wired
- [ ] Engagement events emitting correctly
- [ ] PR created with all commits

---

## Architecture Context

### File Structure After S3

```
src/surface/components/modals/SproutFinishingRoom/
├── SproutFinishingRoom.tsx     # Main modal (S1) ✅
├── FinishingRoomHeader.tsx     # Header with close (S1) ✅
├── FinishingRoomStatus.tsx     # Status bar (S1) ✅
├── ProvenancePanel.tsx         # Left column (S2) ✅
├── DocumentViewer.tsx          # Center column (S2) ✅
├── ActionPanel.tsx             # Right column (S3) ← THIS SPRINT
├── components/
│   ├── CollapsibleSection.tsx  # Reusable (S2) ✅
│   ├── CognitiveRoutingSection.tsx # (S2) ✅
│   ├── ReviseForm.tsx          # (S3) NEW
│   ├── PromotionChecklist.tsx  # (S3) NEW
│   └── TertiaryActions.tsx     # (S3) NEW
├── json-render/                # (S2) ✅
│   └── ...
└── index.tsx
```

### Engagement Events to Emit

| Event | Payload | Trigger |
|-------|---------|---------|
| `finishingRoomOpened` | `{ sproutId }` | Modal opens |
| `finishingRoomClosed` | `{ sproutId }` | Modal closes |
| `sproutRefinementSubmitted` | `{ sproutId, revisionNotes }` | Revise submitted |
| `sproutArchived` | `{ sproutId }` | Archive clicked |
| `sproutAnnotated` | `{ sproutId, note }` | Note saved |
| `sproutExported` | `{ sproutId, format }` | Export clicked |
| `sproutPromotedToRag` | `{ sproutId, selectedItems }` | Promotion confirmed |

---

## User Stories

### US-D001: Revise & Resubmit Form (Stubbed)

**As an** Explorer
**I want to** provide feedback on the research for improvement
**So that** I can guide refinement of the document (future: agent requeue)

**Priority:** P0 | **Complexity:** M

**Note:** v1.0 stubs this action. Full agent requeue deferred to v1.1.

**Implementation:**

Create `components/ReviseForm.tsx`:

```typescript
// src/surface/components/modals/SproutFinishingRoom/components/ReviseForm.tsx
import React, { useState } from 'react';

interface ReviseFormProps {
  sproutId: string;
  onSubmit: (notes: string) => void;
}

export const ReviseForm: React.FC<ReviseFormProps> = ({ sproutId, onSubmit }) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!notes.trim()) return;
    setIsSubmitting(true);
    // v1.0: Stub - just emit event and show toast
    onSubmit(notes);
    setNotes('');
    setIsSubmitting(false);
  };

  return (
    <div className="p-4 border-b border-ink/10 dark:border-white/10">
      {/* Section header with green accent */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1 h-4 bg-grove-forest rounded-full" />
        <h3 className="text-sm font-medium text-ink dark:text-paper">
          Revise & Resubmit
        </h3>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="What should the next version address differently?"
        className="w-full h-24 p-3 text-sm bg-paper dark:bg-ink border border-ink/10 dark:border-white/10 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-grove-forest/50"
        aria-label="Revision instructions"
      />

      <button
        onClick={handleSubmit}
        disabled={!notes.trim() || isSubmitting}
        className="mt-3 w-full py-2 px-4 bg-grove-forest text-paper rounded-lg font-medium text-sm hover:bg-grove-forest/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Submitting...' : 'Submit for Revision'}
      </button>
    </div>
  );
};
```

**Acceptance Criteria:**

```gherkin
Scenario: Revision form displayed in primary section
  Given I open the Finishing Room
  Then I should see a "Revise & Resubmit" section (green accent)
  And I should see a textarea for revision instructions
  And I should see a "Submit for Revision" button

Scenario: Submit revision shows confirmation (v1.0 stub)
  Given I have entered revision instructions
  When I click "Submit for Revision"
  Then a confirmation toast should appear: "Revision submitted for processing!"
  And a "sproutRefinementSubmitted" event should be emitted
  And the textarea should be cleared

Scenario: Empty submission shows validation
  Given the revision textarea is empty
  When I click "Submit for Revision"
  Then the button should be disabled
```

**Commit:** `feat(sfr): US-D001 - Revise & Resubmit form (stubbed)`

---

### US-D002: Archive Sprout to Garden

**As an** Explorer
**I want to** archive a sprout for later reference
**So that** I can save interesting research without promoting it

**Priority:** P0 | **Complexity:** S

**Implementation:**

Add to `TertiaryActions.tsx`:

```typescript
const handleArchive = () => {
  // Update sprout status in storage
  updateSprout(sprout.id, { status: 'archived' });

  // Emit event
  emit.custom('sproutArchived', { sproutId: sprout.id });

  // Show toast
  toast.success('Sprout archived to your garden');

  // Close modal
  onClose();
};
```

**Acceptance Criteria:**

```gherkin
Scenario: Archive button in tertiary section
  Given I open the Finishing Room
  Then I should see tertiary actions section at bottom
  And I should see "Archive to Garden" button with 📁 icon

Scenario: Archive updates sprout status
  Given I am viewing a sprout in the Finishing Room
  When I click "Archive to Garden"
  Then the sprout status should update to "archived"
  And a confirmation toast should appear: "Sprout archived to your garden"
  And a "sproutArchived" event should be emitted
  And the modal should close
```

**Commit:** `feat(sfr): US-D002 - Archive sprout to garden`

---

### US-D003: Add Private Note

**As an** Explorer
**I want to** add personal annotations to a sprout
**So that** I can record my thoughts without affecting the document

**Priority:** P1 | **Complexity:** S

**Implementation:**

```typescript
const [showNoteInput, setShowNoteInput] = useState(false);
const [noteText, setNoteText] = useState(sprout.notes || '');

const handleSaveNote = () => {
  updateSprout(sprout.id, { notes: noteText });
  emit.custom('sproutAnnotated', { sproutId: sprout.id, note: noteText });
  toast.success('Note saved');
  setShowNoteInput(false);
};
```

**Acceptance Criteria:**

```gherkin
Scenario: Add note button opens input
  Given I am in the Finishing Room
  When I click "Add Private Note" (📝 icon)
  Then a note input field should appear

Scenario: Save note persists to sprout
  Given I have entered a note
  When I click "Save Note" or press Enter
  Then the note should be saved to sprout.notes
  And a confirmation should appear: "Note saved"
```

**Commit:** `feat(sfr): US-D003 - Add private note annotation`

---

### US-D004: Export Document

**As an** Explorer
**I want to** download the research document
**So that** I can reference it offline or share it externally

**Priority:** P1 | **Complexity:** S

**Implementation:**

```typescript
const handleExport = () => {
  const cognitiveRouting = buildCognitiveRouting(sprout.provenance);

  // Build markdown content
  const content = `# ${sprout.query}

---
**Generated:** ${new Date(sprout.capturedAt).toLocaleDateString()}
**Lens:** ${sprout.provenance?.lens?.name || 'Default'}
**Cognitive Path:** ${cognitiveRouting.path}
---

${sprout.response}
`;

  // Create download
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sprout-${sprout.id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.md`;
  a.click();
  URL.revokeObjectURL(url);

  emit.custom('sproutExported', { sproutId: sprout.id, format: 'markdown' });
  toast.success('Document exported');
};
```

**Acceptance Criteria:**

```gherkin
Scenario: Export button triggers download
  Given I am in the Finishing Room
  When I click "Export Document" (📤 icon)
  Then a file download should initiate
  And the filename should include sprout ID and date
  And the format should be Markdown (.md)

Scenario: Export includes provenance header
  Given I export a document
  When I open the downloaded file
  Then I should see metadata header with Generated, Lens, Cognitive Path
```

**Commit:** `feat(sfr): US-D004 - Export document to markdown`

---

### US-D005: Declarative Promotion Checklist (Add to Field)

**As a** Cultivator
**I want to** select which parts of the research to promote to the Knowledge Commons
**So that** I can contribute curated content without including everything

**Priority:** P0 | **Complexity:** M

**Backend API:** `POST /api/knowledge/upload`

**Implementation:**

Create `components/PromotionChecklist.tsx`:

```typescript
// src/surface/components/modals/SproutFinishingRoom/components/PromotionChecklist.tsx
import React, { useState } from 'react';
import type { Sprout } from '@core/schema/sprout';

interface PromotionItem {
  id: string;
  label: string;
  defaultChecked: boolean;
  getContent: (sprout: Sprout) => string;
}

const PROMOTION_ITEMS: PromotionItem[] = [
  {
    id: 'thesis',
    label: 'Thesis Statement',
    defaultChecked: true,
    getContent: (s) => s.researchDocument?.header?.position || s.query,
  },
  {
    id: 'analysis',
    label: 'Full Analysis',
    defaultChecked: false,
    getContent: (s) => s.researchDocument?.analysis?.content || s.response,
  },
  {
    id: 'sources',
    label: 'Discovered Sources',
    defaultChecked: true,
    getContent: (s) => {
      const sources = s.researchDocument?.sources || [];
      return sources.map((src, i) => `[${i+1}] ${src.title}: ${src.url}`).join('\n');
    },
  },
  {
    id: 'notes',
    label: 'My Annotation',
    defaultChecked: false,
    getContent: (s) => s.notes || '',
  },
];

interface PromotionChecklistProps {
  sprout: Sprout;
  onPromote: (content: string, selectedItems: string[]) => void;
}

export const PromotionChecklist: React.FC<PromotionChecklistProps> = ({
  sprout,
  onPromote,
}) => {
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(PROMOTION_ITEMS.map(item => [item.id, item.defaultChecked]))
  );
  const [isPromoting, setIsPromoting] = useState(false);

  const toggleItem = (id: string) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePromote = async () => {
    const selectedItems = PROMOTION_ITEMS.filter(item => selected[item.id]);
    if (selectedItems.length === 0) {
      // Show validation
      return;
    }

    setIsPromoting(true);

    // Assemble content from selected items
    const content = selectedItems
      .map(item => `## ${item.label}\n\n${item.getContent(sprout)}`)
      .join('\n\n---\n\n');

    onPromote(content, selectedItems.map(i => i.id));
    setIsPromoting(false);
  };

  const hasSelection = Object.values(selected).some(v => v);

  return (
    <div className="p-4 border-b border-ink/10 dark:border-white/10">
      {/* Section header with cyan accent */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1 h-4 bg-cyan-500 rounded-full" />
        <h3 className="text-sm font-medium text-ink dark:text-paper">
          Add to Field
        </h3>
      </div>

      <p className="text-xs text-ink-muted dark:text-paper/60 mb-3">
        Select content to promote to Knowledge Commons
      </p>

      {/* Checklist */}
      <div className="space-y-2">
        {PROMOTION_ITEMS.map(item => (
          <label
            key={item.id}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
              selected[item.id]
                ? 'bg-cyan-500/10 border border-cyan-500/30'
                : 'hover:bg-ink/5 dark:hover:bg-white/5'
            }`}
          >
            <input
              type="checkbox"
              checked={selected[item.id]}
              onChange={() => toggleItem(item.id)}
              className="w-4 h-4 rounded border-ink/20 text-cyan-500 focus:ring-cyan-500/50"
            />
            <span className="text-sm text-ink dark:text-paper">{item.label}</span>
          </label>
        ))}
      </div>

      <button
        onClick={handlePromote}
        disabled={!hasSelection || isPromoting}
        className="mt-4 w-full py-2 px-4 bg-cyan-500 text-white rounded-lg font-medium text-sm hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPromoting ? 'Promoting...' : 'Promote Selected'}
      </button>
    </div>
  );
};
```

**API Call:**

```typescript
const handlePromoteToRag = async (content: string, selectedItems: string[]) => {
  try {
    const response = await fetch('/api/knowledge/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: sprout.query,
        content,
        tier: 2,
        sourceType: 'sprout',
        sourceUrl: `sprout://${sprout.id}`,
      }),
    });

    if (!response.ok) throw new Error('Upload failed');

    emit.custom('sproutPromotedToRag', { sproutId: sprout.id, selectedItems });
    toast.success('Content promoted to Knowledge Commons');
  } catch (error) {
    toast.error('Failed to promote content');
  }
};
```

**Acceptance Criteria:**

```gherkin
Scenario: Promotion checklist displayed in secondary section
  Given I open the Finishing Room
  Then I should see an "Add to Field" section (cyan accent)
  And I should see a checklist with items:
    | Item | Default State |
    | Thesis Statement | Checked |
    | Full Analysis | Unchecked |
    | Discovered Sources | Checked |
    | My Annotation | Unchecked |

Scenario: Toggle checklist items
  Given I see the promotion checklist
  When I click on "Full Analysis"
  Then the checkbox should become checked
  And the item should show a cyan highlight

Scenario: Promote selected content
  Given I have checked "Thesis Statement" and "Discovered Sources"
  When I click "Promote Selected"
  Then the system should call POST /api/knowledge/upload
  And a confirmation toast should appear
  And a "sproutPromotedToRag" event should be emitted

Scenario: Empty selection shows validation
  Given no checklist items are selected
  When I click "Promote Selected"
  Then the button should be disabled
```

**Commit:** `feat(sfr): US-D005 - Declarative promotion checklist`

---

### US-E001: GardenTray Entry Point + Event Integration

**As the** System
**I want to** wire the Finishing Room to GardenTray
**So that** users can open it from their sprout cards

**Priority:** P0 | **Complexity:** M

**Implementation Steps:**

1. **Add callback prop to SproutFinishingRoom:**

```typescript
// Update SproutFinishingRoomProps
export interface SproutFinishingRoomProps {
  sprout: Sprout;
  isOpen: boolean;
  onClose: () => void;
  onSproutUpdate?: (sprout: Sprout) => void;  // NEW
}
```

2. **Wire to GardenTray (or widget SproutCard):**

```typescript
// In GardenTray or wherever sprout cards are rendered
const [finishingRoomSprout, setFinishingRoomSprout] = useState<Sprout | null>(null);

const handleSproutClick = (sprout: Sprout) => {
  // Only open Finishing Room for sprouts with researchDocument
  if (sprout.researchDocument) {
    setFinishingRoomSprout(sprout);
    emit.custom('finishingRoomOpened', { sproutId: sprout.id });
  }
};

// Render modal
{finishingRoomSprout && (
  <SproutFinishingRoom
    sprout={finishingRoomSprout}
    isOpen={!!finishingRoomSprout}
    onClose={() => {
      emit.custom('finishingRoomClosed', { sproutId: finishingRoomSprout.id });
      setFinishingRoomSprout(null);
    }}
    onSproutUpdate={(updated) => updateSproutInStorage(updated)}
  />
)}
```

3. **Add engagement hooks to ActionPanel:**

```typescript
import { useEngagementEmit } from '@hooks/useEngagementBus';

export const ActionPanel: React.FC<ActionPanelProps> = ({ sprout, onClose, onSproutUpdate }) => {
  const emit = useEngagementEmit();

  // All actions emit events + update sprout via callback
};
```

**Acceptance Criteria:**

```gherkin
Scenario: Open Finishing Room for ready sprout
  Given I have a sprout with researchDocument attached
  When I click on the sprout card in GardenTray
  Then the Sprout Finishing Room modal should open
  And a "finishingRoomOpened" event should be emitted

Scenario: Sprout without ResearchDocument doesn't open Finishing Room
  Given I have a sprout without researchDocument
  When I click on the sprout card
  Then the Finishing Room should NOT open

Scenario: Events emitted for all actions
  Given the Finishing Room is open
  When I perform any action (archive, note, export, promote, revise)
  Then the corresponding event should be emitted with sproutId
```

**Commit:** `feat(sfr): US-E001 - GardenTray entry point + event wiring`

---

## Complete ActionPanel Implementation

After all stories, `ActionPanel.tsx` should look like:

```typescript
// src/surface/components/modals/SproutFinishingRoom/ActionPanel.tsx
// Sprint: S3||SFR-Actions - Complete Action Panel

import React from 'react';
import type { Sprout } from '@core/schema/sprout';
import { useEngagementEmit } from '@hooks/useEngagementBus';
import { useSproutStorage } from '@hooks/useSproutStorage';
import { ReviseForm } from './components/ReviseForm';
import { PromotionChecklist } from './components/PromotionChecklist';
import { TertiaryActions } from './components/TertiaryActions';
import { toast } from 'sonner'; // or your toast library

export interface ActionPanelProps {
  sprout: Sprout;
  onClose: () => void;
  onSproutUpdate?: (sprout: Sprout) => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  sprout,
  onClose,
  onSproutUpdate,
}) => {
  const emit = useEngagementEmit();
  const { updateSprout } = useSproutStorage();

  // US-D001: Revise & Resubmit (stubbed)
  const handleRevisionSubmit = (notes: string) => {
    emit.custom('sproutRefinementSubmitted', {
      sproutId: sprout.id,
      revisionNotes: notes,
    });
    toast.success('Revision submitted for processing!');
  };

  // US-D005: Promote to RAG
  const handlePromote = async (content: string, selectedItems: string[]) => {
    try {
      const response = await fetch('/api/knowledge/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sprout.query,
          content,
          tier: 2,
          sourceType: 'sprout',
          sourceUrl: `sprout://${sprout.id}`,
        }),
      });

      if (!response.ok) throw new Error('Upload failed');

      emit.custom('sproutPromotedToRag', { sproutId: sprout.id, selectedItems });
      toast.success('Content promoted to Knowledge Commons');
    } catch (error) {
      toast.error('Failed to promote content');
    }
  };

  // US-D002, D003, D004: Tertiary actions
  const handleTertiaryAction = (
    action: 'archive' | 'annotate' | 'export',
    payload?: unknown
  ) => {
    switch (action) {
      case 'archive':
        updateSprout(sprout.id, { status: 'archived' });
        emit.custom('sproutArchived', { sproutId: sprout.id });
        toast.success('Sprout archived to your garden');
        onClose();
        break;
      case 'annotate':
        const note = payload as string;
        updateSprout(sprout.id, { notes: note });
        emit.custom('sproutAnnotated', { sproutId: sprout.id, note });
        toast.success('Note saved');
        break;
      case 'export':
        emit.custom('sproutExported', { sproutId: sprout.id, format: 'markdown' });
        toast.success('Document exported');
        break;
    }
  };

  return (
    <aside className="w-[320px] flex-shrink-0 border-l border-ink/10 dark:border-white/10 bg-paper/20 dark:bg-ink/20 overflow-y-auto flex flex-col">
      {/* US-D001: Primary Action - Revise & Resubmit */}
      <ReviseForm sproutId={sprout.id} onSubmit={handleRevisionSubmit} />

      {/* US-D005: Secondary Action - Promote to Field */}
      <PromotionChecklist sprout={sprout} onPromote={handlePromote} />

      {/* US-D002, D003, D004: Tertiary Actions */}
      <TertiaryActions
        sprout={sprout}
        onAction={handleTertiaryAction}
      />
    </aside>
  );
};

export default ActionPanel;
```

---

## Commit Sequence

| Order | Story | Commit Message |
|-------|-------|----------------|
| 1 | US-D001 | `feat(sfr): US-D001 - Revise & Resubmit form (stubbed)` |
| 2 | US-D005 | `feat(sfr): US-D005 - Declarative promotion checklist` |
| 3 | US-D002 | `feat(sfr): US-D002 - Archive sprout to garden` |
| 4 | US-D003 | `feat(sfr): US-D003 - Add private note annotation` |
| 5 | US-D004 | `feat(sfr): US-D004 - Export document to markdown` |
| 6 | US-E001 | `feat(sfr): US-E001 - GardenTray entry point + event wiring` |

---

## Exit Criteria

- [ ] ActionPanel has three sections: Revise (green), Promote (cyan), Tertiary (neutral)
- [ ] Revise form accepts text and emits event (stubbed backend)
- [ ] Promotion checklist calls `/api/knowledge/upload` with selected content
- [ ] Archive updates sprout status and closes modal
- [ ] Note saves to sprout.notes
- [ ] Export downloads markdown file with provenance header
- [ ] GardenTray opens Finishing Room for sprouts with researchDocument
- [ ] All actions emit engagement events
- [ ] **ALL visual verification tests pass with no console errors** (see Quality Gate below)

---

## Quality Gate: Visual Verification

**CRITICAL:** This sprint cannot be closed until ALL visual verification tests pass. The test suite captures screenshots of every user story and monitors for console errors.

### Running the Tests

```bash
# Run visual verification tests
npx playwright test s3-sfr-actions-visual.spec.ts --headed

# Run in debug mode (interactive)
npx playwright test s3-sfr-actions-visual.spec.ts --debug

# Run with specific test
npx playwright test s3-sfr-actions-visual.spec.ts -g "US-D001"
```

### Test File Location

```
tests/e2e/s3-sfr-actions-visual.spec.ts
```

### Screenshot Output

Screenshots are saved to:
```
docs/sprints/sprout-finishing-room-v1/screenshots/s3/
├── us-d001-revise-form-empty.png
├── us-d001-revise-form-filled.png
├── us-d001-submission-toast.png
├── us-d005-checklist-defaults.png
├── us-d005-checklist-toggled.png
├── us-d002-archive-button.png
├── us-d003-note-input.png
├── us-d004-export-button.png
└── us-e001-full-modal.png
```

### Sprint Review Document

After tests complete, a review document is generated at:
```
docs/sprints/sprout-finishing-room-v1/S3-VISUAL-REVIEW.md
```

This document includes:
- Pass/Fail status for each test
- Embedded screenshots
- Console error reports
- Quality gate checklist

### Quality Gate Checklist

Before creating PR, verify:

- [ ] All 9+ visual tests pass (`npx playwright test s3-sfr-actions-visual.spec.ts`)
- [ ] No console errors in any test (checked via ConsoleMonitor)
- [ ] Screenshots show expected UI (not error states)
- [ ] Review document generated and reviewed
- [ ] Manual verification of at least 3 screenshots against acceptance criteria

### Console Error Policy

**Zero tolerance for console errors.** The test suite monitors:
- `console.error()` calls
- Uncaught exceptions (`pageerror`)
- React hydration errors
- Network failures

If any console errors are detected, the test will fail and report the specific errors. Fix all console errors before proceeding.

### Manual Verification

After automated tests pass, perform these manual checks:

1. **Visual Inspection**: Open each screenshot and verify it matches the user story requirements
2. **Theme Check**: Run tests in both light and dark mode
3. **Interaction Check**: Manually test one happy path through the Finishing Room
4. **Event Verification**: Check browser DevTools for engagement events being emitted

---

## PR Template

```markdown
## Summary
- Implements Action Panel (right column) with revise, promote, and tertiary actions
- Wires GardenTray entry point for sprouts with ResearchDocument
- Integrates engagement bus events for all user actions

## User Stories Completed

### Epic D: Action Panel
- **US-D001**: Revise & Resubmit form (stubbed for v1.0)
- **US-D002**: Archive sprout to garden
- **US-D003**: Add private note annotation
- **US-D004**: Export document to markdown
- **US-D005**: Declarative promotion checklist with RAG integration

### Epic E: Integration
- **US-E001**: GardenTray entry point + engagement event wiring

## Test plan
- [ ] Revise form shows toast on submit
- [ ] Promotion checklist toggles items correctly
- [ ] Promote calls /api/knowledge/upload
- [ ] Archive updates status and closes modal
- [ ] Note saves to sprout
- [ ] Export downloads .md file
- [ ] GardenTray opens Finishing Room for researchDocument sprouts
- [ ] All events emit with correct payloads

## Visual Verification (REQUIRED)
- [ ] All visual tests pass: `npx playwright test s3-sfr-actions-visual.spec.ts`
- [ ] No console errors detected
- [ ] Screenshots reviewed: `docs/sprints/sprout-finishing-room-v1/screenshots/s3/`
- [ ] Review document generated: `docs/sprints/sprout-finishing-room-v1/S3-VISUAL-REVIEW.md`
```

---

## Developer Handoff

**Ready to start!** Run this command to begin:

```bash
cd C:\GitHub\the-grove-foundation
git fetch origin && git pull origin main
git checkout -b feat/s3-sfr-actions
npm install
# Start implementing US-D001
```

**Key patterns to follow:**
- Use `CollapsibleSection` from S2 for consistent styling
- Import `useEngagementEmit` from `@hooks/useEngagementBus`
- Import `useSproutStorage` from `@hooks/useSproutStorage`
- Use `toast` from your toast library (sonner or similar)
- Follow existing color conventions: green = primary, cyan = secondary

### Complete Workflow

1. **Implement all 6 stories** (atomic commits)
2. **Run dev server**: `npm run dev`
3. **Run visual verification tests**: `npx playwright test s3-sfr-actions-visual.spec.ts --headed`
4. **Review screenshots** in `docs/sprints/sprout-finishing-room-v1/screenshots/s3/`
5. **Review generated document** at `docs/sprints/sprout-finishing-room-v1/S3-VISUAL-REVIEW.md`
6. **Fix any issues** (console errors, visual bugs)
7. **Re-run tests until clean**
8. **Create PR** only when all visual tests pass with no console errors

### Final Checklist Before PR

```bash
# Run full visual verification
npx playwright test s3-sfr-actions-visual.spec.ts

# Verify no test failures
# Verify no console errors
# Verify screenshots look correct

# Only then create PR
git add .
git commit -m "feat(sfr): S3 complete - visual verification passed"
git push origin feat/s3-sfr-actions
```

---

*S3||SFR-Actions Execution Prompt v1.1 - With Visual Verification Quality Gate*
