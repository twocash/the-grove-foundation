# Repository Audit: persona-behaviors-v1

**Sprint:** persona-behaviors-v1
**Date:** 2025-01-02
**Auditor:** Claude (Foundation Loop)

---

## 1. Files to Modify

### 1.1 Schema Definition
| File | Purpose | Changes |
|------|---------|---------|
| `data/narratives-schema.ts` | Type definitions for personas | Add `PersonaBehaviors` interface |

### 1.2 Persona Configuration
| File | Purpose | Changes |
|------|---------|---------|
| `data/default-personas.ts` | Default persona definitions | Add `behaviors` field to Wayne, Dr. Chiang |

### 1.3 Frontend Service Layer
| File | Purpose | Changes |
|------|---------|---------|
| `services/chatService.ts` | Chat API client | Add `personaBehaviors` to `ChatOptions` |

### 1.4 Frontend Component
| File | Purpose | Changes |
|------|---------|---------|
| `components/Terminal.tsx` | Main terminal component | Pass `behaviors` alongside `toneGuidance` |

### 1.5 Backend Prompt Assembly
| File | Purpose | Changes |
|------|---------|---------|
| `server.js` | Express server with chat API | Modify `buildSystemPrompt()` to read behaviors |

---

## 2. Files to Create

None. This sprint extends existing patterns.

---

## 3. Files to Reference (Read-Only)

| File | Purpose |
|------|---------|
| `PROJECT_PATTERNS.md` | Pattern catalog (Pattern 1: Quantum Interface, Pattern 3: Narrative Schema) |
| `src/surface/hooks/useQuantumInterface.ts` | Example of lens-reactive content |

---

## 4. Current State Analysis

### 4.1 Persona Schema (data/narratives-schema.ts)
```typescript
export interface Persona {
  id: string;
  publicLabel: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
  toneGuidance: string;        // ← Voice layer (HOW to sound)
  narrativeStyle: string;
  arcEmphasis: { ... };
  // NO behaviors field currently
}
```

### 4.2 Chat Flow
```
Terminal.tsx
  └── activeLensData?.toneGuidance
        ↓
chatService.ts sendMessageStream()
  └── personaTone: string
        ↓
server.js /api/chat
  └── buildSystemPrompt({ personaTone })
        ↓
Gemini API
```

### 4.3 Current buildSystemPrompt() (server.js ~line 1100)
- Always includes `FALLBACK_SYSTEM_PROMPT` with:
  - MODE A (Architect): Brief, hooks curiosity
  - MODE B (Librarian): Verbose, comprehensive
  - FORMATTING RULES: Bold clickability, navigation blocks
  - CLOSING: BREADCRUMB/TOPIC tags
- Appends `personaTone` as "ACTIVE PERSONA LENS" modifier
- **Problem:** toneGuidance cannot override base structural behaviors

---

## 5. Dependencies

### 5.1 Package Dependencies
None required. Uses existing TypeScript types.

### 5.2 Internal Dependencies
| Dependency | Status |
|------------|--------|
| XState Engagement Machine | Not affected |
| Quantum Interface | Not affected |
| Narrative Engine | Not affected |

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Break existing personas | Low | High | Default behaviors = current behavior |
| Break /explore route | Low | High | Same Terminal.tsx, automatic inheritance |
| Merge conflicts with bedrock | None | N/A | Bedrock has no chat in server.js |
| Performance regression | None | N/A | No new API calls or processing |

---

## 7. Pattern Check Results

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Persona voice variations | Pattern 1: Quantum Interface | toneGuidance already lens-reactive |
| Persona behavioral flags | Pattern 3: Narrative Schema | **Extend Persona interface** |
| Conditional prompt assembly | None (imperative) | Add declarative flag reading |
| Response structure modes | None | **New: ResponseMode enum in config** |

**New Pattern Proposed:** None. Extending Pattern 3 (Narrative Schema) with behavioral flags.
