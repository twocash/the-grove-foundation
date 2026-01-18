# Atlas Chief of Staff Skill

**Trigger Phrases:**
- "atlas, what's the status"
- "atlas, show me tasks"
- "atlas, sync grove"
- "atlas, give me a briefing"
- "chief of staff"

**Description:**
Your AI Chief of Staff for task management, research, and Grove development tracking. Captures @Atlas mentions from anywhere in Notion and provides quick access to tasks and sprint status.

---

## Commands

### `/atlas-brief`
Get a current task briefing at the start of your session.

**Usage:**
```
/atlas-brief
```

**Output:**
- New tasks captured from @Atlas mentions
- Tasks by priority (P0, P1, P2, P3)
- Grove sprint status summary
- Suggested actions

---

### `/atlas-tasks`
List all pending tasks from the Atlas Tasks database.

**Usage:**
```
/atlas-tasks [--status status] [--priority p0|p1|p2|p3] [--tag tag]
```

**Examples:**
```
/atlas-tasks                    # All pending tasks
/atlas-tasks --status "In Progress"
/atlas-tasks --priority P0
/atlas-tasks --tag research
```

---

### `/atlas-capture`
Manually capture a task without using @Atlas mention.

**Usage:**
```
/atlas-capture "Your task description" [--priority p0|p1|p2|p3] [--tag tag]
```

**Examples:**
```
/atlas-capture "Research LLM context window trends" --priority P1 --tag research
/atlas-capture "Fix authentication bug" --priority P0 --tag code
/atlas-capture "Update documentation" --tag docs
```

---

### `/atlas-grove`
Show current Grove development status by reading local status files.

**Usage:**
```
/atlas-grove
```

**Output:**
- Active sprints from `.agent/status/current/`
- Blocked sprints
- Last heartbeat times
- Links to relevant Notion pages

---

### `/atlas-disposition`
Update task status or add notes to a task.

**Usage:**
```
/atlas-disposition "task title or ID" --status done|waiting|in-progress --notes "your notes"
```

**Examples:**
```
/atlas-disposition "Research LLM trends" --status done --notes "Completed with findings"
/atlas-disposition "Fix bug" --status "In Progress"
```

---

## @Atlas Mention Patterns

You can create tasks by mentioning Atlas anywhere in Notion:

| Pattern | Example |
|---------|---------|
| `@Atlas task: [description]` | `@Atlas task: Review PR #42` |
| `@Atlas research [topic]` | `@Atlas research context windows` |
| `@Atlas review [file]` | `@Atlas review src/auth.ts` |
| `@Atlas TODO: [task]` | `@Atlas TODO: Update docs` |
| `[ ] task @Atlas` | `[ ] Update README @Atlas` |
| `atlas, please [task]` | `atlas, please research RAG` |

**Priority Detection:**
- P0: urgent, asap, critical, blocker, emergency
- P1: important, high priority, soon
- P2: normal, medium (default)
- P3: low, nice to have, backlog

**Auto-Tagging:**
- `research`: research, investigate, find, search
- `code`: code, fix, bug, refactor, implement
- `docs`: doc, document, write, readme
- `review`: review, check, audit, verify
- `grove`: grove, sprint, foundation

---

## Grove Status Integration

The Chief of Staff reads Grove status from:
- Local: `.agent/status/current/*.md`
- Notion: Linked sprint pages in Grove Foundation workspace

Key Grove pages for status:
- [Grove Foundation Code Factory System](https://www.notion.so/2e5780a78eef814ab14cdf90965347a6)
- [Local Tools & Capabilities](https://www.notion.so/2ea780a78eef80c898bfd8e41bb0d427)

---

## Session Startup Behavior

When Claude Code session starts:
1. `atlas_startup.py` runs automatically
2. Scans all accessible Notion pages for @Atlas mentions
3. Creates tasks in the Atlas Tasks database
4. Displays task briefing

---

## Files

- **Script:** `C:/github/claude-assist/atlas_startup.py`
- **Database:** `f4330e19-7efc-4ad4-bf44-354c4d56a6a8` (Atlas Tasks)
- **Dashboard:** `https://www.notion.so/2ea780a78eef815080d0e5709ce793ea`

---

## Examples

### Full Session Flow
```
You: Start Claude Code session
Atlas: (runs startup) Found 3 new @Atlas mentions

You: /atlas-brief
Atlas: Here's your briefing:
       - [P0] Review security vulnerability - urgent
       - [P1] Research context windows - research
       - [P2] Update docs - docs

You: @Atlas task: Add integration tests for auth module
Atlas: (creates task silently)

You: /atlas-tasks --priority P0
Atlas: P0 Tasks:
       - Review security vulnerability
       - Fix production bug #123
```

### Research Request
```
You: @Atlas research LLM agent frameworks for Grove
Atlas: (creates task, then runs research)
      Created task: Research LLM agent frameworks for Grove
      Found 5 relevant frameworks:
      - AutoGPT
      - LangChain Agents
      - CrewAI
      - OpenAI Assistants
      - Microsoft PromptFlow
```

### Code Review
```
You: @Atlas review src/core/auth.ts
Atlas: (creates task, fetches file via Serena MCP)
      Created task: Review src/core/auth.ts
      Analysis:
      - Security: ✅ No obvious vulnerabilities
      - Style: ⚠️ Inconsistent naming
      - Tests: ❌ No test coverage
```
