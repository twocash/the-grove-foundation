# Bedrock Alignment v1 - Sprint Index

## Purpose
Align all Bedrock consoles to Quantum Glass design system and improve the Pipeline Monitor Documents view UX.

## What This Sprint Does NOT Touch

**These RAG pipeline components are PRESERVED:**
- `ProcessingQueue.tsx` - Embedding queue and trigger
- `HubSuggestions.tsx` - Cluster approval workflow
- `JourneySynthesis.tsx` - Journey generation and activation
- `pipeline.config.ts` - API endpoints and status configs

These files contain critical RAG pipeline functionality and will not be modified.

## What This Sprint Changes

### Token Alignment
Replace Workspace tokens (`-light`, `-dark`, `dark:`) with Quantum Glass tokens (`--glass-*`, `--neon-*`) in:
- `BedrockLayout.tsx`
- `BedrockNav.tsx`
- `ThreeColumnLayout.tsx`

### Documents View UX
Transform the Documents view from inline upload + table to cards + modal:
- `UploadPanel.tsx` → `DocumentsView.tsx` (card-based with filters)
- New: `UploadModal.tsx` (glass modal for file drops)
- New: `DocumentCard.tsx` (card component for documents)
- Update: `PipelineMonitor.tsx` (integrate modal + DocumentsView)

### Placeholder Consoles
Update to use Glass primitives:
- `GardenConsole.tsx`
- `LensWorkshop.tsx`

## Pipeline Navigation Preserved

```
Pipeline Monitor
├── Documents → Cards with search/filter/favorites + upload modal
├── Processing → ProcessingQueue (UNCHANGED)
├── Hubs → HubSuggestions (UNCHANGED)
└── Journeys → JourneySynthesis (UNCHANGED)
```

## Token Reference

```css
/* Use ONLY these in /bedrock routes */
--glass-void, --glass-panel, --glass-solid, --glass-elevated
--glass-border, --glass-border-hover
--neon-green, --neon-cyan, --neon-amber, --neon-violet
--glass-text-primary, --glass-text-secondary, --glass-text-muted, --glass-text-subtle
```

## Execution
See: [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md)

## Estimated Effort
~2-3 hours CLI execution
