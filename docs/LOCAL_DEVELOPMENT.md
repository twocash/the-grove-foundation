# The Grove Foundation - Local Development Guide

> CI/CD Pipeline Documentation for Agentic Coding Sessions

## Quick Start

### Prerequisites
- Node.js 20+
- npm
- Google Cloud SDK (for GCS access)
- Gemini API Key

### Environment Setup

```bash
# Set the API key (required for chat functionality)
export GEMINI_API_KEY=your-api-key-here

# Or on Windows (Git Bash)
GEMINI_API_KEY=your-key-here node server.js
```

### Start Development Servers

**Option 1: Two Terminal Windows**
```bash
# Terminal 1 - Backend (Express server on port 8080)
GEMINI_API_KEY=your-key node server.js

# Terminal 2 - Frontend (Vite dev server on port 3000)
GEMINI_API_KEY=your-key npm run dev
```

**Option 2: Single Command (Background)**
```bash
# Start both servers
GEMINI_API_KEY=your-key node server.js &
GEMINI_API_KEY=your-key npm run dev
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Admin Dashboard**: http://localhost:3000?admin=true

---

## Architecture Overview

### Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     LOCAL DEVELOPMENT                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Browser (localhost:3000)                                       │
│        │                                                         │
│        ▼                                                         │
│   Vite Dev Server (port 3000)                                   │
│        │                                                         │
│        │ /api/* requests proxied                                │
│        ▼                                                         │
│   Express Server (port 8080)                                    │
│        │                                                         │
│        ├──► GCS (grove-assets bucket)                           │
│        │    - narratives.json                                   │
│        │    - knowledge/*.md                                    │
│        │    - manifest.json                                     │
│        │                                                         │
│        └──► Gemini API                                          │
│             - Chat completions                                  │
│             - Lens generation                                   │
│             - Narrative extraction                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Server-Side Chat Architecture

**Why Server-Side?**
- Eliminates 413 "Payload Too Large" errors from production proxy
- API key stays server-side only (security improvement)
- Server constructs full system prompt with RAG context
- Session management with automatic cleanup

**Chat Endpoints**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/chat` | Main chat with SSE streaming |
| POST | `/api/chat/init` | Initialize new session (optional) |
| DELETE | `/api/chat/:sessionId` | End session |
| GET | `/api/chat/health` | Health check |

**Chat Request Body**
```typescript
{
  message: string;           // User's message
  sessionId?: string;        // Auto-generated if not provided
  sectionContext?: string;   // Current section (e.g., "The Stakes")
  personaTone?: string;      // Active lens toneGuidance
  verboseMode?: boolean;     // Scholar Mode flag
  terminatorMode?: boolean;  // Advanced mode flag
}
```

**SSE Stream Events**
```typescript
// Chunk event (during streaming)
{ type: 'chunk', text: string }

// Done event (after completion)
{ type: 'done', sessionId: string, breadcrumb: string | null, topic: string | null }

// Error event
{ type: 'error', error: string, code?: number }
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Yes | - | Google Gemini API key |
| `GCS_BUCKET_NAME` | No | `grove-assets` | GCS bucket for storage |
| `PORT` | No | `8080` | Express server port |

### API Key Usage

**Server-side only (secure):**
- `/api/chat` - Terminal chat
- `/api/generate-lens` - Custom lens generation
- `/api/admin/generate-narrative` - Narrative extraction

**Still client-side (to be migrated):**
- Admin TTS audio generation (`audioService.ts`)
- Legacy `generateArtifact` (deprecated)

---

## Build & Deploy

### Production Build
```bash
# Build frontend
npm run build

# Output in dist/
```

### Cloud Build (GCP)
```bash
# Deploy to Cloud Run
gcloud builds submit --config cloudbuild.yaml
```

### Docker
```bash
# Build image
docker build -t grove-terminal .

# Run container
docker run -e GEMINI_API_KEY=your-key -p 8080:8080 grove-terminal
```

---

## Testing

### Health Checks
```bash
# Chat service health
curl http://localhost:8080/api/chat/health

# Expected response:
# {"status":"ok","apiKeyConfigured":true,"activeSessions":0}
```

### Test Scripts
```bash
# Test API payload sizes
GEMINI_API_KEY=your-key node scripts/test-api-payload.js

# Test proxy body limits
node scripts/test-proxy-limits.js
node scripts/test-proxy-limits.js --production
```

---

## Troubleshooting

### Common Issues

**"GEMINI_API_KEY configured: NOT SET"**
- Ensure you're passing the key correctly
- On Windows, use: `GEMINI_API_KEY=key node server.js` (not `set`)

**413 Payload Too Large**
- This was the original issue that led to server-side chat
- If you see this, ensure you're using `/api/chat` not direct Gemini calls
- Check `express.json({ limit: '10mb' })` in server.js

**CORS Errors**
- Vite proxy should handle this in development
- Check that `/api` requests are going through port 3000, not directly to 8080

**GCS Access Errors**
- Ensure `GOOGLE_APPLICATION_CREDENTIALS` is set or running on GCP
- Check bucket permissions for the service account

---

## Key Files Reference

### Services
| File | Purpose |
|------|---------|
| `services/chatService.ts` | Frontend client for server-side chat (NEW) |
| `services/geminiService.ts` | Direct Gemini (DEPRECATED for chat) |
| `services/audioService.ts` | TTS generation (still uses direct Gemini) |

### Backend
| File | Purpose |
|------|---------|
| `server.js` | Express API, GCS integration, Chat API |
| `data/prompts.js` | System prompts for narrative generation |

### Configuration
| File | Purpose |
|------|---------|
| `vite.config.ts` | Build config, dev server proxy |
| `cloudbuild.yaml` | GCP Cloud Build pipeline |
| `Dockerfile` | Container image definition |

---

## Future Work: TTS Migration

The admin TTS feature still exposes the API key client-side. A future sprint will:

1. Add `/api/admin/generate-audio` endpoint
2. Move TTS generation server-side
3. Remove all client-side API key exposure
4. Update `vite.config.ts` to remove key definitions

See `ARCHITECTURE_NOTES.md` for detailed sprint plan.

---

## Session Notes for Agentic Coding

When starting a new coding session with Claude Code:

1. **Read `CLAUDE.md`** - Project overview and conventions
2. **Read `ARCHITECTURE_NOTES.md`** - Technical details and sprint history
3. **Check `docs/LOCAL_DEVELOPMENT.md`** (this file) - Dev setup
4. **Start servers** with API key before testing changes
5. **Run `npm run build`** to verify TypeScript compilation

### Kill Orphan Processes
```bash
# Find processes on dev ports
netstat -ano | findstr "LISTENING" | findstr ":300 :808"

# Kill by PID (Windows)
taskkill //PID <pid> //F
```
