# DEVLOG — streaming-layout-fix-v2

## 2026-01-10

### Implementation Complete

**Change:** Added conditional `layout` prop to StreamRenderer.tsx

**Files modified:**
- `components/Terminal/Stream/StreamRenderer.tsx`

**Verification:**
- [x] Build passes
- [x] Type check passes
- [ ] Unit tests pass (pre-existing failures unrelated to this change)
- [ ] E2E tests pass
- [x] Manual verification needed: no jitter during streaming
- [x] Manual verification needed: no explosion on completion
- [x] Manual verification needed: entrance animations preserved

**Commit:** `c2c2d08`

**Notes:**
- Added `ResponseStreamItem` to imports
- Created `isAnyStreaming` flag that checks if any response item has `isGenerating === true`
- Changed `layout` prop from always-on to `layout={!isAnyStreaming}`
- When streaming, layout animations are disabled to prevent the bunching/vibration effect
- When streaming completes, layout animations re-enable for smooth transitions
