# OAuth App Setup Guide

## Step-by-Step: Register OAuth 2.0 App with Atlassian

### 1. Go to Atlassian Developer Console

Open: https://developer.atlassian.com/console/myapps/

### 2. Create New OAuth Integration

1. Click **"Create"** button (top right)
2. Select **"OAuth 2.0 integration"**

### 3. Configure Basic Information

**App name:** AI Traceability Tracker Remote

**Description:** Remote backend for querying AI agent data via GraphQL API

**Privacy policy URL:** (can leave blank for development)

**Terms of service URL:** (can leave blank for development)

Click **"Create"**

### 4. Add Permissions (CRITICAL!)

1. In your new app, click **"Permissions"** tab (left sidebar)
2. Click **"Add"** in the Permissions section
3. Search for: **`rovo:atlassian-external`**
4. Check the box next to it
5. Click **"Configure"** or **"Save"**

**Note:** If you don't see `rovo:atlassian-external`, you may need to:
- Check if Rovo is enabled in your tenant
- Contact Atlassian support for access
- Use a different scope (though this won't work for `agentStudio_getAgents`)

### 5. Configure Settings

1. Go to **"Settings"** tab
2. **Authorization callback URL:** `http://localhost:3000/callback` (not used for client credentials, but may be required)
3. **OAuth 2.0 Grant Type:** Ensure **"Client credentials"** is enabled

### 6. Get Your Credentials

1. Go to **"Authorization"** or **"Settings"** tab
2. Find your:
   - **Client ID** (looks like: `abc123xyz...`)
   - **Client Secret** (click "Generate secret" if needed)

**⚠️ Important:** Copy these NOW - the secret is only shown once!

### 7. Update Your .env File

```bash
cd forge-app/remote-backend
nano .env  # or use your editor
```

Add your credentials:

```env
ATLASSIAN_CLIENT_ID=your-actual-client-id-here
ATLASSIAN_CLIENT_SECRET=your-actual-client-secret-here
ATLASSIAN_CLOUD_ID=461ac988-c247-484a-abf8-095fbedbdfd6
```

### 8. Verify Your Setup

**Your OAuth app should have:**
- ✅ Name: "AI Traceability Tracker Remote" (or similar)
- ✅ Type: OAuth 2.0 integration
- ✅ Grant type: Client credentials enabled
- ✅ Permission: `rovo:atlassian-external`
- ✅ Client ID and Secret generated

## Testing OAuth Setup

### Test 1: Health Check

```bash
cd forge-app/remote-backend
npm start
```

In another terminal:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "ft-atl-ai-tracer-remote",
  "config": {
    "hasClientId": true,
    "hasClientSecret": true,
    "hasCloudId": true
  }
}
```

All should be `true`.

### Test 2: OAuth Token

Add this test endpoint to your server (temporary):

```javascript
app.get('/test-oauth', async (req, res) => {
  try {
    const token = await getOAuthToken();
    res.json({
      success: true,
      message: 'OAuth working!',
      tokenLength: token.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

Then test:
```bash
curl http://localhost:3000/test-oauth
```

Expected:
```json
{
  "success": true,
  "message": "OAuth working!",
  "tokenLength": 1234
}
```

### Test 3: Full Sync (without Forge)

This won't work completely without a Forge token, but will test OAuth + GraphQL:

```bash
curl -X POST http://localhost:3000/sync-agents \
  -H "Content-Type: application/json" \
  -H "x-forge-oauth-system: test-token"
```

Expected: OAuth should work, GraphQL should work, only Forge Storage will fail.

## Troubleshooting

### Error: "Missing required configuration"

**Problem:** `.env` file missing or incomplete

**Solution:**
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

### Error: "OAuth failed: invalid_client"

**Problem:** Client ID or Secret is wrong

**Solution:**
- Double-check you copied correctly (no spaces!)
- Regenerate the secret in Developer Console
- Make sure you're using the right app

### Error: "OAuth failed: invalid_scope"

**Problem:** `rovo:atlassian-external` scope not added to your OAuth app

**Solution:**
1. Go to Developer Console
2. Click your app
3. Permissions tab
4. Add `rovo:atlassian-external`
5. Save

### Error: "This request does not contain the right authorisation scopes"

**Problem:** OAuth token obtained successfully but doesn't have the right scope

**Solution:**
- Verify the scope is added in Developer Console
- Try deleting and re-adding the scope
- Wait a few minutes (can take time to propagate)
- Contact Atlassian support if scope is unavailable

### Can't Find `rovo:atlassian-external` Scope

**Problem:** Scope may not be publicly available yet

**Possible solutions:**
1. Check if Rovo is enabled in your tenant (fat-tails.atlassian.net)
2. Try alternative scopes (though they won't work for this specific query)
3. Contact Atlassian Developer Support
4. For demo purposes, document the limitation

## What Scope Names to Look For

If `rovo:atlassian-external` doesn't exist, try searching for:
- `rovo`
- `ai`
- `agent`
- `atlassian-external`

The scope name might be:
- `rovo:external`
- `ai:read`
- `agent:read`

(Though these are guesses - `rovo:atlassian-external` is what the GraphQL API requires)

## Next Steps After Setup

Once OAuth is working:

1. ✅ Test `/test-oauth` endpoint
2. ✅ Verify GraphQL query works
3. ✅ Set up ngrok: `ngrok http 3000`
4. ✅ Update Forge manifest with ngrok URL
5. ✅ Test full flow with Forge app

---

**Need Help?**

If you get stuck, let me know what error you're seeing and I can help debug!
