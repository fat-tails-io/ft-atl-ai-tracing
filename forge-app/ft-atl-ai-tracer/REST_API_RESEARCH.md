# REST API Research - AI/Rovo Endpoints

## Summary

After researching Atlassian REST APIs and Forge documentation, **there are no dedicated REST API endpoints for querying/listing Rovo agents or AI configuration**.

## What We Found

### ❌ No REST Endpoints For:
- Listing all Rovo agents
- Querying agent details
- Getting AI configuration status
- Agent analytics or usage data

### ✅ What IS Available:

#### 1. Forge Manifest (Declarative)
Define agents in `manifest.yml`:
```yaml
modules:
  rovo:agent:
    - key: my-agent
      name: "My Agent"
      prompt: "..."
      actions: [...]
```

**Limitation**: Only defines agents, doesn't query existing ones.

#### 2. Forge Bridge API (Runtime)
```javascript
import { rovo } from '@forge/bridge';

// Check if Rovo is enabled
const enabled = await rovo.isEnabled();

// Open Rovo chat with specific agent
await rovo.open({
  agentId: 'agent-key',
  prompt: 'Optional pre-filled prompt'
});
```

**Limitation**: Only works in frontend modules, can't list agents.

#### 3. GraphQL API (EXPERIMENTAL - OAuth Required)
```graphql
query {
  agentStudio_getAgents(cloudId: "...", first: 20) {
    edges { node { id name description } }
  }
}
```

**Limitation**: Requires `rovo:atlassian-external` OAuth scope, not available to Forge apps.

## Why No REST API?

Based on the architecture:

1. **Agents are app-scoped** - Each Forge app defines its own agents
2. **No central registry** - Unlike Jira issues or Confluence pages, agents aren't centralized entities
3. **Admin UI manages discovery** - Agent discovery happens through Rovo's UI, not programmatically
4. **GraphQL is the query layer** - Atlassian chose GraphQL (agentStudio_*) for agent queries

## Alternative Approaches for Our Demo

Since we can't query agents programmatically, we can:

### Option 1: Parse Our Own Manifest
```javascript
// Read manifest.yml
// Parse rovo:agent modules
// Display what WE defined
```
**Pros**: Works! Shows what our app provides
**Cons**: Only shows our app's agents, not workspace-wide

### Option 2: Use Rovo Bridge for Status
```javascript
const isRovoEnabled = await rovo.isEnabled();
// Show: "Rovo Status: Enabled ✓"
```
**Pros**: Works! Shows tenant-level status
**Cons**: Very limited information

### Option 3: Document the Limitation
Show in UI:
> "Agent discovery requires `rovo:atlassian-external` OAuth scope, currently unavailable to Forge apps. This demonstrates a governance gap in AI traceability."

**Pros**: Turns limitation into a demonstration point!
**Cons**: Doesn't show actual data

### Option 4: Create Demo Agents in Our App
Add `rovo:agent` modules to our manifest, then display them:
```yaml
modules:
  rovo:agent:
    - key: demo-agent-1
      name: "AI Traceability Monitor"
      description: "Tracks AI usage in projects"
      prompt: "..."
```

**Pros**: Shows working integration, demonstrates the concept
**Cons**: Only shows our own agents

## Recommendation for Presentation

**Combine Options 3 & 4:**

1. **Add a demo Rovo agent** to our manifest
2. **Display it in the UI** with metadata
3. **Show the limitation message** about workspace-wide discovery
4. **Use this as a teaching moment** about AI governance gaps

This demonstrates:
- ✅ How Forge apps define agents
- ✅ What metadata is available
- ✅ Current limitations in AI traceability
- ✅ The need for better governance tooling

## Conclusion

**There is no REST API for agent discovery.** The only programmatic access is:
- **GraphQL** (requires special OAuth scope - unavailable to Forge)
- **Forge Bridge** (limited to status check and launching agents)
- **Manifest parsing** (only shows what we define)

This actually **strengthens your presentation narrative** about the need for better AI traceability and governance!

---

**Created**: 2026-03-20
**Research Status**: Complete
**Recommendation**: Demo with manifest-defined agents + limitation documentation
