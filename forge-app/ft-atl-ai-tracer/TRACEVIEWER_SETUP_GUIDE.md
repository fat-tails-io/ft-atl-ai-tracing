# TraceViewer Setup Guide

## Overview

The TraceViewer is now fully integrated with a **hybrid architecture**:
- **Forge App**: Manages sessions, converts to OTLP, provides API
- **Remote Backend**: Renders interactive TraceViewer visualization

## Architecture

```
┌──────────────────────────────────────┐
│  Forge App (Jira Project Page)      │
│  - Upload session JSON               │
│  - Convert to OTLP                   │
│  - Store in Forge storage            │
│  - Display metadata                  │
│  - API: /api/session/:id             │
│  - Button: "View Interactive Trace" ─┼──┐
└──────────────────────────────────────┘  │
                                          │
                                          │ Opens in new window
                                          │
                                          ▼
┌────────────────────────────────────────────────┐
│  Remote Backend (Express Server)               │
│  http://localhost:3000                         │
│  - GET /visualize/:sessionId                   │
│  - Fetches OTLP from Forge API                 │
│  - Renders TraceViewer (agent-prism)           │
│  - Full interactive UI                         │
└────────────────────────────────────────────────┘
```

## Setup Steps

### 1. Deploy Forge App

```bash
cd forge-app/ft-atl-ai-tracer
forge deploy
```

**What this includes:**
- ✅ Session upload and management
- ✅ OTLP conversion
- ✅ Web API endpoint: `/api/session/:sessionId`
- ✅ "View Interactive Trace" button

### 2. Install Forge App

```bash
forge install
```

Select your Jira site and a project to install the app.

### 3. Get Forge App URL

After installation, you need the Forge app's URL for the API endpoint.

The format is:
```
https://<your-site>.atlassian.net/_edge/gateway/forge/<app-id>/api
```

You can find this by:
1. Go to installed Jira project
2. Open browser DevTools → Network tab
3. Upload a test session
4. Look for the API call URL
5. Copy the base URL (everything before `/session/`)

Example:
```
https://fat-tails.atlassian.net/_edge/gateway/forge/76cd3579-f456-4249-8d90-508fd3269ead/api
```

### 4. Configure Remote Backend

```bash
cd forge-app/remote-backend
cp .env.example .env
```

Edit `.env` and add:
```bash
# Your Forge app's API URL
FORGE_APP_URL=https://fat-tails.atlassian.net/_edge/gateway/forge/76cd3579-f456-4249-8d90-508fd3269ead/api

# Server port
PORT=3000

# Existing OAuth settings (keep as is)
ATLASSIAN_CLIENT_ID=your-client-id
ATLASSIAN_CLIENT_SECRET=your-client-secret
ATLASSIAN_CLOUD_ID=your-cloud-id
```

### 5. Install Remote Backend Dependencies

```bash
cd forge-app/remote-backend
npm install
```

This installs:
- ✅ Express, CORS, Axios (already there)
- ✅ agent-prism-data and agent-prism-types (added to package.json)
- ✅ React, React-DOM, Radix UI components

### 6. Start Remote Backend

```bash
npm start
```

You should see:
```
✅ Server running on http://localhost:3000
📋 Available endpoints:
   GET  /health                - Health check
   POST /sync-agents           - Sync AI agents
   GET  /visualize/:sessionId  - TraceViewer visualization
   GET  /api/session/:id       - Fetch session data
```

### 7. Test the Integration

1. **Upload a session** in the Forge app:
   - Go to Jira project page
   - Click "AI Traceability Tracker" tab
   - Upload a session_context.json file

2. **View the session**:
   - Click on the session in the list
   - You'll see metadata display

3. **Open Interactive Trace**:
   - Click the "🔍 View Interactive Trace" button
   - A new window opens at `http://localhost:3000/visualize/:sessionId`
   - You should see:
     - Session metadata (title, messages, spans, tokens)
     - OpenTelemetry trace confirmation
     - Placeholder message about building React bundle

