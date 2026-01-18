# Grove Hygiene Launcher — Web App Spec

## Purpose

Simple web app that:
1. Displays Fix Queue from Notion
2. Lets you review/approve/reject items
3. Kicks off Claude Code execution for approved fixes
4. Displays session summaries with screenshots

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Data:** Notion API (read/write to DBs)
- **Execution:** Shell spawn to Claude Code CLI
- **Screenshots:** Claude Code + Chrome (your existing setup)

## Routes

```
/                       # Dashboard — queue stats, recent completions
/queue                  # Fix Queue list (filterable by status, type, risk)
/queue/[id]             # Single fix detail + approve/reject/edit
/queue/[id]/execute     # Live execution monitor
/strategic              # Strategic Notes browser
/summaries              # Session summary gallery with screenshots
/summaries/[id]         # Single summary detail
/scan                   # Trigger manual DEX Master scan
```

## Key Components

### Dashboard (`/`)
```
┌────────────────────────────────────────────────────────────┐
│  GROVE HYGIENE                               [Run Scan]    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Ready: 12  │  In Progress: 2  │  Complete: 47            │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  READY FOR REVIEW                                    │ │
│  │  ○ Remove unused import · cleanup · 95% · low risk   │ │
│  │  ○ Update axios version · dependency · 90% · low     │ │
│  │  ○ Fix deprecated test API · test · 88% · low        │ │
│  │                                      [View Queue →]  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  RECENT COMPLETIONS                                  │ │
│  │  ✓ Remove dead explore/v1 routes · +2 tests · 100%  │ │
│  │  ✓ Clean bedrock legacy import · 0 tests · 100%     │ │
│  │                                   [View Summaries →] │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### Review Screen (`/queue/[id]`)
```
┌────────────────────────────────────────────────────────────┐
│  ← Back                                                    │
│                                                            │
│  Remove unused bedrock.legacy_handler import               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                   │
│                                                            │
│  Type: cleanup     Risk: low     Confidence: 95%           │
│  Source: dex-master                                        │
│                                                            │
│  AFFECTED FILES                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ src/grove/core/router.ts                             │ │
│  │ Lines: 12-14, 89-102                      [View →]   │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  RATIONALE                                                 │
│  Import unused since commit abc123. Function was           │
│  scaffolding for deprecated v1 routing. No references.     │
│                                                            │
│  CONTRACT SPEC                                   [Edit]    │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 1. Open src/grove/core/router.ts                     │ │
│  │ 2. Remove import on line 12                          │ │
│  │ 3. Remove dead code lines 89-102                     │ │
│  │ 4. Run: npm test -- router                           │ │
│  │ 5. Verify: /bedrock and /explore routes load         │ │
│  │ 6. Screenshot: Both routes render                    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  [Reject]              [Save Edits]         [✓ Approve]    │
└────────────────────────────────────────────────────────────┘
```

### Execution Flow

When "Approve" is clicked:

1. **Update Notion:** Status → `approved`, Approved At → now
2. **Spawn Claude Code:**
   ```bash
   claude -p "Execute this fix contract: [contract spec]. 
              When complete, write session summary to Notion 
              database 35e8f98c-3ddc-4f2f-ad54-130398ab01cb"
   ```
3. **Monitor:** Stream output to `/queue/[id]/execute` page
4. **Complete:** Claude Code writes summary to Notion
5. **Update:** Status → `complete`, link Session Summary

## API Routes

```typescript
// app/api/queue/route.ts
GET  /api/queue              // List queue items from Notion
POST /api/queue              // Create new queue item

// app/api/queue/[id]/route.ts
GET    /api/queue/[id]       // Get single item
PATCH  /api/queue/[id]       // Update item (approve, reject, edit)

// app/api/queue/[id]/execute/route.ts
POST   /api/queue/[id]/execute  // Kick off Claude Code execution

// app/api/summaries/route.ts
GET  /api/summaries          // List session summaries

// app/api/scan/route.ts
POST /api/scan               // Trigger DEX Master scan
```

## Notion Integration

```typescript
// lib/notion.ts
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const FIX_QUEUE_DB = '4342664c-be13-4a07-9ec5-8488a79ddcb1';
const STRATEGIC_NOTES_DB = '394db86c-01fa-44e4-842d-3de6dc09e08c';
const SESSION_SUMMARIES_DB = '35e8f98c-3ddc-4f2f-ad54-130398ab01cb';

export async function getQueueItems(status?: string) {
  const response = await notion.databases.query({
    database_id: FIX_QUEUE_DB,
    filter: status ? {
      property: 'Status',
      select: { equals: status }
    } : undefined,
    sorts: [{ property: 'Confidence', direction: 'descending' }]
  });
  return response.results;
}

export async function updateQueueItem(pageId: string, properties: any) {
  return notion.pages.update({ page_id: pageId, properties });
}

export async function createSessionSummary(data: SessionSummary) {
  return notion.pages.create({
    parent: { database_id: SESSION_SUMMARIES_DB },
    properties: {
      Title: { title: [{ text: { content: data.title } }] },
      // ... other properties
    }
  });
}
```

## Claude Code Execution

```typescript
// lib/claude-code.ts
import { spawn } from 'child_process';

export function executeContract(contractSpec: string, queueItemId: string) {
  const prompt = `
You are executing a fix contract from the Grove Hygiene system.

CONTRACT:
${contractSpec}

REQUIREMENTS:
1. Execute each step exactly as specified
2. Capture before/after test counts
3. Take screenshots as specified
4. Write session summary to Notion database ${SESSION_SUMMARIES_DB}
5. Include verification status

Begin execution.
`;

  const claude = spawn('claude', ['-p', prompt], {
    cwd: 'C:\\Github\\the-grove-foundation',
    shell: true
  });

  return claude;
}
```

## Environment Variables

```env
NOTION_TOKEN=secret_...
GROVE_REPO_PATH=C:\Github\the-grove-foundation
CLAUDE_CODE_PATH=claude  # or full path if not in PATH
```

## Build Sequence

| Step | Task | Time |
|------|------|------|
| 1 | `npx create-next-app grove-hygiene` | 5 min |
| 2 | Notion API integration | 30 min |
| 3 | Dashboard + Queue list | 1 hr |
| 4 | Review screen | 1 hr |
| 5 | Execution integration | 2 hr |
| 6 | Summary display | 1 hr |
| 7 | Scan trigger | 30 min |

**Total:** ~6 hours for MVP

## Future Enhancements

- [ ] WebSocket for real-time execution updates
- [ ] Batch approve low-risk items
- [ ] Git integration (auto-create branches)
- [ ] PR creation after fix completion
- [ ] Slack notifications on completion
- [ ] Metrics dashboard (fixes/week, test delta trends)
