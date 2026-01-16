# How to View the Sprout Finishing Room Modal

**Quick Start:** 3 steps to see your new modal

---

## Method 1: Via GardenTray (Fixed!)

### Step 1: Open the app
Navigate to: **http://localhost:8080/explore**

### Step 2: Find the GardenTray
- Look at the **right edge** of the screen
- You'll see a narrow panel with a 🌱 icon and a badge number
- This is the **GardenTray** (slide-out sprout panel)

### Step 3: Expand the tray
- **Hover** your mouse over the right edge
- The panel expands to show your sprouts
- You'll see search/filter controls and a list of sprouts

### Step 4: Click a completed sprout
- Look for sprouts with the 🌻 emoji (completed status)
- **Click** on any 🌻 sprout
- **Modal opens!** ✨

**Expected:** 3-column modal with:
- **Left:** Provenance panel (lens info, timestamps)
- **Center:** Document viewer (JSON render of results)
- **Right:** Action panel (revise, promote, archive, note, export)

---

## Method 2: Via Browser Console (Instant)

If you don't have completed sprouts yet, or want to test quickly:

### Step 1: Open browser console
- **Windows:** Press `F12` or `Ctrl+Shift+I`
- **Mac:** Press `Cmd+Option+I`

### Step 2: Paste this code

```javascript
// Get a sprout from localStorage
const sprouts = JSON.parse(localStorage.getItem('grove-sprouts') || '[]');
const sproutId = sprouts[0]?.id;

if (sproutId) {
  // Open the modal
  window.dispatchEvent(new CustomEvent('open-finishing-room', {
    detail: { sproutId }
  }));
  console.log('✅ Modal should be open for sprout:', sproutId);
} else {
  console.log('❌ No sprouts found. Create one first.');
}
```

### Step 3: Press Enter
Modal opens immediately!

---

## Method 3: Create a Test Sprout First

If you have no sprouts:

### Step 1: Go to Terminal page
Navigate to: **http://localhost:8080**

### Step 2: Enable Sprout Capture
Look for the **magnetic pill** (floating button) or keyboard shortcut

### Step 3: Capture some text
- Select any text on the page
- Click "Capture as Sprout"
- Submit the research query

### Step 4: Wait for completion
- Watch the GardenTray badge increment
- Wait for 🌻 emoji (sprout completed)

### Step 5: Click the sprout
Follow Method 1 above

---

## Troubleshooting

### "I don't see the GardenTray"
- It's on the **right edge** (not left)
- Look for a narrow vertical panel with 🌱
- Try refreshing the page

### "The tray doesn't expand"
- Make sure you're **hovering** over it
- Try moving mouse slowly from right edge inward

### "No 🌻 sprouts"
- 🌱 = pending
- 🌿 = active (processing)
- 🌻 = completed (ready to open)
- Create a new sprout and wait for it to complete

### "Modal doesn't open when I click"
- Make sure server is running: http://localhost:8080
- Check console for errors (F12)
- Try Method 2 (console command) to test modal directly

### "I see the OLD modal, not the new one"
- Old modal = simple results display
- New modal = 3-column layout with action panel
- If you see old modal, the fix didn't apply - refresh and try again

---

## What You Should See

### New Modal (Correct)
```
┌─────────────────────────────────────────────────┐
│              Sprout Finishing Room              │
├───────────┬──────────────────┬──────────────────┤
│           │                  │                  │
│ Provenance│  Document        │  Action Panel    │
│ Panel     │  Viewer          │                  │
│           │                  │  ┌─────────────┐ │
│ Lens:     │  [JSON Render]   │  │ Revise Form │ │
│ Created:  │                  │  └─────────────┘ │
│ Updated:  │  [Results]       │                  │
│           │                  │  ┌─────────────┐ │
│           │  [Evidence]      │  │  Promotion  │ │
│           │                  │  │  Checklist  │ │
│           │                  │  └─────────────┘ │
│           │                  │                  │
│           │                  │  Archive | Note  │
│           │                  │  Export          │
└───────────┴──────────────────┴──────────────────┘
```

### Old Modal (Incorrect)
```
┌─────────────────────────────┐
│   Research Results          │
├─────────────────────────────┤
│                             │
│  Simple results display     │
│  No action panel            │
│                             │
└─────────────────────────────┘
```

If you see the old modal, the integration isn't working.

---

## Testing the Action Panel

Once modal is open, test each action:

### 1. Revise Form
- Type in the textarea
- Click "Submit Revision"
- Toast appears: "Revision submitted"

### 2. Promotion Checklist
- Toggle checkboxes
- Select sources to promote
- Click "Promote Selected"
- Toast appears: "N items promoted to knowledge base"

### 3. Archive
- Click "Archive" button
- Modal closes
- Sprout moves to archived state (📦)

### 4. Private Note
- Click "Add Private Note"
- Input field appears
- Type note and blur/click away
- Toast appears: "Note saved"

### 5. Export
- Click "Export as Markdown"
- .md file downloads
- Check Downloads folder

---

## Server Must Be Running

**Production server MUST be running on port 8080:**

```bash
npm start
```

**Check:** http://localhost:8080/api/health should return `{}`

**Dev server (port 3000) will NOT work** - the modal is only integrated in production build.

---

*Randy - Chief of Staff v1.2*
*"Modal is ready. Server is running. Test away!"*
