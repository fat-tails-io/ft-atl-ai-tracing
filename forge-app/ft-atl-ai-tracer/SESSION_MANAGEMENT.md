# Rovo Dev Session Management

This Forge app now includes a complete session management system for uploading, storing, and viewing Rovo Dev sessions in OpenTelemetry format.

## Features

### 1. Session Upload
- Upload Rovo Dev sessions via the UI
- Paste `session_context.json` and optional `metadata.json`
- Automatic conversion to OpenTelemetry OTLP format
- Stored in Forge local storage for retrieval

### 2. Session Storage
Sessions are stored with the following structure:
```javascript
{
  id: "session-id",
  title: "Session Title",
  workspace: "/workspace/path",
  timestamp: 1774283517,
  uploadedAt: 1774284799799,
  messageCount: 44,
  spanCount: 210,
  usage: {
    input_tokens: 248175,
    output_tokens: 4814,
    cache_read_tokens: 207172,
    cache_write_tokens: 40958
  },
  otlpDocument: { /* Full OTLP trace */ }
}
```

### 3. Session List & Statistics
- View all uploaded sessions in a table
- Session metadata: title, workspace, date, message count, spans, tokens
- Aggregate statistics across all sessions
- Delete individual sessions or clear all

### 4. Session Viewer
- View detailed session information
- Display OpenTelemetry trace metadata
- Show token usage breakdown
- Preview span types and structure
- Ready for agent-prism visualization (next step)

## UI Components

### Frontend Components
- **`SessionUpload.jsx`** - Upload interface with JSON paste areas
- **`SessionList.jsx`** - List view with statistics and actions
- **`SessionViewer.jsx`** - Detailed session view
- **`index.jsx`** - Main app with tabs (AI Agents, Sessions, Upload)

### Backend Resolvers
- **`uploadSession`** - Upload and convert session to OTLP
- **`listSessions`** - Get all session metadata
- **`getSession`** - Get full session with OTLP document
- **`deleteSession`** - Remove a session
- **`clearAllSessions`** - Remove all sessions
- **`getSessionStats`** - Get aggregate statistics

## How to Use

### 1. Upload a Session

1. Navigate to the **Upload Session** tab
2. Copy your session files:
   ```bash
   cat ~/.rovodev/sessions/[session-id]/session_context.json
   cat ~/.rovodev/sessions/[session-id]/metadata.json
   ```
3. Paste the JSON content into the text areas
4. Click **Upload Session**
5. The session will be converted to OTLP and stored

### 2. View Sessions

1. Navigate to the **Sessions** tab
2. See all uploaded sessions with statistics
3. Click **View** to see session details
4. Click **Delete** to remove a session

### 3. Session Statistics

The Sessions tab shows aggregate statistics:
- Total sessions, messages, and spans
- Total token usage (input, output, cache reads/writes)
- Session list sorted by date (newest first)

## Technical Details

### Storage Keys
- `rovodev-sessions` - Array of session metadata (index)
- `session:{sessionId}` - Individual session with full OTLP document

### Conversion Process
1. Frontend uploads raw Rovo Dev JSON
2. Backend calls `convertRovoDevSessionToOTLP()`
3. OTLP document is generated with hierarchical spans
4. Session metadata and OTLP stored in Forge storage
5. Session added to searchable index

### Data Flow
```
User Pastes JSON
    ↓
SessionUpload component
    ↓
invoke('uploadSession', { sessionContext, metadata })
    ↓
session-resolver.js
    ↓
rovoDevSessionConverter.js
    ↓
convertRovoDevSessionToOTLP()
    ↓
Forge Storage (storage.set)
    ↓
Session available for viewing
```

## Test Results

✅ All functionality tested and verified:
- Session upload: **210 spans** from 44 messages
- Session listing: Multiple sessions displayed
- Session retrieval: Full OTLP document retrieved
- Statistics: Accurate aggregation
- Token tracking: Input, output, cache read/write

## Next Steps

1. **Install agent-prism dependencies**
2. **Add agent-prism React components**
3. **Integrate TraceViewer component**
4. **Visualize OTLP traces with interactive diagrams**

## Example Session Stats

From a real Rovo Dev session:
- **Messages**: 44 interactions
- **Spans**: 210 OpenTelemetry spans
- **Input Tokens**: 248,175
- **Output Tokens**: 4,814
- **Cache Read**: 207,172 tokens
- **Cache Write**: 40,958 tokens

This demonstrates the rich traceability data now available for AI governance and debugging.
