/**
 * Converter utility to transform Rovo Dev session data into OpenTelemetry OTLP format
 * for visualization with agent-prism components
 */

/**
 * Generate a random hex string of specified length
 * @param {number} length - Length of hex string
 * @returns {string} Random hex string
 */
function generateHexId(length = 16) {
  return Array.from({ length }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Convert ISO timestamp to Unix nanoseconds (required by OpenTelemetry)
 * @param {string} isoTimestamp - ISO 8601 timestamp
 * @returns {string} Unix timestamp in nanoseconds
 */
function isoToUnixNano(isoTimestamp) {
  if (!isoTimestamp) {
    return '0';
  }
  const ms = new Date(isoTimestamp).getTime();
  return (ms * 1_000_000).toString();
}

/**
 * Convert Unix timestamp (seconds) to Unix nanoseconds
 * @param {number} unixTimestamp - Unix timestamp in seconds
 * @returns {string} Unix timestamp in nanoseconds
 */
function unixToUnixNano(unixTimestamp) {
  if (!unixTimestamp) {
    return '0';
  }
  return (unixTimestamp * 1_000_000_000).toString();
}

/**
 * Create an OpenTelemetry attribute
 * @param {string} key - Attribute key
 * @param {any} value - Attribute value
 * @returns {object} OTLP attribute object
 */
function createAttribute(key, value) {
  if (typeof value === 'string') {
    return { key, value: { stringValue: value } };
  } else if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { key, value: { intValue: value.toString() } };
    }
    return { key, value: { doubleValue: value } };
  } else if (typeof value === 'boolean') {
    return { key, value: { boolValue: value } };
  }
  // Default to string representation
  return { key, value: { stringValue: String(value) } };
}

/**
 * Convert a Rovo Dev message part to an OpenTelemetry span
 * @param {object} part - Message part from Rovo Dev session
 * @param {string} traceId - Trace ID for this session
 * @param {string} parentSpanId - Parent span ID
 * @param {object} message - Parent message object
 * @returns {object|null} OpenTelemetry span or null if not applicable
 */
function partToSpan(part, traceId, parentSpanId, message) {
  const spanId = part.tool_call_id 
    ? part.tool_call_id.substring(0, 16).padEnd(16, '0')
    : generateHexId(16);
  
  const startTime = part.timestamp || message.timestamp;
  const partKind = part.part_kind;
  
  // Create base span
  const span = {
    traceId,
    spanId,
    parentSpanId,
    name: '',
    kind: 'SPAN_KIND_INTERNAL',
    startTimeUnixNano: isoToUnixNano(startTime),
    endTimeUnixNano: isoToUnixNano(startTime), // Will be updated
    attributes: [],
    status: { code: 'STATUS_CODE_UNSET' },
    flags: 0,
  };

  // Handle different part kinds
  switch (partKind) {
    case 'tool-call':
      span.name = `tool.${part.tool_name || 'unknown'}`;
      span.kind = 'SPAN_KIND_CLIENT';
      span.attributes.push(
        createAttribute('tool.name', part.tool_name || 'unknown'),
        createAttribute('tool.call_id', part.tool_call_id || ''),
        createAttribute('tool.kind', 'tool-call')
      );
      
      if (part.args) {
        span.attributes.push(
          createAttribute('tool.args', part.args)
        );
      }
      break;

    case 'tool-return':
      span.name = `tool.${part.tool_name || 'unknown'}.return`;
      span.kind = 'SPAN_KIND_SERVER';
      span.attributes.push(
        createAttribute('tool.name', part.tool_name || 'unknown'),
        createAttribute('tool.call_id', part.tool_call_id || ''),
        createAttribute('tool.kind', 'tool-return')
      );
      
      if (part.content) {
        span.attributes.push(
          createAttribute('tool.result', 
            typeof part.content === 'string' 
              ? part.content.substring(0, 500) // Truncate long results
              : JSON.stringify(part.content).substring(0, 500)
          )
        );
      }
      break;

    case 'text':
      span.name = 'agent.response';
      span.attributes.push(
        createAttribute('response.content', 
          part.content ? part.content.substring(0, 500) : ''
        )
      );
      break;

    case 'system-prompt':
      span.name = 'system.prompt';
      span.attributes.push(
        createAttribute('prompt.dynamic_ref', part.dynamic_ref || ''),
        createAttribute('prompt.kind', partKind)
      );
      break;

    case 'user-prompt':
      span.name = 'user.message';
      span.attributes.push(
        createAttribute('message.content', 
          part.content ? part.content.substring(0, 500) : ''
        )
      );
      break;

    default:
      // Return null for parts we don't want to convert to spans
      if (!partKind) return null;
      span.name = `unknown.${partKind}`;
      span.attributes.push(
        createAttribute('part.kind', partKind)
      );
  }

  return span;
}

/**
 * Convert a Rovo Dev message to OpenTelemetry spans
 * @param {object} message - Message from Rovo Dev session
 * @param {string} traceId - Trace ID for this session
 * @param {string} parentSpanId - Parent span ID (session root)
 * @param {number} index - Message index
 * @returns {object[]} Array of OpenTelemetry spans
 */
