# API Discovery - AI Apps, Agents, and Skills

## Summary

This document tracks our exploration of Atlassian's GraphQL and REST APIs for reporting AI-related features.

## GraphQL API Findings

### Endpoint
`https://fat-tails.atlassian.net/gateway/api/graphql`

### AI-Related Types Discovered

#### 1. Core AI Configuration
- **AIConfigResponse**
  - `isAIEarlyAccessEnabled: Boolean`
  - `isEnabled: Boolean`
  - Used to check if AI features are enabled for the tenant

#### 2. Agent AI Types (Rovo Agents)
- **AgentAICitation** - Citations/sources from AI responses
- **AgentAICitationSourceType** - Types of citation sources
- **AgentAIContextPanelResponse** - Context panel data
- **AgentAIContextPanelResult** - Results for context panels
- **AgentAIDraftReplyPillData** - Draft reply suggestions
- **AgentAIInlineAction** - Inline actions (next steps)
- **AgentAIIssueSummary** - AI-generated issue summaries
- **AgentAINextStep** - Next step suggestions
- **AgentAIPanel** - AI panel components
- **AgentAISuggestAction** - Suggested actions
- **AgentAISuggestedActionContent** - Content for suggested actions
- **AgentAISuggestedNextSteps** - Multiple next step suggestions

#### 3. Admin AI Features
- **AdminAIFeature** - "AI feature representation"
  - Likely used for admin/governance of AI features

#### 4. Analytics & Visualization
- **AVPChartPipelineQuerySqlGenerationByAI** - AI-powered SQL generation for charts/analytics

### Key Insights from GraphQL

1. **No direct "list all agents" query found yet** - We may need to query specific types
2. **Agent AI types are focused on interactions** - Citations, suggestions, next steps
3. **Admin features exist** - AdminAIFeature suggests governance capabilities
4. **Authentication works** - Successfully querying without tokens (unauthenticated allowed for some queries)

## Forge Documentation Findings

### Rovo Agent Module (`rovo:agent`)

**Purpose**: Define AI agents in Forge apps

**Key Properties**:
- `key` - Unique identifier
- `name` - Agent name (max 30 chars)
- `description` - What the agent does
- `icon` - Agent avatar
- `prompt` - Custom LLM prompt (defines behavior)
- `conversationStarters` - Suggested starting prompts
- `actions` - Actions the agent can invoke
- `followUpPrompt` - Generate follow-up suggestions

**Important Notes**:
- **App-based agents** only access data in the workspace where installed
- **Data access limitation**: If app installed in Jira, won't auto-access Confluence data
- **Safety screening**: Atlassian screens agents, may prevent deployment if issues found
- **Compliance required**: Must comply with Atlassian Acceptable Use Policy

### Rovo Bridge API (`@forge/bridge.rovo`)

**Preview capability** - Available for testing, subject to change

**Methods**:
1. **`rovo.open()`** - Open Rovo chat sidebar with specific agent
   - Can open Forge agents, Atlassian agents, or default agent
   - Can pre-fill prompts
   
2. **`rovo.isEnabled()`** - Check if Rovo enabled in tenant

**Supported in**:
- All Jira modules
- All Confluence modules
- Some JSM modules

## Action Module (`rovo:action`)

Agents can invoke actions to fetch data and perform operations.

## REST API Exploration

### Status: To Be Explored

**Potential endpoints to investigate**:
- `/rest/api/3/ai/*` - Jira AI endpoints
- Rovo configuration endpoints
- Admin API for AI features
- Analytics APIs

**Next steps**:
1. Search for REST API documentation on AI features
2. Explore admin API for listing agents/skills
3. Check if there's a dedicated Rovo REST API

## Questions to Answer

1. **How to list all Rovo agents in a workspace?**
   - GraphQL query needed?
   - Admin API endpoint?
   - Forge storage query?

2. **How to list custom skills?**
   - Are skills exposed via API?
   - Related to `rovo:action` modules?

3. **How to get agent usage/analytics?**
   - Agent invocation counts?
   - User interaction data?
   - Success/failure metrics?

4. **Can we query from a Forge app?**
   - Authentication requirements
   - Required scopes
   - Rate limits

## Implementation Strategy

### Phase 1: Use Forge Manifest Introspection
**Approach**: Query our own app's manifest to show defined `rovo:agent` modules
- ✅ Simple and reliable
- ✅ No API authentication needed
- ✅ Shows agents we created
- ❌ Only shows agents from our app

### Phase 2: Check AIConfigResponse
**Approach**: Query GraphQL `AIConfigResponse` to check if AI enabled
- ✅ Easy to implement
- ✅ Shows tenant-level AI status
- Use as a health check

### Phase 3: Explore Admin API (if available)
**Approach**: Look for admin endpoints that list all agents/skills
- ⚠️ May require admin permissions
- ⚠️ May not be publicly documented
- Could provide comprehensive view

### Phase 4: Use Agent Interaction Data
**Approach**: Track agent usage through our own logging
- ✅ Full control over data
- ✅ Can add custom metrics
- ❌ Only tracks what we implement

## Recommended MVP Approach

**For the presentation demo**, focus on:

1. **Display AI Configuration Status**
   - Query `AIConfigResponse` to show if AI enabled
   - Display early access status

2. **List Forge Agents from Our App**
   - Parse our own `manifest.yml`
   - Show defined `rovo:agent` modules
   - Display: name, description, key

3. **Show Agent Capabilities**
   - List conversation starters
   - List available actions
   - Show follow-up prompt configuration

4. **Add Rovo Bridge Integration**
   - Add button to "Open Agent" using `rovo.open()`
   - Demonstrate launching agents from our app

This gives us a **working demo** without needing to solve the "list all agents in workspace" problem, which may not have a public API yet.

## Next Steps

1. ✅ TypeScript configuration complete
2. ⏳ Query `AIConfigResponse` from Forge resolver
3. ⏳ Parse `manifest.yml` to list our agents
4. ⏳ Build UI to display AI status and agent list
5. ⏳ Add `rovo.open()` integration for launching agents

---

**Last Updated**: 2026-03-20  
**Status**: Discovery phase - focusing on MVP approach
