# GraphQL API Queries - Deep Dive

## 🎯 MAJOR DISCOVERY: AgentStudio Queries

We found extensive `agentStudio_*` queries in the GraphQL API! These appear to be for managing and querying Rovo agents.

## Key AgentStudio Queries Found

### Agent Management
- `agentStudio_agentById` - Get agent by ID
- `agentStudio_agentByIdentityAccountId` - Get agent by account ID
- `agentStudio_agentsByIds` - Get multiple agents by IDs
- `agentStudio_getAgents` - **LIST ALL AGENTS** ⭐
- `agentStudio_getAgentByProductAri` - Get agent by product ARI
- `agentStudio_getAgentVersions` - Get different versions of an agent

### Agent Permissions & Settings
- `agentStudio_getAgentActorRoles` - Get roles for agent actors
- `agentStudio_getAgentUsePermissionSettings` - Permission settings
- `agentStudio_getCreateAgentPermissions` - Who can create agents

### Agent Configuration
- `agentStudio_conversationConfiguration` - Conversation settings
- `agentStudio_conversationReportByAgentId` - Conversation reports/analytics
- `agentStudio_insightsConfiguration` - Insights configuration
- `agentStudio_getByExternalReference` - Get by external reference

### Tools & Widgets
- `agentStudio_getToolsByIdAndSource` - Tools available to agents
- `agentStudio_getWidgetsByAgentIdAndContainerType` - Widgets for agents

### Evaluation & Testing
- `agentStudio_batchEvalConversationHistoryById` - Batch evaluation of conversations
- `agentStudio_batchEvalConversationListByContainerId` - Conversation lists for eval
- `agentStudio_batchEvaluationJob` - Batch evaluation jobs
- `agentStudio_batchEvaluationJobList` - List of eval jobs
- `agentStudio_batchEvaluationResultByConversationId` - Results by conversation
- `agentStudio_evaluationProject` - Evaluation projects
- `agentStudio_evaluationResultList` - Evaluation results

### Datasets (for Agent Training/Testing)
- `agentStudio_dataset` - Get dataset
- `agentStudio_datasetItemList` - Items in dataset
- `agentStudio_datasetList` - List all datasets

### MCP Server Integration
- `agentStudio_canAddMcpServer` - Check if can add MCP server

## AgentAI Queries (User-Facing Features)

- `agentAI_contextPanel` - Context panel for AI
- `agentAI_panel` - General AI panel
- `agentAI_summarizeIssue` - AI issue summaries

## Confluence AI Queries

- `confluence_contentAISummaries` - AI summaries for Confluence content

## JSM Agent Workspace

- `jsmAgentWorkspace_locations` - Agent workspace locations in JSM

## Next Steps for Exploration

### 1. Query `agentStudio_getAgents`
This is the **key query** we need! Let's find out:
- What arguments it accepts
- What data it returns
- Authentication requirements

### 2. Explore Agent Data Structure
Query the return type to understand:
- What fields are available
- How agents are represented
- What metadata we can display

### 3. Test Actual Queries
Try calling these queries to see:
- What data we can access
- Authentication/permission requirements
- Rate limits

### 4. Document for Forge Implementation
Create resolver functions that:
- Query `agentStudio_getAgents` for agent list
- Query `agentStudio_conversationReportByAgentId` for analytics
- Display results in our UI

## Questions to Answer

1. **Does `agentStudio_getAgents` work from Forge apps?**
2. **What scopes/permissions are needed?**
3. **Can we query agents from other apps, or only our own?**
4. **What's the data structure returned?**
5. **Are there rate limits?**

---

**Status**: Major discovery! Need to test these queries next.
**Priority**: Query `agentStudio_getAgents` immediately

## 🎯 agentStudio_getAgents - Complete Structure

### Query Signature

```graphql
query GetAgents {
  agentStudio_getAgents(
    cloudId: String!           # Required: Your Atlassian cloud ID
    first: Int                 # Optional: Pagination - number of results
    after: String              # Optional: Pagination cursor
    product: String            # Optional: Filter by product (jira, confluence, etc.)
    workspaceId: String        # Optional: For Bitbucket/Trello workspaces
    input: AgentStudioAgentQueryInput  # Optional: Advanced filtering
  ): AgentStudioAgentsConnection
}
```

### Required OAuth Scope
- `rovo:atlassian-external`

### Authentication Support
- ✅ **SESSION** (logged-in user)
- ✅ **FIRST_PARTY_OAUTH** (Atlassian OAuth apps)
- ❌ **API_TOKEN** (not supported)
- ❌ **THIRD_PARTY_OAUTH** (not supported)
- ❌ **CONTAINER_TOKEN** (not supported)

### Filter Options (AgentStudioAgentQueryInput)

**Mutually exclusive filters** (only one can be true):
- `onlyMyAgents: Boolean` - Agents created by current user
- `onlyFavouriteAgents: Boolean` - User's favorited agents
- `onlyTemplateAgents: Boolean` - Template/starter agents
- `onlyEditableAgents: Boolean` - Agents user can edit
- `onlyVerifiedAgents: Boolean` - Officially verified agents

**Additional filters:**
- `name: String` - Filter by agent name (search)
- `onlyUnpublishedAgents: Boolean` - Draft/unpublished agents

### Return Type: AgentStudioAgentsConnection

Pagination-based connection with:

```graphql
{
  edges: [AgentStudioAgentEdge!]!  # List of agent edges
  pageInfo: PageInfo!               # Pagination info (hasNextPage, endCursor, etc.)
}
```

### Agent Fields (AgentStudioAgent Interface)

```graphql
interface AgentStudioAgent {
  id: ID!                           # Unique agent identifier
  name: String                      # Agent name
  description: String               # Agent description
  connectedChannels: AgentStudioConnectedChannels  # Where agent is available
  knowledgeSources: AgentStudioKnowledgeConfiguration  # Knowledge sources
  scenarioList: AgentStudioScenariosResult  # Test scenarios
  authoringTeam: ?                  # Team that created agent (EXPERIMENTAL)
  # ... more fields available
}
```

## Example Query

```graphql
query GetMyAgents {
  agentStudio_getAgents(
    cloudId: "your-cloud-id"
    first: 10
    input: {
      onlyMyAgents: true
    }
  ) @optIn(to: "AgentStudio") {
    edges {
      node {
        id
        name
        description
        connectedChannels {
          # channel details
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

## Key Insights

1. **Pagination Support** - Use `first` and `after` for cursor-based pagination
2. **Rich Filtering** - Can filter by ownership, favorites, templates, editability
3. **OAuth Required** - Need `rovo:atlassian-external` scope
4. **First-Party Only** - Forge apps (first-party OAuth) can use this! ✅
5. **Experimental Status** - Field may change, use `@optIn(to: "AgentStudio")` directive

## For Forge Implementation

### Required Manifest Changes

```yaml
permissions:
  scopes:
    - 'rovo:atlassian-external'  # Required for agentStudio_getAgents
```

### Resolver Function (Draft)

```typescript
import api, { route } from '@forge/api';

async function getAgents(cloudId: string) {
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
  
  const response = await api.asApp().requestGraph(
    route`/gateway/api/graphql`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { cloudId, first: 20 }
      })
    }
  );
  
  return await response.json();
}
```

