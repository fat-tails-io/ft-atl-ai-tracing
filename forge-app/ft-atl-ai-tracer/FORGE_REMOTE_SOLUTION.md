# Forge Remote Solution Architecture
## Solving the OAuth Scope Limitation

## Problem Statement

The GraphQL API endpoint `agentStudio_getAgents` requires the OAuth scope `rovo:atlassian-external`, which is not available to Forge apps using standard `requestGraph()`. This prevents Forge apps from programmatically listing AI agents in a workspace.

## Solution: Forge Remote + Storage Pattern

Use Forge Remote to host a custom backend that handles OAuth authentication, queries the GraphQL API, and stores results in Forge Storage for the UI to access.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     ATLASSIAN CLOUD                          │
│                                                              │
│  ┌──────────────┐                    ┌──────────────┐      │
│  │  UI Kit      │─────invoke()──────▶│   Resolver   │      │
│  │  Frontend    │◀────response───────│   Function   │      │
│  └──────────────┘                    └──────┬───────┘      │
│                                              │              │
│                                              │ read         │
│                                              ▼              │
│                                    ┌─────────────────┐     │
│                                    │ Forge Storage   │     │
│                                    │ (KVS/Entities)  │     │
│                                    └────────┬────────┘     │
│                                             ▲              │
│                                             │ write        │
└─────────────────────────────────────────────┼──────────────┘
                                              │
                    ┌─────────────────────────┘
                    │ invokeRemote()
                    │ (with app token)
                    ▼
┌─────────────────────────────────────────────────────────────┐
│               YOUR REMOTE BACKEND                            │
│           (Node.js/Express on your infrastructure)           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Sync Agents Endpoint                                │  │
│  │  1. Receive request from Forge                       │  │
│  │  2. Use OAuth credentials to call GraphQL API        │  │
│  │  3. Query agentStudio_getAgents                      │  │
│  │  4. Transform data                                   │  │
│  │  5. Store in Forge Storage via REST API             │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                     │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        │ HTTPS + OAuth
                        ▼
┌─────────────────────────────────────────────────────────────┐
│           ATLASSIAN GRAPHQL GATEWAY                          │
│                                                              │
│  /gateway/api/graphql                                       │
│  Query: agentStudio_getAgents                               │
│  Scope: rovo:atlassian-external ✓                           │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Forge App (UI Kit + Resolver)

**Manifest** (`manifest.yml`):
```yaml
app:
  id: ari:cloud:ecosystem::app/your-app-id

modules:
  jira:projectPage:
    - key: ai-tracer-page
      resource: main
      resolver:
        function: resolver
      render: native
      title: AI Traceability Tracker

permissions:
  scopes:
    - storage:app                          # Read/write local storage
    - storage:app:read:app-system-token    # Remote can access storage

endpoint:
  - key: sync-agents-endpoint
    remote: ai-sync-remote
    auth:
      appSystemToken: true                 # Pass token to remote

remotes:
  - key: ai-sync-remote
    baseUrl: ${REMOTE_BACKEND_URL}         # Your hosted backend
```

**Resolver** (`src/resolvers/index.js`):
```javascript
import Resolver from '@forge/resolver';
import { kvs } from '@forge/kvs';
import { invokeRemote } from '@forge/api';

const resolver = new Resolver();

// Trigger sync from remote backend
resolver.define('syncAgents', async (req) => {
  try {
    const response = await invokeRemote('sync-agents-endpoint', {
      method: 'POST',
      path: '/sync-agents'
    });
    
    return {
      success: true,
      message: 'Agent sync initiated'
    };
  } catch (error) {
    console.error('Sync error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Read agents from Forge Storage
resolver.define('getAgents', async (req) => {
  try {
    const agents = await kvs.get('agents-list');
    const lastSync = await kvs.get('agents-last-sync');
    
    return {
      success: true,
      data: {
        agents: agents || [],
        lastSync: lastSync || null
      }
    };
  } catch (error) {
    console.error('Get agents error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

export const handler = resolver.getDefinitions();
```

**UI** (`src/frontend/index.jsx`):
```javascript
import React, { useEffect, useState } from 'react';
import ForgeReconciler, { 
  Button, 
  Text, 
  Heading,
  Stack,
  Table,
  Spinner
} from '@forge/react';
import { invoke } from '@forge/bridge';

const App = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    const result = await invoke('getAgents');
    if (result.success) {
      setAgents(result.data.agents);
    }
    setLoading(false);
  };

  const syncAgents = async () => {
    setSyncing(true);
    await invoke('syncAgents');
    // Wait a bit for sync to complete
    setTimeout(loadAgents, 2000);
    setSyncing(false);
  };

  return (
    <Stack space="space.300">
      <Heading size="large">AI Agents</Heading>
      <Button onClick={syncAgents} isDisabled={syncing}>
        {syncing ? 'Syncing...' : 'Sync Agents'}
      </Button>
      {loading ? <Spinner /> : (
        <Table>
          {/* Display agents */}
        </Table>
      )}
    </Stack>
  );
};

ForgeReconciler.render(<App />);
```

### 2. Remote Backend (Node.js/Express)

