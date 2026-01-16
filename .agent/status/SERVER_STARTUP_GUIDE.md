# Server Startup Guide

**Version:** 1.0
**Owner:** Randy (Chief of Staff)
**Verified:** 2026-01-15

---

## ✅ Current Status (VERIFIED)

Both servers are running and healthy:
- **Dev Server:** http://localhost:3000 (Vite + HMR)
- **Production Server:** http://localhost:8080 (Express + built assets)

---

## Server Types

### 1. Development Server (Vite)
**Port:** 3000
**Purpose:** Local development with hot module replacement
**Command:** `npm run dev`

**Features:**
- ✅ Instant hot reload
- ✅ Source maps
- ✅ React Fast Refresh
- ✅ TypeScript checking
- ✅ API proxy to port 8080 (if configured)

**When to use:**
- Writing code
- Testing UI changes
- Component development
- Debugging with browser DevTools

### 2. Production Server (Express)
**Port:** 8080
**Purpose:** Serves built assets (production-like environment)
**Command:** `npm start` OR `node server.js`

**Features:**
- ✅ Serves from `dist/` folder
- ✅ All API endpoints (`/api/*`)
- ✅ Google Cloud Storage integration
- ✅ Gemini AI integration
- ✅ GitHub sync (if configured)
- ✅ Supabase integration

**When to use:**
- Testing production build
- E2E testing (Playwright)
- API development/testing
- Pre-deployment verification
- Cloud Run simulation

---

## Startup Procedures

### Quick Start (Development)

```bash
# 1. Install dependencies (first time only)
npm install

# 2. Start dev server
npm run dev

# Opens: http://localhost:3000
```

### Production Testing

```bash
# 1. Build the app
npm run build

# 2. Start production server
npm start

# Opens: http://localhost:8080
```

### E2E Testing

```bash
# 1. Ensure production server is running
npm start  # (or verify it's already running)

# 2. Run tests
npm run test:e2e

# Playwright will connect to http://localhost:8080
```

---

## Common Issues

### Issue 1: "EADDRINUSE: address already in use"

**Error:**
```
Error: listen EADDRINUSE: address already in use :::8080
```

**Cause:** Server is already running

**Solution:**
```bash
# Check what's running on port 8080
netstat -ano | findstr :8080

# Option A: Use the running server (recommended)
# Just navigate to http://localhost:8080

# Option B: Kill the process and restart
# Windows:
taskkill /PID <PID> /F
npm start

# Linux/Mac:
lsof -ti:8080 | xargs kill -9
npm start
```

### Issue 2: "Cannot GET /api/*"

**Error:** 404 on API endpoints

**Cause:** Production server not running (only dev server)

**Solution:**
```bash
# API routes only exist on production server
# Start it:
npm start

# Then access: http://localhost:8080/api/health
```

### Issue 3: "dist/ folder not found"

**Error:**
```
Error: ENOENT: no such file or directory, stat 'C:\...\dist\index.html'
```

**Cause:** Build not created

**Solution:**
```bash
npm run build
npm start
```

### Issue 4: E2E tests fail with "page.goto: net::ERR_CONNECTION_REFUSED"

**Cause:** Production server not running

**Solution:**
```bash
# 1. Start server in one terminal
npm start

# 2. Run tests in another terminal
npm run test:e2e
```

---

## Verification Commands

### Check if servers are running

```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :8080

# Linux/Mac
lsof -i :3000
lsof -i :8080
```

### Test server responses

```bash
# Dev server
curl http://localhost:3000

# Production server
curl http://localhost:8080

# Health endpoint (production only)
curl http://localhost:8080/api/health
# Should return: {}
```

### Check server logs

```bash
# Server logs will show in the terminal where you ran:
npm start
# or
npm run dev
```

---

## Environment Variables

Required in `.env` file:

```bash
# Required for AI features
GEMINI_API_KEY=AIzaSy...
ANTHROPIC_API_KEY=sk-ant-api03-...

# Required for cloud features
GCS_BUCKET_NAME=grove-assets

# Optional for GitHub sync
GITHUB_TOKEN=ghp_...
GITHUB_OWNER=...
GITHUB_REPO=...

# Optional for Supabase
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Verify environment:**
```bash
# Server startup will show:
# [dotenv] injecting env (12) from .env.local
# GEMINI_API_KEY configured: AIzaSy...
# ANTHROPIC_API_KEY configured: sk-ant...
```

---

## Port Reference

| Port | Service | Command | Purpose |
|------|---------|---------|---------|
| 3000 | Vite Dev | `npm run dev` | Development with HMR |
| 8080 | Express Prod | `npm start` | Production build + APIs |
| 5173 | Vite (alt) | `vite` | Alternative dev port |
| 4173 | Vite Preview | `npm run preview` | Preview production build |

---

## Typical Workflows

### Workflow 1: Feature Development

```bash
# Terminal 1: Dev server (auto-reload UI)
npm run dev

# Terminal 2: Production server (for API testing)
npm start

# Browser: http://localhost:3000 (dev UI)
# Browser: http://localhost:8080/api/* (API calls)
```

### Workflow 2: E2E Testing

```bash
# Terminal 1: Production server
npm start

# Terminal 2: Run tests
npm run test:e2e

# Tests will run against http://localhost:8080
```

### Workflow 3: Pre-deployment Verification

```bash
# 1. Build
npm run build

# 2. Start production server
npm start

# 3. Manual testing
# Open: http://localhost:8080
# Test all features

# 4. Run E2E tests
npm run test:e2e

# 5. Check build size
ls -lh dist/
```

---

## Health Check

Use the built-in health check script:

```bash
npm run health
```

**Expected output:**
```
✅ Environment variables loaded
✅ Dependencies installed
✅ Build exists (dist/)
✅ Server responds on :8080
✅ Dev server responds on :3000 (if running)
```

---

## Troubleshooting Checklist

Before asking for help:

- [ ] Ran `npm install`
- [ ] Created `.env` file with required keys
- [ ] Ran `npm run build` (for production server)
- [ ] Checked ports with `netstat -ano | findstr :8080`
- [ ] Verified no errors in server terminal
- [ ] Tested with `curl http://localhost:8080/api/health`
- [ ] Checked browser console for errors
- [ ] Verified Node version: `node --version` (should be v20+)

---

## Quick Reference

```bash
# Install
npm install

# Development
npm run dev              # Start Vite dev server (:3000)

# Production
npm run build            # Build to dist/
npm start                # Start Express server (:8080)

# Testing
npm run test             # Unit tests
npm run test:e2e         # E2E tests (requires server running)
npm run test:all         # All tests

# Health
npm run health           # Run health check
curl localhost:8080/api/health  # Quick API check
```

---

*Randy - Chief of Staff v1.2*
*"Servers verified. Documentation complete."*
