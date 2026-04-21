# Rovo Dev Session Converter

This utility converts Rovo Dev session data into OpenTelemetry OTLP format for visualization with [agent-prism](https://github.com/evilmartians/agent-prism) components.

## Overview

Rovo Dev sessions are stored in `~/.rovodev/sessions/` with a custom JSON format. This converter transforms them into OpenTelemetry traces that can be visualized using agent-prism's React components.

## Files

- `rovoDevSessionConverter.js` - Main converter utility
- `../types/rovoDevSession.ts` - TypeScript type definitions

## Usage

### Basic Usage

```javascript
import { convertRovoDevSessionToOTLP } from './utils/rovoDevSessionConverter';

// Load your session data
const sessionContext = JSON.parse(fs.readFileSync('session_context.json', 'utf-8'));
const metadata = JSON.parse(fs.readFileSync('metadata.json', 'utf-8'));

// Convert to OpenTelemetry format
const otlpDocument = convertRovoDevSessionToOTLP(sessionContext, metadata);

// Use with agent-prism
import { TraceViewer } from './components/agent-prism/TraceViewer';
import { openTelemetrySpanAdapter } from '@evilmartians/agent-prism-data';

const spans = openTelemetrySpanAdapter.convertRawDocumentsToSpans(otlpDocument);
```

### Load and Convert from File

```javascript
import { loadAndConvertSession } from './utils/rovoDevSessionConverter';

const otlpDocument = await loadAndConvertSession(
  '/home/user/.rovodev/sessions/xyz/session_context.json',
  '/home/user/.rovodev/sessions/xyz/metadata.json'
);
```

## Conversion Mapping

### Session → Trace

| Rovo Dev Session | OpenTelemetry OTLP |
|------------------|-------------------|
| `session.id` | `trace.traceId` |
| `session.timestamp` | Root span `startTimeUnixNano` |
| `session.title` | Root span `name` |
| `session.workspace_path` | Attribute `session.workspace` |
| `session.usage.*` | Attributes `gen_ai.usage.*` |

### Messages → Spans

Each message in the `message_history` becomes a parent span with child spans for each message part:

| Message Part Kind | Span Type | Attributes |
|------------------|-----------|------------|
| `tool-call` | `SPAN_KIND_CLIENT` | `tool.name`, `tool.call_id`, `tool.args` |
| `tool-return` | `SPAN_KIND_SERVER` | `tool.name`, `tool.call_id`, `tool.result` |
| `text` | `SPAN_KIND_INTERNAL` | `response.content` |
| `system-prompt` | `SPAN_KIND_INTERNAL` | `prompt.dynamic_ref` |
| `user-prompt` | `SPAN_KIND_INTERNAL` | `message.content` |

## Example Output

```json
{
  "resourceSpans": [
    {
      "resource": {
        "attributes": [
          { "key": "service.name", "value": { "stringValue": "rovo-dev" } }
        ]
      },
      "scopeSpans": [
        {
          "scope": { "name": "rovo-dev-session-converter", "version": "1.0.0" },
          "spans": [
            {
              "traceId": "79ca6dd94c24c079087bdc2e18a3fd60",
              "spanId": "d3df6fd1aae4d33e",
              "name": "Rovo Dev Session",
              "kind": "SPAN_KIND_SERVER",
              "startTimeUnixNano": "1711210411000000000",
              "endTimeUnixNano": "1711210411000000000",
              "attributes": [
                { "key": "session.id", "value": { "stringValue": "..." } },
                { "key": "gen_ai.usage.input_tokens", "value": { "intValue": "248175" } }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

## Features

- ✅ Converts complete session history to hierarchical spans
- ✅ Preserves tool calls and their results as separate spans
- ✅ Includes token usage data as `gen_ai.usage.*` attributes
- ✅ Maintains temporal relationships with proper timestamps
- ✅ Compatible with agent-prism's `openTelemetrySpanAdapter`
- ✅ Handles missing timestamps and metadata gracefully

## Test Results

From actual Rovo Dev session conversion:
- **Input**: 30 messages with multiple tool calls
- **Output**: 138 OpenTelemetry spans
- **Root Span**: Contains session metadata and usage totals
  - Input tokens: 248,175
  - Output tokens: 4,814
  - Cache read tokens: 207,172
  - Cache write tokens: 40,958

## Next Steps

To integrate with agent-prism in your Forge app:

1. Install agent-prism dependencies:
   ```bash
   npm install @evilmartians/agent-prism-data @evilmartians/agent-prism-types
   npm install @radix-ui/react-collapsible @radix-ui/react-tabs classnames lucide-react react-json-pretty react-resizable-panels
   ```

2. Copy agent-prism UI components to your project:
   ```bash
   npx degit evilmartians/agent-prism/packages/ui/src/components src/components/agent-prism
   ```

3. Use the converter in your Forge app to visualize sessions
