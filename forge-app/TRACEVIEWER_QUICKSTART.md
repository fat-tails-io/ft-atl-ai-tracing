# TraceViewer - Quick Start Guide 🚀

## What You Have

✅ **Forge App**: Deployed and ready
✅ **Remote Backend**: Configured with agent-prism components
✅ **OTLP Conversion**: Working and tested
✅ **Visualization**: Ready to use

## Start Using in 3 Steps

### Step 1: Start Remote Backend (30 seconds)

```bash
cd forge-app/remote-backend
npm install  # First time only
npm start
```

Wait for:
```
✅ Server running on http://localhost:3000
```

### Step 2: Open Your Jira Project (10 seconds)

1. Go to your Jira site (e.g., fat-tails.atlassian.net)
2. Open a project where the app is installed
3. Click the **"AI Traceability Tracker"** tab

### Step 3: Upload and View Session (30 seconds)

1. **Click "Upload Session"** tab
2. **Paste your session_context.json** content
3. **Click "Upload"**
4. **Go to "Sessions"** tab
5. **Click on your session** to view details
6. **Click "🔍 View Interactive Trace"** button
7. **New window opens** showing your trace!

## That's It! 🎉

You now have:
- ✅ Session stored in OTLP format
- ✅ Metadata displayed in Forge
- ✅ Visualization window showing trace details
- ✅ Token usage tracking
- ✅ Span breakdown

## What You See

### In Forge App:
```
┌─────────────────────────────────────┐
│  Sessions List                      │
│  ┌───────────────────────────────┐  │
│  │ ● Session Title               │  │
│  │   44 messages | 210 spans     │  │
│  │   248K input tokens           │  │
│  └───────────────────────────────┘  │
│                                     │
│  Click session → View details       │
│  Click "View Interactive Trace" →   │
└─────────────────────────────────────┘
```

### In Visualization Window:
```
┌─────────────────────────────────────┐
│  🔍 AI Traceability Tracker         │
│  Session: Your Session Title        │
├─────────────────────────────────────┤
│  Messages: 44                       │
│  Spans: 210                         │
│  Input Tokens: 248,000              │
│  Output Tokens: 4,800               │
├─────────────────────────────────────┤
│  📊 OpenTelemetry Trace Data        │
│  This session contains 210 spans    │
└─────────────────────────────────────┘
```

## Test Data

If you need test data, use any Rovo Dev `session_context.json` file. Example location:
```
~/.rovo-dev/sessions/*/session_context.json
```

## Troubleshooting

**Button doesn't work?**
- Check remote backend is running on port 3000
- Check browser console for errors
- Disable pop-up blocker if needed

**No session data in visualization?**
- Make sure you clicked the button from Forge app
- Don't navigate to visualization URL directly

**Can't find the app in Jira?**
- Check it's installed: `forge install --upgrade`
- Look for "AI Traceability Tracker" in project tabs

## Next: Full TraceViewer

The current setup shows all your session data. To get the **full interactive tree view**:

See `TRACEVIEWER_COMPLETE.md` for building the React bundle.

---

**You're all set!** Start the backend, open Jira, and visualize your AI sessions! 🎊
