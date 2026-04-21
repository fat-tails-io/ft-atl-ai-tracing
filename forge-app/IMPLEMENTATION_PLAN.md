# AI Traceability Forge App - Implementation Plan

## Project Overview

**Goal**: Build a Forge app to track AI-related activities and the Teamwork Graph in Atlassian products using GraphQL API integration.

**Approach**: UI Kit only (no Custom UI)

**Target Products**: Jira and/or Confluence

## Technical Architecture

### Technology Stack
- **Frontend**: Forge UI Kit (@forge/react)
- **Backend**: Forge Resolvers (TypeScript)
- **API Integration**: Atlassian GraphQL API (`https://fat-tails.atlassian.net/gateway/api/graphql`)
- **Data Storage**: TBD (Forge Storage, Entity Properties, or both)

### Key Components
1. **GraphQL Client Layer**: Backend resolver functions to query the GraphQL API
2. **AI Activity Tracking**: Monitor and display AI-related activities
3. **Teamwork Graph Visualization**: Display relationships and connections
4. **UI Kit Frontend**: Dashboard/panel to display tracked data

## Implementation Phases

### Phase 1: Project Setup ✅
- [x] Create project directory structure
- [x] Load Forge development knowledge
- [x] Initialize Forge app with CLI (ft-atl-ai-tracer)
- [x] Configure manifest.yml with jira:projectPage module
- [x] Set up TypeScript configuration (tsconfig.json created)
- [x] Define TypeScript types for AI app summary (src/types/index.ts)
- [x] Explore GraphQL and REST APIs for AI features
- [x] Document API findings (API_DISCOVERY.md)

### Phase 2: GraphQL Integration
- [ ] Define TypeScript interfaces for GraphQL queries
- [ ] Create GraphQL client utility in backend
- [ ] Implement authentication/authorization for GraphQL API
- [ ] Build resolver functions for AI-related queries
- [ ] Test GraphQL queries against fat-tails.atlassian.net

### Phase 3: AI Activity Tracking
- [ ] Identify AI-related GraphQL schema types (AIConfigResponse, etc.)
- [ ] Create resolvers to fetch AI activity data
- [ ] Define data models for AI traceability
- [ ] Implement data transformation logic

### Phase 4: UI Development
- [ ] Design UI layout using UI Kit components
- [ ] Create dashboard/panel component
- [ ] Implement data visualization (tables, charts)
- [ ] Add loading states and error handling
- [ ] Style with Atlassian Design Tokens

### Phase 5: Testing & Deployment
- [ ] Write unit tests for resolvers
- [ ] Test UI components
- [ ] Deploy to development environment
- [ ] Install on fat-tails.atlassian.net
- [ ] User acceptance testing

## Module Selection Options

### Option 1: Jira Global Page (Recommended for MVP)
**Module**: `jira:globalPage` with UI Kit
- **Pros**: Easy access from sidebar, good for dashboard-style UI
- **Cons**: Not contextual to specific issues/projects

### Option 2: Confluence Global Page
**Module**: `confluence:globalPage` with UI Kit
- **Pros**: Good for documentation/reporting context
- **Cons**: Less integration with work items

### Option 3: Jira Issue Panel
**Module**: `jira:issuePanel` with UI Kit
- **Pros**: Contextual AI traceability per issue
- **Cons**: More complex if tracking across multiple issues

## GraphQL API Exploration

### Known Schema Elements
From initial exploration, we identified:
- `AIConfigResponse`: AI configuration data
- `AVPAnalytics*`: Analytics-related types
- Dashboard elements

### Next Steps for API Discovery
1. Query for AI-specific types and fields
2. Explore Teamwork Graph schema elements
3. Document available queries and mutations
4. Test data retrieval patterns

## Data Storage Strategy

### Options to Consider
1. **Forge Storage (KVS/Custom Entities)**: App-specific tracking data
2. **Entity Properties**: Store AI metadata on Jira issues/Confluence pages
3. **Hybrid**: Combination based on use case

### Decision Criteria
- Query complexity needs
- Data volume expectations
- Integration with existing Atlassian entities

## Required Scopes & Permissions

*To be determined based on final GraphQL queries and Forge APIs used*

Potential scopes:
- `read:jira-work` (if accessing Jira data)
- `read:confluence-content.all` (if accessing Confluence)
- Custom scopes for GraphQL API access (TBD)

## Open Questions

1. **Primary Use Case**: What specific AI activities should we track?
   - Rovo agent interactions?
   - AI-generated content?
   - AI configuration changes?
   
2. **Module Choice**: Which Atlassian product module fits best?
   - Jira global page (dashboard view)?
   - Confluence page (documentation)?
   - Issue/content-specific panel?

3. **Teamwork Graph**: What relationships are most important?
   - User collaboration patterns?
   - Content relationships?
   - Work item dependencies?

4. **Data Retention**: How long should we store tracking data?

5. **GraphQL Authentication**: How to properly authenticate GraphQL requests from Forge app?

## Success Criteria

- [ ] App successfully queries Atlassian GraphQL API
- [ ] UI displays AI activity data in clear, understandable format
- [ ] App follows Atlassian Design System guidelines
- [ ] Performance is acceptable (< 2s load time)
- [ ] Code follows Forge best practices (TypeScript strict mode, proper error handling)

## Repository Structure

```
/
├── docs/                          # Quarto presentation (existing)
├── embedded-ai-traceability.qmd   # Presentation source (existing)
├── forge-app/                     # NEW: Forge app code
│   ├── IMPLEMENTATION_PLAN.md     # This file
│   ├── manifest.yml               # Forge app manifest
│   ├── package.json               # Dependencies
│   ├── tsconfig.json              # TypeScript config
│   └── src/
│       ├── index.ts               # Backend entry point
│       ├── types/                 # Shared TypeScript types
│       ├── resolvers/             # Backend resolver functions
│       │   └── graphql/           # GraphQL client utilities
│       └── frontend/              # UI Kit components
│           └── index.tsx
```

## Next Steps

1. **Clarify requirements**: Answer open questions above
2. **Choose module type**: Select appropriate Forge module for the app
3. **Initialize Forge app**: Run `forge create` with appropriate template
4. **Explore GraphQL API**: Query available AI and Teamwork Graph types
5. **Build MVP**: Simple dashboard showing AI activity data

---

**Created**: 2026-03-20
**Status**: Planning Phase
**Technology**: Forge UI Kit, GraphQL, TypeScript
