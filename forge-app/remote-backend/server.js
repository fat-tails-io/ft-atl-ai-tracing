/**
 * Remote Backend for ft-atl-ai-tracer
 * Handles OAuth authentication, GraphQL queries, and Forge Storage integration
 */

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Configuration
const config = {
  atlassian: {
    clientId: process.env.ATLASSIAN_CLIENT_ID,
    clientSecret: process.env.ATLASSIAN_CLIENT_SECRET,
    cloudId: process.env.ATLASSIAN_CLOUD_ID,
    graphqlUrl: 'https://api.atlassian.com/graphql',
    authUrl: 'https://auth.atlassian.com/oauth/token'
  },
  forge: {
    storageUrl: 'https://api.atlassian.com/forge/storage/kvs/v1'
  },
  port: process.env.PORT || 3000
};

// Validate configuration
function validateConfig() {
  const required = ['clientId', 'clientSecret', 'cloudId'];
  const missing = required.filter(key => !config.atlassian[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required configuration:');
    missing.forEach(key => console.error(`   - ATLASSIAN_${key.toUpperCase()}`));
    console.error('\nPlease copy .env.example to .env and fill in the values.');
    process.exit(1);
  }
}

/**
 * Get OAuth access token from Atlassian
 * Tries with and without the rovo:atlassian-external scope
 */
async function getOAuthToken(tryWithoutScope = false) {
  console.log('🔑 Requesting OAuth token...');
  
  const requestBody = {
    grant_type: 'client_credentials',
    client_id: config.atlassian.clientId,
    client_secret: config.atlassian.clientSecret
  };
  
  // Only add scope if not trying without it
  if (!tryWithoutScope) {
    requestBody.scope = 'rovo:atlassian-external';
    console.log('   Trying with scope: rovo:atlassian-external');
  } else {
    console.log('   Trying without any scope');
  }
  
  try {
    const response = await axios.post(
      config.atlassian.authUrl,
      requestBody,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    console.log('✅ OAuth token obtained');
    return response.data.access_token;
  } catch (error) {
    console.error('❌ OAuth token error:', error.response?.data || error.message);
    
    // If scope failed and we haven't tried without scope yet, try again
    const errorDesc = error.response?.data?.error_description || '';
    const errorMsg = error.response?.data?.error || '';
    if (!tryWithoutScope && (errorDesc.includes('scope') || errorMsg.includes('scope') || errorDesc.includes('invalid'))) {
      console.log('⚠️  Scope failed, trying without scope...');
      return getOAuthToken(true);
    }
    
    throw new Error(`OAuth failed: ${error.response?.data?.error_description || error.message}`);
  }
}

/**
 * Query GraphQL API for AI agents
 * Uses the Forge Installation Token (FIT) which has proper scopes!
 */
async function queryAgents(forgeToken) {
  console.log('🔍 Querying GraphQL API for agents...');
  console.log('   Using Forge Installation Token (FIT)');
  
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
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      config.atlassian.graphqlUrl,
      {
        query,
        variables: {
          cloudId: config.atlassian.cloudId,
          first: 50
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${forgeToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.errors) {
      console.error('❌ GraphQL errors:', JSON.stringify(response.data.errors, null, 2));
      throw new Error(response.data.errors[0]?.message || 'GraphQL query failed');
    }

    const agents = response.data.data.agentStudio_getAgents.edges.map(edge => edge.node);
    console.log(`✅ Found ${agents.length} agents`);
    
    return {
      agents,
      hasMore: response.data.data.agentStudio_getAgents.pageInfo.hasNextPage,
      totalRetrieved: agents.length
    };
  } catch (error) {
    console.error('❌ GraphQL query error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Store agents in Forge Storage
 */
async function storeInForge(forgeToken, data) {
  console.log('💾 Storing agents in Forge Storage...');
  
  try {
    // Store agents list
    await axios.post(
      `${config.forge.storageUrl}/set`,
      {
        key: 'agents-list',
        value: data.agents
      },
      {
        headers: {
          'Authorization': `Bearer ${forgeToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Store metadata
    await axios.post(
      `${config.forge.storageUrl}/set`,
      {
        key: 'agents-metadata',
        value: {
          lastSync: new Date().toISOString(),
          totalAgents: data.totalRetrieved,
          hasMore: data.hasMore
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${forgeToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Stored in Forge Storage');
  } catch (error) {
    console.error('❌ Forge Storage error:', error.response?.data || error.message);
    throw new Error(`Storage failed: ${error.message}`);
  }
}

/**
 * Main endpoint: Sync agents
 */
app.post('/sync-agents', async (req, res) => {
  console.log('\n🚀 === SYNC AGENTS REQUEST ===');
  
  try {
    // Extract Forge token from header
    const forgeToken = req.headers['x-forge-oauth-system'];
    if (!forgeToken) {
      console.error('❌ Missing Forge token in headers');
      return res.status(401).json({
        success: false,
        error: 'Missing x-forge-oauth-system header'
      });
    }

    console.log('✅ Forge token received');

    // Use FIT token to query GraphQL API (it has the right scopes!)
    const agentData = await queryAgents(forgeToken);

    // Step 3: Store in Forge Storage
    await storeInForge(forgeToken, agentData);

    console.log('✅ Sync complete!\n');

    res.json({
      success: true,
      agentsCount: agentData.totalRetrieved,
      hasMore: agentData.hasMore,
      timestamp: new Date().toISOString(),
      message: `Successfully synced ${agentData.totalRetrieved} agents`
    });

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    console.error(error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ft-atl-ai-tracer-remote',
    timestamp: new Date().toISOString(),
    config: {
      hasClientId: !!config.atlassian.clientId,
      hasClientSecret: !!config.atlassian.clientSecret,
      hasCloudId: !!config.atlassian.cloudId
    }
  });
});

/**
 * Test OAuth endpoint - verify OAuth credentials work
 */
app.get('/test-oauth', async (req, res) => {
  console.log('\n🧪 === TESTING OAUTH ===');
  
  try {
    const token = await getOAuthToken();
    console.log('✅ OAuth token obtained successfully!');
    console.log(`   Token length: ${token.length} characters`);
    
    res.json({
      success: true,
      message: 'OAuth working!',
      tokenLength: token.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ OAuth test failed:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Visualization endpoint - Serves the TraceViewer page
 */
app.get('/visualize/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const FORGE_APP_URL = process.env.FORGE_APP_URL || 'https://your-forge-app.atlassian.net';
  
  // Serve HTML page that will load the TraceViewer
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trace Viewer - ${sessionId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f4f5f7; height: 100vh; display: flex; flex-direction: column;
    }
    .header { background: #0052CC; color: white; padding: 16px 24px; border-bottom: 2px solid #0747A6; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
    .header .subtitle { margin-top: 8px; font-size: 14px; opacity: 0.9; }
    .content { flex: 1; padding: 24px; overflow: auto; }
    .loading { display: flex; justify-content: center; align-items: center; height: 100%; font-size: 18px; color: #666; }
    .error { background: #fee; border: 2px solid #c00; border-radius: 8px; padding: 24px; margin: 20px auto; max-width: 600px; color: #600; }
    .error h2 { color: #c00; margin-bottom: 16px; }
    .session-info { background: white; border-radius: 8px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .session-info h2 { margin-bottom: 16px; color: #172B4D; }
    .metadata { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 16px; }
    .metadata-item { padding: 12px; background: #f4f5f7; border-radius: 4px; }
    .metadata-item label { display: block; font-size: 12px; color: #6B778C; margin-bottom: 4px; text-transform: uppercase; font-weight: 600; }
    .metadata-item value { display: block; font-size: 16px; color: #172B4D; font-weight: 500; }
    .trace-container { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); min-height: 400px; }
    .trace-placeholder { text-align: center; padding: 60px 20px; color: #6B778C; }
    .trace-placeholder h3 { margin-bottom: 12px; color: #172B4D; }
    button { padding: 8px 16px; background: #0052CC; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500; }
    button:hover { background: #0747A6; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔍 AI Traceability Tracker - Interactive Trace Viewer</h1>
    <div class="subtitle">Session ID: ${sessionId}</div>
  </div>
  <div class="content">
    <div id="session-info"></div>
    <div id="trace-viewer" class="trace-container">
      <div class="loading">Loading session data...</div>
    </div>
  </div>
  <script>
    const sessionId = '${sessionId}';
    
    async function loadSession() {
      try {
        // Try to load from localStorage (set by Forge app)
        const storageKey = 'session_' + sessionId;
        const sessionData = localStorage.getItem(storageKey);
        
        if (!sessionData) {
          throw new Error('Session data not found. Please open this window from the Forge app.');
        }
        
        const session = JSON.parse(sessionData);
        displaySessionInfo(session);
        displayTrace(session);
      } catch (error) {
        console.error('Error loading session:', error);
        document.getElementById('trace-viewer').innerHTML = 
          '<div class="error"><h2>❌ Error Loading Session</h2><p>' + error.message + '</p><p style="margin-top: 12px;">Please click "View Interactive Trace" button from the Forge app.</p></div>';
      }
    }
    function displaySessionInfo(session) {
      const html = \`
        <div class="session-info">
          <h2>\${session.title}</h2>
          <p>\${session.workspace}</p>
          <div class="metadata">
            <div class="metadata-item"><label>Messages</label><value>\${session.messageCount}</value></div>
            <div class="metadata-item"><label>Spans</label><value>\${session.spanCount}</value></div>
            \${session.usage?.input_tokens ? \`<div class="metadata-item"><label>Input Tokens</label><value>\${session.usage.input_tokens.toLocaleString()}</value></div>\` : ''}
            \${session.usage?.output_tokens ? \`<div class="metadata-item"><label>Output Tokens</label><value>\${session.usage.output_tokens.toLocaleString()}</value></div>\` : ''}
          </div>
        </div>
      \`;
      document.getElementById('session-info').innerHTML = html;
    }
    function displayTrace(session) {
      const spans = session.otlpDocument?.resourceSpans?.[0]?.scopeSpans?.[0]?.spans || [];
      const html = \`
        <div class="trace-placeholder">
          <h3>📊 OpenTelemetry Trace Data Loaded</h3>
          <p>This session contains \${spans.length} spans</p>
          <p style="margin-top: 20px; color: #0052CC;">
            <strong>✅ Backend Ready</strong> - Install agent-prism dependencies and build React bundle for full visualization
          </p>
        </div>
      \`;
      document.getElementById('trace-viewer').innerHTML = html;
    }
    loadSession();
  </script>
</body>
</html>
  `);
});

/**
 * API endpoint - Fetches session data from Forge storage
 * Note: This is a simplified version. In production, you would use Forge's asApp API
 * or have the Forge app invoke this endpoint with the data
 */
app.get('/api/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  
  // TODO: Implement proper authentication and Forge storage access
  // For now, return a helpful message
  res.status(501).json({
    success: false,
    error: 'Direct Forge storage access not yet implemented',
    message: 'Use Forge invokeRemote() to pass session data from the Forge app',
    sessionId: sessionId
  });
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    service: 'ft-atl-ai-tracer Remote Backend',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      sync: 'POST /sync-agents',
      visualize: 'GET /visualize/:sessionId'
    },
    instructions: 'This backend should be called from a Forge app via invokeRemote()'
  });
});

// Start server
function startServer() {
  validateConfig();
  
  app.listen(config.port, () => {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║   🚀 Remote Backend for AI Traceability Tracker   ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
    console.log(`✅ Server running on http://localhost:${config.port}`);
    console.log(`✅ Cloud ID: ${config.atlassian.cloudId}`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`   GET  /health                - Health check`);
    console.log(`   POST /sync-agents           - Sync AI agents`);
    console.log(`   GET  /visualize/:sessionId  - TraceViewer visualization`);
    console.log(`   GET  /api/session/:id       - Fetch session data\n`);
    console.log(`💡 To expose this for Forge:`);
    console.log(`   npx ngrok http ${config.port}\n`);
  });
}

// Error handlers
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
