/**
 * GraphQL Resolver for AI Agent Data
 * Queries the Atlassian GraphQL API for agent information
 */

import api, { route } from '@forge/api';

/**
 * Get the cloud ID from the context
 * @param {Object} context - Forge request context
 * @returns {string} Cloud ID
 */
function getCloudId(context) {
  // In Jira, cloudId is available in context
  return context.cloudId || context.extension?.siteId;
}

/**
 * Query agentStudio_getAgents to retrieve AI agents
 * @param {Object} req - Forge resolver request
 * @returns {Promise<Object>} GraphQL response
 */
export async function getAgents(req) {
  try {
    const cloudId = getCloudId(req.context);
    
    if (!cloudId) {
      return {
        success: false,
        error: 'Cloud ID not found in context'
      };
    }

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
    
    const variables = {
      cloudId,
      first: 20
    };
    
    console.log('Sending GraphQL request with query:', query.substring(0, 100) + '...');
    console.log('Variables:', JSON.stringify(variables, null, 2));

    const response = await api.asApp().requestGraph(query, variables);

    const data = await response.json();
    
    console.log('GraphQL response:', JSON.stringify(data, null, 2));

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return {
        success: false,
        error: data.errors[0]?.message || 'GraphQL query failed',
        details: data.errors
      };
    }

    // Check if data.data exists
    if (!data.data) {
      console.error('GraphQL response missing data field:', data);
      return {
        success: false,
        error: 'GraphQL response missing data field'
      };
    }

    // Check if agentStudio_getAgents exists
    if (!data.data.agentStudio_getAgents) {
      console.error('agentStudio_getAgents not in response:', data.data);
      return {
        success: false,
        error: 'agentStudio_getAgents query not found in response - may need additional permissions'
      };
    }

    return {
      success: true,
      data: data.data.agentStudio_getAgents
    };

  } catch (error) {
    console.error('Error fetching agents:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch agents'
    };
  }
}

/**
 * Query AIConfigResponse to check if AI is enabled
 * @param {Object} req - Forge resolver request
 * @returns {Promise<Object>} AI configuration status
 */
export async function getAIConfig(req) {
  try {
    const query = `
      query GetAIConfig {
        __type(name: "AIConfigResponse") {
          name
          description
          fields {
            name
            description
            type {
              name
              kind
            }
          }
        }
      }
    `;

    const response = await api.asApp().requestGraph('/gateway/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return {
        success: false,
        error: data.errors[0]?.message || 'GraphQL query failed'
      };
    }

    return {
      success: true,
      data: data.data.__type
    };

  } catch (error) {
    console.error('Error fetching AI config:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch AI config'
    };
  }
}

/**
 * Get summary statistics about agents
 * @param {Object} req - Forge resolver request
 * @returns {Promise<Object>} Agent summary
 */
export async function getAgentSummary(req) {
  try {
    const agentsResult = await getAgents(req);
    
    if (!agentsResult.success) {
      return agentsResult;
    }

    const agents = agentsResult.data.edges.map(edge => edge.node);
    
    return {
      success: true,
      data: {
        totalAgents: agents.length,
        hasMore: agentsResult.data.pageInfo.hasNextPage,
        agents: agents.map(agent => ({
          id: agent.id,
          name: agent.name,
          description: agent.description
        }))
      }
    };

  } catch (error) {
    console.error('Error generating agent summary:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate summary'
    };
  }
}

/**
 * Get detailed information about a specific agent
 * @param {Object} req - Forge resolver request with agentId in payload
 * @returns {Promise<Object>} Detailed agent information
 */
export async function getAgentDetails(req) {
  try {
    const { agentId } = req.payload || {};
    
    if (!agentId) {
      return {
        success: false,
        error: 'Agent ID is required'
      };
    }

    const query = `
      query GetAgentById($id: ID!) {
        agentStudio_agentById(id: $id) {
          ... on AgentStudioAgentSuccess {
            agent {
              id
              name
              description
              connectedChannels {
                channels {
                  channelType
                }
              }
              knowledgeSources {
                sources {
                  sourceType
                  name
                }
              }
            }
          }
          ... on AgentStudioAgentError {
            errorMessage
          }
        }
      }
    `;

    const response = await api.asApp().requestGraph('/gateway/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { id: agentId }
      })
    });

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return {
        success: false,
        error: data.errors[0]?.message || 'GraphQL query failed',
        details: data.errors
      };
    }

    return {
      success: true,
      data: data.data.agentStudio_agentById
    };

  } catch (error) {
    console.error('Error fetching agent details:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch agent details'
    };
  }
}

/**
 * Get filtered agents based on criteria
 * @param {Object} req - Forge resolver request
 * @returns {Promise<Object>} Filtered agents
 */
export async function getFilteredAgents(req) {
  try {
    const cloudId = getCloudId(req.context);
    const { filterType } = req.payload || {};
    
    if (!cloudId) {
      return {
        success: false,
        error: 'Cloud ID not found in context'
      };
    }

    // Build filter input based on type
    const filterInput = {};
    switch (filterType) {
      case 'my':
        filterInput.onlyMyAgents = true;
        break;
      case 'favorites':
        filterInput.onlyFavouriteAgents = true;
        break;
      case 'templates':
        filterInput.onlyTemplateAgents = true;
        break;
      case 'editable':
        filterInput.onlyEditableAgents = true;
        break;
      case 'verified':
        filterInput.onlyVerifiedAgents = true;
        break;
      default:
        // No filter - get all
        break;
    }

    const query = `
      query GetFilteredAgents($cloudId: String!, $first: Int, $input: AgentStudioAgentQueryInput) {
        agentStudio_getAgents(cloudId: $cloudId, first: $first, input: $input) {
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

    const response = await api.asApp().requestGraph('/gateway/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          cloudId,
          first: 50,
          input: Object.keys(filterInput).length > 0 ? filterInput : null
        }
      })
    });

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return {
        success: false,
        error: data.errors[0]?.message || 'GraphQL query failed',
        details: data.errors
      };
    }

    const agents = data.data.agentStudio_getAgents.edges.map(edge => edge.node);

    return {
      success: true,
      data: {
        filterType: filterType || 'all',
        totalAgents: agents.length,
        hasMore: data.data.agentStudio_getAgents.pageInfo.hasNextPage,
        agents
      }
    };

  } catch (error) {
    console.error('Error fetching filtered agents:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch filtered agents'
    };
  }
}
