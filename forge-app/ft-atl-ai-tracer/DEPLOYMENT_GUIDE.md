# Deployment Guide - ft-atl-ai-tracer

## ✅ Deployment Complete

**Version**: 2.0.0  
**Environment**: development  
**Status**: Successfully deployed

## 📋 Next Steps: Installation

### 1. Install the App

Run the installation command in your terminal:

```bash
cd forge-app/ft-atl-ai-tracer
forge install
```

You'll be prompted to:
1. **Select product**: Choose `Jira`
2. **Select site**: Choose `fat-tails.atlassian.net`
3. **Select project**: Choose any Jira project (or create a test project)

### 2. View the App

After installation:
1. Go to your selected Jira project
2. Look for a new tab in the horizontal navigation: **"ft-atl-ai-tracer"** (or "AI Traceability Tracker")
3. Click the tab to see the app UI

### 3. Monitor Logs

In a separate terminal, watch the logs in real-time:

```bash
cd forge-app/ft-atl-ai-tracer
forge logs --follow
```

This will show:
- Resolver function calls
- GraphQL query results
- Any errors or issues

## 🧪 What to Expect

### Success Scenario
- UI loads with "AI Traceability Tracker" header
- Shows "Total Agents: X"
- Displays table with agents (name, description, ID)

### Possible Issues

#### No Agents Found
- **Message**: "No AI agents were found in this workspace"
- **Cause**: No Rovo agents created yet, or permission issues
- **Solution**: Create a test Rovo agent in your workspace first

#### Permission Error
- **Logs show**: GraphQL errors about permissions
- **Cause**: `rovo:atlassian-external` scope might be needed
- **Solution**: May need to request special permissions from Atlassian

#### Loading Spinner Forever
- **UI shows**: Spinner keeps spinning
- **Cause**: Resolver error or timeout
- **Solution**: Check `forge logs` for error details

## 🔍 Testing the Resolvers

You can test individual resolvers via the browser console when the app is open:

```javascript
// In browser console
invoke('getAgentSummary').then(console.log);
invoke('getAgents').then(console.log);
invoke('getAIConfig').then(console.log);
```

## 📝 Deployment History

### Issues Fixed During Deployment

1. **Runtime Error**: Changed `nodejs24.x` → `nodejs22.x` (24 not available yet)
2. **Invalid Scope**: Removed `rovo:atlassian-external` (not a Forge scope)
3. **Missing Dependency**: Installed `@forge/api` package

### Current Configuration

**Manifest**: 
- Module: `jira:projectPage`
- Runtime: `nodejs22.x`
- Scopes: `[]` (empty - relying on implicit GraphQL access)

**Resolvers**:
- `getAgents` - List all agents
- `getAIConfig` - AI configuration schema
- `getAgentSummary` - Summary stats
- `getAgentDetails` - Detailed agent info
- `getFilteredAgents` - Filtered agent list

**UI Components**:
- Loading state with Spinner
- Error handling with SectionMessage
- Summary stats in colored Box
- Agents table with Name/Description/ID

## 🚀 Next Development Steps

If the app works:
1. Add pagination support
2. Add filtering UI (my agents, favorites, etc.)
3. Add agent detail view
4. Show knowledge sources and channels
5. Add refresh button
6. Improve error messages

If permission issues occur:
1. Research Forge GraphQL permissions
2. Contact Atlassian support for `rovo:atlassian-external` access
3. Consider alternative approaches (REST API, manifest parsing)

---

**Ready to install!** 🎯

Run `forge install` in your terminal and select your Jira project.