**Server** (`remote-backend/server.js`):
```javascript
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// OAuth configuration
const OAUTH_CONFIG = {
  clientId: process.env.ATLASSIAN_CLIENT_ID,
  clientSecret: process.env.ATLASSIAN_CLIENT_SECRET,
  scope: 'rovo:atlassian-external'
};

// Get OAuth access token
async function getAccessToken() {
  const response = await axios.post(
    'https://auth.atlassian.com/oauth/token',
    {
      grant_type: 'client_credentials',
      client_id: OAUTH_CONFIG.clientId,
      client_secret: OAUTH_CONFIG.clientSecret,
      scope: OAUTH_CONFIG.scope
    }
  );
  return response.data.access_token;
}

// Query GraphQL API
async function queryAgents(cloudId, accessToken) {
  const query = `
    query GetAgents($cloudId: String!, $first: Int) {
      agentStudio_getAgents(cloudId: $cloudId, first: $first) {
        edges {
          node {
            id
            name
            description
          }
        }
      }
    }
  `;

  const response = await axios.post(
    'https://api.atlassian.com/graphql',
    { query, variables: { cloudId, first: 50 } },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.data.agentStudio_getAgents.edges.map(e => e.node);
}

// Store in Forge Storage
async function storeInForge(forgeToken, agents) {
  const response = await axios.post(
    'https://api.atlassian.com/forge/storage/kvs/v1/set',
    {
      key: 'agents-list',
      value: agents
    },
    {
      headers: {
        'Authorization': `Bearer ${forgeToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // Store last sync time
  await axios.post(
    'https://api.atlassian.com/forge/storage/kvs/v1/set',
    {
      key: 'agents-last-sync',
      value: new Date().toISOString()
    },
    {
      headers: {
        'Authorization': `Bearer ${forgeToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
}

// Endpoint: Sync agents
app.post('/sync-agents', async (req, res) => {
  try {
    // Extract Forge token from header
    const forgeToken = req.headers['x-forge-oauth-system'];
    if (!forgeToken) {
      return res.status(401).json({ error: 'Missing Forge token' });
    }

    // Get cloudId from request body (passed from Forge)
    const { cloudId } = req.body;

    // 1. Get OAuth access token
    const accessToken = await getAccessToken();

    // 2. Query GraphQL API
    const agents = await queryAgents(cloudId, accessToken);

    // 3. Store in Forge Storage
    await storeInForge(forgeToken, agents);

    res.json({
      success: true,
      agentsCount: agents.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Remote backend running on port ${PORT}`);
});
```

### 3. OAuth App Registration

**Steps to register OAuth app:**

1. Go to https://developer.atlassian.com/console/myapps/
2. Create new OAuth 2.0 (3LO) app
3. Add permissions: `rovo:atlassian-external`
4. Get Client ID and Client Secret
5. Set environment variables in remote backend

## Data Flow

### Initial Sync

1. User clicks "Sync Agents" button in UI
2. UI calls `invoke('syncAgents')`
3. Resolver calls `invokeRemote('sync-agents-endpoint')`
4. Remote backend:
   - Receives request with `x-forge-oauth-system` token
   - Uses OAuth credentials to get access token
   - Calls GraphQL API with `rovo:atlassian-external` scope
   - Receives agent list
   - Stores in Forge KVS via REST API
5. UI polls or waits, then calls `invoke('getAgents')`
6. Resolver reads from Forge KVS
7. UI displays agents

### Subsequent Reads

1. User opens app
2. UI calls `invoke('getAgents')`
3. Resolver reads from Forge KVS (no GraphQL call!)
4. UI displays cached agents
5. User can manually sync to refresh

## Benefits

✅ **Solves OAuth scope limitation** - Remote can get required scope
✅ **Fast reads** - Data cached in Forge Storage
✅ **Standard Forge scopes** - App uses `storage:app` only
✅ **Separation of concerns** - OAuth complexity isolated in remote
✅ **Scalable** - Can add scheduled syncs, webhooks, etc.

## Trade-offs

⚠️ **Hosting required** - Need to run remote backend
⚠️ **OAuth setup** - Register separate OAuth app
⚠️ **Data freshness** - Cached data may be stale
⚠️ **Complexity** - More moving parts than direct approach

## Implementation Checklist

- [ ] Set up remote backend (Node.js/Express)
- [ ] Register OAuth 2.0 app with Atlassian
- [ ] Configure OAuth scopes (`rovo:atlassian-external`)
- [ ] Update Forge manifest with endpoint and remote
- [ ] Implement sync endpoint in remote backend
- [ ] Add OAuth token exchange logic
- [ ] Implement GraphQL query logic
- [ ] Implement Forge Storage write logic
- [ ] Update Forge resolver to read from storage
- [ ] Add sync trigger in UI
- [ ] Test end-to-end flow
- [ ] Deploy remote backend
- [ ] Configure environment variables
- [ ] Test in production

## Alternative: Scheduled Sync

Instead of manual sync, use Forge scheduled trigger:

```yaml
function:
  - key: scheduled-sync
    handler: scheduledSync
    
triggers:
  - key: agent-sync-trigger
    function: scheduled-sync
    events:
      - avi:forge:scheduled:cron
    cron: "0 */6 * * *"  # Every 6 hours
```

This keeps data fresh automatically without user interaction.

---

**Status**: Solution designed
**Next**: Implementation
**Complexity**: Medium (requires remote hosting)
**Demo-ready**: Yes (with hosted backend)