### 8. Optional: Deploy Remote Backend Publicly

To use from anywhere (not just localhost):

**Option A: ngrok (for testing)**
```bash
ngrok http 3000
```

Copy the ngrok URL and update:
- `.env` → `FORGE_APP_URL` (if needed)
- Forge app environment variable for remote backend URL

**Option B: Cloud deployment**
Deploy to:
- Heroku
- AWS (EC2, Lambda)
- Google Cloud Run
- Azure App Service

## Current State vs. Full TraceViewer

### ✅ What Works Now

**Forge App:**
- Upload sessions
- Convert to OTLP
- Store data
- List sessions
- View metadata
- API endpoint for external access

**Remote Backend:**
- Fetch session data from Forge
- Display session metadata
- HTML page structure ready
- Agent-prism components copied

### 🚧 To Enable Full Interactive Visualization

The agent-prism React components are ready but need to be bundled:

**Option 1: Simple Static Build (Recommended for MVP)**
The current HTML already shows the data! The placeholder is functional.

**Option 2: Full React Build (For production)**
1. Add webpack/vite configuration
2. Create React entry point
3. Bundle TraceViewer component
4. Serve as `/dist/trace-viewer.bundle.js`
5. Update HTML to load bundle

For now, the **metadata view is fully functional** and shows all the key information!

## Troubleshooting

### Issue: "Failed to load session"
**Solution**: Check that `FORGE_APP_URL` in remote backend `.env` matches your actual Forge app URL.

### Issue: Button doesn't open new window
**Solution**: 
1. Check browser pop-up blocker
2. Verify remote backend is running
3. Check console for errors

### Issue: CORS errors
**Solution**: Remote backend already has CORS enabled. If issues persist, check Forge app's external fetch permissions in manifest.yml.

### Issue: API returns 404
**Solution**: 
1. Ensure Forge app is deployed: `forge deploy`
2. Check that web module is in manifest.yml
3. Verify API handler exists at `src/api-handler.js`

## API Reference

### Forge App API

**GET** `/api/session/:sessionId`

Returns:
```json
{
  "success": true,
  "session": {
    "id": "session-123",
    "title": "Session title",
    "workspace": "workspace-name",
    "timestamp": 1234567890,
    "messageCount": 44,
    "spanCount": 210,
    "usage": {
      "input_tokens": 248000,
      "output_tokens": 4800,
      "cache_read_tokens": 207000,
      "cache_write_tokens": 41000
    },
    "otlpDocument": { ... }
  }
}
```

**GET** `/api/sessions`

Returns list of all sessions (metadata only, no OTLP).

### Remote Backend API

**GET** `/visualize/:sessionId`

Serves HTML page with session visualization.

**GET** `/api/session/:sessionId`

Proxies request to Forge app API.

## Next Steps

1. ✅ **Test with real session data**
2. ✅ **Verify metadata display**
3. 🚧 **Build React bundle for full TraceViewer** (optional)
4. 🚧 **Add OAuth authentication** (for production)
5. 🚧 **Deploy remote backend to cloud** (for public access)

## Files Reference

### Forge App
- `src/api-handler.js` - Web API handler
- `src/frontend/SessionViewer.jsx` - UI with "View Interactive Trace" button
- `manifest.yml` - Added web module for API

### Remote Backend
- `server.js` - Express server with visualization routes
- `src/components/agent-prism/` - TraceViewer components (42 files)
- `src/views/TraceViewerPage.jsx` - React page component
- `package.json` - Updated with agent-prism dependencies

## Success Criteria

✅ Upload session in Forge app
✅ Session converted to OTLP
✅ API returns session data
✅ Remote backend displays session metadata
✅ "View Interactive Trace" button works
🚧 Full TraceViewer rendering (pending React build)

---

**Status**: System is functional with metadata visualization. Full interactive TraceViewer requires React build step (optional enhancement).
