/**
 * Remote Resolver - Calls remote backend for AI agent data
 */

import { invokeRemote } from '@forge/api';
import { storage } from '@forge/api';

/**
 * Trigger sync from remote backend
 * Remote backend will query GraphQL API and store results in Forge Storage
 */
export async function syncAgents(req) {
  try {
    console.log('🔄 Triggering remote sync...');
    
    // Call remote backend endpoint
    const response = await invokeRemote('ai-sync-remote', {
      path: '/sync-agents',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cloudId: req.context.cloudId || req.context.extension?.siteId
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Get text first to see what we're getting
    const text = await response.text();
    console.log('Response body (first 200 chars):', text.substring(0, 200));
    
    // Try to parse as JSON
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse JSON, got HTML:', text.substring(0, 500));
      throw new Error('Backend returned HTML instead of JSON - likely ngrok warning page');
    }
    
    console.log('✅ Remote sync response:', result);

    // Check if the backend returned an error (even with 200 status)
    if (!result.success) {
      console.error('❌ Backend returned error:', result.error);
      return {
        success: false,
        error: result.error || 'Sync failed',
        timestamp: result.timestamp
      };
    }

    return {
      success: true,
      message: result.message || 'Sync completed',
      agentsCount: result.agentsCount,
      timestamp: result.timestamp
    };

  } catch (error) {
    console.error('❌ Remote sync error:', error);
    return {
      success: false,
      error: error.message || 'Failed to sync agents'
    };
  }
}

/**
 * Get agents from Forge Storage
 * Reads data that was stored by the remote backend
 */
export async function getAgents(req) {
  try {
    console.log('📖 Reading agents from storage...');
    
    const agentsList = await storage.get('agents-list');
    const metadata = await storage.get('agents-metadata');
    
    return {
      success: true,
      data: {
        agents: agentsList || [],
        metadata: metadata || null
      }
    };

  } catch (error) {
    console.error('❌ Get agents error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get agents'
    };
  }
}

/**
 * Get agent summary with stats
 */
export async function getAgentSummary(req) {
  try {
    const agentsResult = await getAgents(req);
    
    if (!agentsResult.success) {
      return agentsResult;
    }

    const agents = agentsResult.data.agents;
    const metadata = agentsResult.data.metadata;

    return {
      success: true,
      data: {
        totalAgents: agents.length,
        agents: agents,
        lastSync: metadata?.lastSync || null,
        hasMore: metadata?.hasMore || false
      }
    };

  } catch (error) {
    console.error('❌ Get summary error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate summary'
    };
  }
}
