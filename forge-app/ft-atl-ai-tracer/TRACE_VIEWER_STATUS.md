# TraceViewer Integration Status

## Current State

### ✅ Completed
1. **Agent-Prism Components Installed**
   - All 42 TypeScript component files copied to `src/components/agent-prism/`
   - TraceViewer, DetailsView, SpanCard, TraceList components present
   - Dependencies installed: `@evilmartians/agent-prism-data` and `@evilmartians/agent-prism-types`

2. **OTLP Data Conversion Pipeline**
   - Rovo Dev → OpenTelemetry converter fully functional
   - Session data successfully converted to OTLP format
   - Tested with real session: 44 messages → 210 spans ✓

3. **Backend Infrastructure**
   - Session storage and retrieval working
   - OTLP documents properly stored in Forge storage

### ⚠️ Current Limitation

**Agent-Prism components cannot run in Forge Custom UI environment**

**Reason**: Forge Custom UI uses a sandboxed React environment that:
- Doesn't support standard browser APIs (navigator.clipboard, DOM manipulation)
- Uses a custom webpack bundler with limited loader support
- Cannot process Tailwind CSS imports
- Requires all TypeScript to use UMD globals instead of ES modules
- Has no `lib: ["dom"]` in TypeScript configuration

**Build Errors Encountered**:
```
- Module not found: Can't resolve 'tailwindcss/colors'
- TS2686: 'React' refers to a UMD global, but the current file is a module
- TS2339: Property 'clipboard' does not exist on type 'Navigator'
- TS2812: Property 'focus' does not exist on type 'HTMLInputElement'
```

## Solutions

### Option 1: Remote Backend Visualization (Recommended)
**Status**: Infrastructure exists, needs implementation

The `forge-app/remote-backend/` server can:
- Host a full React app with agent-prism components
- Fetch OTLP data from Forge app via API
- Render interactive TraceViewer with no limitations
- Use OAuth for secure access

**Implementation Steps**:
1. Add agent-prism dependencies to remote-backend
2. Create visualization endpoint
3. Add API resolver in Forge app to expose OTLP data
4. Configure OAuth for authentication

**Advantages**:
- Full browser API support
- No Forge limitations
- Better performance
- Can use all agent-prism features

### Option 2: Forge UI Kit Only (Current State)
**Status**: ✅ Implemented

Display OTLP metadata using native Forge UI Kit components:
- Session details
- Token usage statistics
- Span summaries
- Sample span preview

**Limitations**:
- No interactive tree view
- No expandable span details
- Text-only visualization

### Option 3: Custom Forge-Compatible Visualization
**Status**: Not implemented

Build a simplified visualization using only Forge UI Kit:
- TreeView-like structure with Box/Stack
- Manual expand/collapse state
- Read OTLP data and format manually

**Trade-offs**:
- Significant development effort
- Limited compared to agent-prism
- Still subject to Forge UI limitations

## Recommendation

**Implement Option 1** (Remote Backend Visualization) because:

1. **Best User Experience**
   - Full interactive visualization
   - All agent-prism features available
   - Professional UI/UX

2. **Technical Feasibility**
   - Backend infrastructure already exists
   - OTLP data format is ready
   - OAuth setup documented

3. **Future Proof**
   - Not limited by Forge constraints
   - Can add more features easily
   - Easier to maintain

4. **Clear Separation**
   - Forge app: Data management (upload, store, convert)
   - Remote backend: Visualization (render, interact)

## Current Files

### Working
- ✅ `src/frontend/SessionViewer.jsx` - Displays OTLP metadata
- ✅ `src/frontend/SessionList.jsx` - Lists sessions
- ✅ `src/frontend/SessionUpload.jsx` - Upload interface
- ✅ `src/utils/rovoDevSessionConverter.js` - OTLP converter
- ✅ `src/resolvers/session-resolver.js` - Backend logic

### Not Usable in Forge
- ❌ `src/components/agent-prism/**/*.tsx` - Cannot build in Forge
- ❌ Agent-prism dependencies - Not compatible with Forge bundler

### Ready for Remote Backend
- 📦 All agent-prism components
- 📦 OTLP data format
- 📦 Session management API (needs exposure)

## Next Steps

To enable interactive TraceViewer visualization:

1. **Add Dependencies to Remote Backend**
   ```bash
   cd forge-app/remote-backend
   npm install @evilmartians/agent-prism-data @evilmartians/agent-prism-types
   npm install react react-dom lucide-react classnames
   ```

2. **Copy Agent-Prism Components**
   ```bash
   cp -r ../ft-atl-ai-tracer/src/components/agent-prism ./src/components/
   ```

3. **Create Visualization Endpoint**
   - Add route: `GET /session/:id/visualize`
   - Render TraceViewer component server-side or client-side
   - Fetch OTLP data from Forge app

4. **Expose Session Data API**
   - Add Forge resolver for external access
   - Implement OAuth authentication
   - Return OTLP document as JSON

5. **Link from Forge UI**
   - Add "View Interactive Trace" button in SessionViewer
   - Open remote backend URL in new window
   - Pass session ID securely

## Conclusion

The TraceViewer integration is **95% complete** from a data perspective:
- ✅ Data conversion working
- ✅ Storage working
- ✅ Components available
- ❌ Rendering blocked by Forge limitations

The path forward is clear: **Use the remote backend for visualization** while keeping the Forge app for data management.
