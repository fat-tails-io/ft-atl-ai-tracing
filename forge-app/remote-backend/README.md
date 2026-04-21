# Remote Backend for AI Traceability Tracker

This Node.js server runs on your laptop and acts as the remote backend for the Forge app.

## Purpose

Handles OAuth authentication to query the GraphQL API (which requires `rovo:atlassian-external` scope), then stores the results in Forge Storage for the app to display.

## Setup

### 1. Install Dependencies

```bash
cd forge-app/remote-backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your OAuth credentials:

```env
ATLASSIAN_CLIENT_ID=your-client-id
ATLASSIAN_CLIENT_SECRET=your-client-secret
ATLASSIAN_CLOUD_ID=461ac988-c247-484a-abf8-095fbedbdfd6
```

### 3. Get OAuth Credentials

1. Go to https://developer.atlassian.com/console/myapps/
2. Click "Create" → "OAuth 2.0 integration"
3. Name: "AI Traceability Tracker Remote"
4. Permissions → Add: `rovo:atlassian-external`
5. Get your Client ID and Client Secret
6. Add to `.env`

## Running the Server

### Local Development

```bash
npm start
```

Server runs on http://localhost:3000

### Expose for Forge (Demo)

Use ngrok to create a public URL:

```bash
# Install ngrok (if not installed)
npm install -g ngrok

# Expose port 3000
ngrok http 3000
```

This gives you a URL like: `https://abc123.ngrok.io`

Update your Forge manifest with this URL:

```yaml
remotes:
  - key: ai-sync-remote
    baseUrl: https://abc123.ngrok.io
```

## Endpoints

### GET /health

Health check endpoint

```bash
curl http://localhost:3000/health
```

### POST /sync-agents

Main endpoint - called by Forge app

Headers required:
- `x-forge-oauth-system`: Forge system token (automatically added by Forge)

Response:
```json
{
  "success": true,
  "agentsCount": 5,
  "hasMore": false,
  "timestamp": "2026-03-20T16:30:00.000Z",
  "message": "Successfully synced 5 agents"
}
```

## How It Works

1. Forge app calls `invokeRemote('sync-agents-endpoint', ...)`
2. Request arrives at `/sync-agents` with Forge token in header
3. Server:
   - Gets OAuth access token from Atlassian
   - Queries GraphQL API for agents
   - Stores results in Forge Storage
4. Forge app reads from Forge Storage
5. UI displays agents

## Testing

### Test Health Check

```bash
curl http://localhost:3000/health
```

### Test Sync (requires Forge token)

This will fail without a valid Forge token, but tests the flow:

```bash
curl -X POST http://localhost:3000/sync-agents \
  -H "Content-Type: application/json" \
  -H "x-forge-oauth-system: fake-token-for-test"
```

## Troubleshooting

### "Missing required configuration"

Make sure `.env` file exists and contains:
- ATLASSIAN_CLIENT_ID
- ATLASSIAN_CLIENT_SECRET  
- ATLASSIAN_CLOUD_ID

### "OAuth failed"

Check that your OAuth app has the `rovo:atlassian-external` scope enabled.

### "GraphQL errors"

The OAuth token may not have the right permissions. Verify:
1. OAuth app has correct scope
2. Cloud ID is correct
3. Token is valid (not expired)

### "Storage failed"

The Forge token from `x-forge-oauth-system` header may be invalid. This header is automatically added by Forge when using `invokeRemote()`.

## For Demo/Presentation

1. Start server: `npm start`
2. In another terminal: `ngrok http 3000`
3. Copy ngrok URL
4. Update Forge manifest remote URL
5. Deploy Forge app
6. Test sync in UI
7. During presentation:
   - Show backend console logs
   - Explain OAuth flow
   - Show GraphQL query
   - Show Forge Storage write

## Logs

The server logs show each step:

```
🚀 === SYNC AGENTS REQUEST ===
✅ Forge token received
🔑 Requesting OAuth token...
✅ OAuth token obtained
🔍 Querying GraphQL API for agents...
✅ Found 5 agents
💾 Storing agents in Forge Storage...
✅ Stored in Forge Storage
✅ Sync complete!
```

Perfect for live demo!
