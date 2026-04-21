# ft-atl-ai-tracer - Development Plan

## Goal
Build a Jira Project Page that summarizes AI-related parts of Atlassian's REST and GraphQL APIs.

## Current State
✅ Forge app scaffolded with:
- `jira:projectPage` module
- React + Forge UI Kit frontend
- Resolver-based backend
- Node.js 24.x runtime

## Implementation Steps

### Phase 1: Backend - GraphQL API Integration

**Create GraphQL Client** (`src/utils/graphql-client.js`)
- Build GraphQL query utility
- Handle authentication/authorization
- Query AI-related types (AIConfigResponse, etc.)
- Error handling and response parsing

**Add Resolver Functions** (`src/resolvers/index.js`)
- `getAIGraphQLData` - Fetch AI schema info from GraphQL
- `getAIRESTEndpoints` - Identify AI-related REST endpoints
- `getTeamworkGraphData` - Query Teamwork Graph information

**Required Scopes** (update `manifest.yml`)
- Research and add appropriate API scopes
- May need: `read:jira-work`, custom GraphQL permissions

### Phase 2: Backend - REST API Integration

**Create REST Client** (`src/utils/rest-client.js`)
- Identify AI-related REST endpoints
- Use Forge API utilities for authentication
- Parse responses for AI features

**Potential AI REST Endpoints to Query:**
- Rovo configuration endpoints
- AI features/capabilities
- Analytics APIs
- Any AI-related admin APIs

### Phase 3: Frontend - UI Development

**Update UI Components** (`src/frontend/index.jsx`)

**Components to Build:**
1. **Main Dashboard Layout**
   - Header with title and description
   - Tab/section navigation

2. **GraphQL API Summary Section**
   - Display AI-related GraphQL types
   - Show available queries/mutations
   - List fields and descriptions

3. **REST API Summary Section**
   - List AI-related REST endpoints
   - Show endpoint paths, methods, descriptions
   - Group by category (Rovo, Analytics, etc.)

4. **Teamwork Graph Section**
   - Display graph relationships
   - Show available nodes/edges
   - Visualize connections (if possible)

**UI Kit Components to Use:**
- `Box` - Layout and spacing
- `Heading`, `Text` - Typography
- `Table` - Data display
- `Tabs` - Section navigation
- `Inline` - Small layout elements
- `SectionMessage` - Alerts/info
- `Spinner` - Loading states

### Phase 4: Data Transformation & Display

**Create Data Transformers** (`src/utils/transformers.js`)
- Parse GraphQL schema introspection results
- Extract AI-related types and fields
- Format data for UI display
- Create summary statistics

**Display Strategy:**
- Group by API type (GraphQL vs REST)
- Categorize by feature (Rovo, Analytics, etc.)
- Show counts and summaries
- Highlight new/beta features

### Phase 5: Testing & Polish

- Test in development environment
- Deploy to fat-tails.atlassian.net
- Install in a Jira project
- Verify data accuracy
- Add error handling
- Improve loading states
- Add documentation

## Technical Challenges to Address

### 1. GraphQL Authentication
**Challenge**: How to authenticate GraphQL requests from Forge app?

**Options:**
- Use Forge's built-in API authentication
- Generate API tokens
- Use app credentials

**Action**: Research Forge GraphQL capabilities

### 2. API Discovery
**Challenge**: Which specific endpoints expose AI data?

**Actions:**
- Explore GraphQL schema introspection
- Review Atlassian API documentation
- Test queries against fat-tails.atlassian.net

### 3. Data Volume
**Challenge**: GraphQL schema might be very large

**Solutions:**
- Filter to AI-related types only
- Implement caching
- Show summaries, not full schema
- Paginate results

## File Structure

```
src/
├── index.js                    # Entry point (existing)
├── resolvers/
│   ├── index.js               # Main resolver (existing)
│   ├── graphql-resolver.js    # GraphQL data fetching
│   └── rest-resolver.js       # REST API data fetching
├── utils/
│   ├── graphql-client.js      # GraphQL query utilities
│   ├── rest-client.js         # REST API utilities
│   └── transformers.js        # Data transformation logic
└── frontend/
    ├── index.jsx              # Main React component (existing)
    ├── components/
    │   ├── GraphQLSummary.jsx # GraphQL API section
    │   ├── RESTSummary.jsx    # REST API section
    │   ├── TeamworkGraph.jsx  # Teamwork Graph section
    │   └── Dashboard.jsx      # Main layout
    └── styles/
        └── constants.js       # Design tokens, constants
```

## Dependencies Needed

Check if we need to add:
- `@forge/api` - For API requests
- Any GraphQL client libraries (if Forge allows)

## Next Immediate Steps

1. **Research**: Explore GraphQL API capabilities from Forge
2. **Create GraphQL client utility**: Build basic query function
3. **Test GraphQL queries**: Verify we can access the API
4. **Update UI**: Replace "Hello World" with basic layout
5. **Add first resolver**: Implement basic data fetching

## Questions to Answer

1. Can Forge apps make requests to the GraphQL API gateway?
2. What authentication method should we use?
3. Which specific AI types/endpoints should we focus on?
4. How should we handle rate limiting?
5. Should we cache data? For how long?

---

**Status**: Ready to begin implementation
**Next Step**: Create GraphQL client utility