function messageToSpans(message, traceId, parentSpanId, index) {
  const spans = [];
  
  // Create a parent span for this message/interaction
  const messageSpanId = generateHexId(16);
  const messageSpan = {
    traceId,
    spanId: messageSpanId,
    parentSpanId,
    name: `interaction.${message.kind || 'unknown'}`,
    kind: message.kind === 'request' ? 'SPAN_KIND_SERVER' : 'SPAN_KIND_INTERNAL',
    startTimeUnixNano: isoToUnixNano(message.timestamp),
    endTimeUnixNano: isoToUnixNano(message.timestamp),
    attributes: [
      createAttribute('message.kind', message.kind || 'unknown'),
      createAttribute('message.index', index),
    ],
    status: { code: 'STATUS_CODE_OK' },
    flags: 0,
  };

  if (message.run_id) {
    messageSpan.attributes.push(
      createAttribute('run.id', message.run_id)
    );
  }

  spans.push(messageSpan);

  // Convert each part to a child span
  if (message.parts && Array.isArray(message.parts)) {
    let lastTimestamp = message.timestamp;
    
    for (const part of message.parts) {
      const partSpan = partToSpan(part, traceId, messageSpanId, message);
      if (partSpan) {
        // Update end time based on part timestamp
        if (part.timestamp) {
          const partTime = isoToUnixNano(part.timestamp);
          if (partTime > messageSpan.endTimeUnixNano) {
            messageSpan.endTimeUnixNano = partTime;
          }
          partSpan.endTimeUnixNano = partTime;
          lastTimestamp = part.timestamp;
        } else {
          partSpan.endTimeUnixNano = partSpan.startTimeUnixNano;
        }
        
        spans.push(partSpan);
      }
    }
  }

  return spans;
}

/**
 * Convert a complete Rovo Dev session to OpenTelemetry OTLP format
 * @param {object} sessionContext - The session_context.json data
 * @param {object} metadata - The metadata.json data (optional)
 * @returns {object} OpenTelemetry OTLP document
 */
export function convertRovoDevSessionToOTLP(sessionContext, metadata = null) {
  // Use session ID as trace ID (pad/truncate to 32 hex chars)
  const sessionId = sessionContext.id || generateHexId(32);
  const traceId = sessionId.replace(/[^a-f0-9]/gi, '').substring(0, 32).padEnd(32, '0');
  
  // Create root span for the entire session
  const rootSpanId = generateHexId(16);
  const sessionStartTime = sessionContext.timestamp 
    ? unixToUnixNano(sessionContext.timestamp)
    : isoToUnixNano(sessionContext.message_history?.[0]?.timestamp || new Date().toISOString());
  
  const sessionEndTime = sessionContext.message_history?.length > 0
    ? isoToUnixNano(
        sessionContext.message_history[sessionContext.message_history.length - 1].timestamp
      )
    : sessionStartTime;

  const rootSpan = {
    traceId,
    spanId: rootSpanId,
    name: metadata?.title || 'Rovo Dev Session',
    kind: 'SPAN_KIND_SERVER',
    startTimeUnixNano: sessionStartTime,
    endTimeUnixNano: sessionEndTime,
    attributes: [
      createAttribute('session.id', sessionId),
      createAttribute('session.workspace', sessionContext.workspace_path || metadata?.workspace_path || 'unknown'),
    ],
    status: { code: 'STATUS_CODE_OK' },
    flags: 0,
  };

  if (metadata?.title) {
    rootSpan.attributes.push(createAttribute('session.title', metadata.title));
  }

  // Add usage data as attributes if available
  if (sessionContext.usage) {
    const usage = sessionContext.usage;
    if (usage.input_tokens) {
      rootSpan.attributes.push(
        createAttribute('gen_ai.usage.input_tokens', usage.input_tokens)
      );
    }
    if (usage.output_tokens) {
      rootSpan.attributes.push(
        createAttribute('gen_ai.usage.output_tokens', usage.output_tokens)
      );
    }
    if (usage.cache_read_tokens) {
      rootSpan.attributes.push(
        createAttribute('gen_ai.usage.cache_read_tokens', usage.cache_read_tokens)
      );
    }
    if (usage.cache_write_tokens) {
      rootSpan.attributes.push(
        createAttribute('gen_ai.usage.cache_write_tokens', usage.cache_write_tokens)
      );
    }
  }

  // Convert all messages to spans
  const allSpans = [rootSpan];
  
  if (sessionContext.message_history && Array.isArray(sessionContext.message_history)) {
    sessionContext.message_history.forEach((message, index) => {
      const messageSpans = messageToSpans(message, traceId, rootSpanId, index);
      allSpans.push(...messageSpans);
    });
  }

  // Build OpenTelemetry OTLP document
  const otlpDocument = {
    resourceSpans: [
      {
        resource: {
          attributes: [
            createAttribute('service.name', 'rovo-dev'),
            createAttribute('service.version', '1.0.0'),
          ],
        },
        scopeSpans: [
          {
            scope: {
              name: 'rovo-dev-session-converter',
              version: '1.0.0',
            },
            spans: allSpans,
          },
        ],
      },
    ],
  };

  return otlpDocument;
}

/**
 * Load and convert a Rovo Dev session from file paths
 * @param {string} sessionContextPath - Path to session_context.json
 * @param {string} metadataPath - Path to metadata.json (optional)
 * @returns {Promise<object>} Promise resolving to OTLP document
 */
export async function loadAndConvertSession(sessionContextPath, metadataPath = null) {
  const fs = require('fs').promises;
  
  const sessionContext = JSON.parse(
    await fs.readFile(sessionContextPath, 'utf-8')
  );
  
  let metadata = null;
  if (metadataPath) {
    try {
      metadata = JSON.parse(
        await fs.readFile(metadataPath, 'utf-8')
      );
    } catch (err) {
      console.warn('Could not load metadata:', err.message);
    }
  }
  
  return convertRovoDevSessionToOTLP(sessionContext, metadata);
}

// Default export
export default {
  convertRovoDevSessionToOTLP,
  loadAndConvertSession,
};
