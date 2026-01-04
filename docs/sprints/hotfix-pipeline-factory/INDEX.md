# Hotfix: Pipeline Monitor Factory Alignment

**Sprint ID:** `hotfix-pipeline-factory`  
**Status:** Ready for Execution  
**Priority:** High (architectural alignment)  
**Estimated:** 4-6 hours

## Problem Statement

PipelineMonitor uses a custom implementation with direct `BedrockLayout` props, while LensWorkshop and PromptWorkshop use the `createBedrockConsole` factory pattern. This deviation:

1. **Breaks DEX Principle:** The reference implementation should demonstrate canonical patterns
2. **Missing Copilot:** No BedrockCopilot integration (visible in current UI)
3. **Missing Metrics:** No MetricsRow integration
4. **Duplicated Logic:** Filter/sort/favorites logic reimplemented instead of using `useCollectionView`
5. **Inspector Mismatch:** Manual inspector vs. factory's `useBedrockUI().openInspector()`

## Solution

Refactor PipelineMonitor to use `createBedrockConsole` factory pattern, matching LensWorkshop and PromptWorkshop architecture.

## Sprint Artifacts

| Artifact | Purpose |
|----------|---------|
| [SPEC.md](./SPEC.md) | Requirements and acceptance criteria |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Target state, type definitions, file structure |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | File-by-file change plan |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | Self-contained handoff for Claude CLI |
| [DEVLOG.md](./DEVLOG.md) | Execution tracking |

## Quick Start

```bash
# For Claude CLI
Read C:\GitHub\the-grove-foundation\docs\sprints\hotfix-pipeline-factory\EXECUTION_PROMPT.md and begin execution.
```

## Key Files

**CREATE:**
- `PipelineMonitor.config.ts` - Console configuration
- `useDocumentData.ts` - Data hook with GroveObject adapter
- `document-transforms.ts` - Transform functions for Document ↔ GroveObject

**MODIFY:**
- `PipelineMonitor/index.ts` - Use factory pattern
- `DocumentCard.tsx` - Accept ObjectCardProps
- `DocumentEditor.tsx` - Accept ObjectEditorProps

**DELETE:**
- `PipelineMonitor.tsx` - Replaced by factory
- `DocumentsView.tsx` - Logic absorbed by factory

## Verification

```bash
# Must pass
npm run build
npx tsc --noEmit

# Visual verification
# 1. Open /bedrock/pipeline
# 2. Confirm Copilot panel appears below inspector
# 3. Confirm MetricsRow appears with Total/Pending/Complete
# 4. Confirm filter/sort/favorites work identically
```
