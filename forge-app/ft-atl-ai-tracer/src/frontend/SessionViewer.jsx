import React, { useState, useEffect } from 'react';
import {
  Box,
  Stack,
  Heading,
  Text,
  Button,
  SectionMessage,
  Spinner,
  Strong,
  Inline,
  Code
} from '@forge/react';
import { invoke } from '@forge/bridge';

export const SessionViewer = ({ sessionId, onBack }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMetadata, setShowMetadata] = useState(true);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  const loadSession = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await invoke('getSession', { sessionId });
      
      if (response.success) {
        setSession(response.session);
      } else {
        setError(response.error || 'Failed to load session');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box padding="space.300">
        <Stack space="space.200" alignInline="center">
          <Spinner size="large" />
          <Text>Loading session...</Text>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding="space.300">
        <Stack space="space.300">
          <SectionMessage appearance="error" title="Error Loading Session">
            <Text>{error}</Text>
          </SectionMessage>
          <Button onClick={onBack}>Back to Sessions</Button>
        </Stack>
      </Box>
    );
  }

  if (!session) {
    return (
      <Box padding="space.300">
        <Text>Session not found</Text>
        <Button onClick={onBack}>Back to Sessions</Button>
      </Box>
    );
  }

  const rootSpan = session.otlpDocument?.resourceSpans?.[0]?.scopeSpans?.[0]?.spans?.[0];
  const allSpans = session.otlpDocument?.resourceSpans?.[0]?.scopeSpans?.[0]?.spans || [];

  // Remote backend URL for visualization
  const remoteBackendUrl = 'https://ea85-140-228-85-33.ngrok-free.app';
  
  const openVisualization = async () => {
    // Open visualization in new window with session data in URL
    // The remote backend will display the data directly from the URL/localStorage
    const visualizeUrl = `${remoteBackendUrl}/visualize/${session.id}`;
    
    // Store session data in localStorage for the visualization window
    // This is a workaround since we can't easily make authenticated API calls
    try {
      localStorage.setItem(`session_${session.id}`, JSON.stringify(session));
      window.open(visualizeUrl, '_blank');
    } catch (err) {
      console.error('Error opening visualization:', err);
      alert('Failed to open visualization. Please check that the remote backend is running.');
    }
  };

  return (
    <Box padding="space.300">
      <Stack space="space.400">
        {/* Header with Toggle */}
        <Stack space="space.200">
          <Inline space="space.200">
            <Button onClick={onBack}>← Back to Sessions</Button>
            <Button 
              appearance={showMetadata ? 'default' : 'subtle'}
              onClick={() => setShowMetadata(!showMetadata)}
            >
              {showMetadata ? 'Hide' : 'Show'} Metadata
            </Button>
            <Button 
              appearance="primary"
              onClick={openVisualization}
            >
              🔍 View Interactive Trace
            </Button>
          </Inline>
          <Heading size="large">{session.title}</Heading>
          <Text appearance="subtle">{session.workspace}</Text>
        </Stack>

        {/* Collapsible Session Metadata */}
        {showMetadata && (
          <>
            {/* Session Details */}
            <Box backgroundColor="color.background.accent.blue.subtlest" padding="space.300">
              <Stack space="space.200">
                <Heading size="small">Session Details</Heading>
                <Inline space="space.400">
                  <Box>
                    <Text><Strong>Messages:</Strong> {session.messageCount}</Text>
                  </Box>
                  <Box>
                    <Text><Strong>Spans:</Strong> {session.spanCount}</Text>
                  </Box>
                </Inline>
                
                {rootSpan && (
                  <Box>
                    <Text><Strong>Trace ID:</Strong></Text>
                    <Code text={rootSpan.traceId} />
                  </Box>
                )}
              </Stack>
            </Box>

            {/* Usage Statistics */}
            {session.usage && Object.keys(session.usage).length > 0 && (
              <Box backgroundColor="color.background.accent.green.subtlest" padding="space.300">
                <Stack space="space.200">
                  <Heading size="small">Token Usage</Heading>
                  <Inline space="space.400">
                    {session.usage.input_tokens && (
                      <Box>
                        <Text><Strong>Input:</Strong> {session.usage.input_tokens.toLocaleString()}</Text>
                      </Box>
                    )}
                    {session.usage.output_tokens && (
                      <Box>
                        <Text><Strong>Output:</Strong> {session.usage.output_tokens.toLocaleString()}</Text>
                      </Box>
                    )}
                    {session.usage.cache_read_tokens && (
                      <Box>
                        <Text><Strong>Cache Read:</Strong> {session.usage.cache_read_tokens.toLocaleString()}</Text>
                      </Box>
                    )}
                    {session.usage.cache_write_tokens && (
                      <Box>
                        <Text><Strong>Cache Write:</Strong> {session.usage.cache_write_tokens.toLocaleString()}</Text>
                      </Box>
                    )}
                  </Inline>
                </Stack>
              </Box>
            )}
          </>
        )}

        {/* OpenTelemetry Trace - Ready for Visualization */}
        <Stack space="space.200">
          <Heading size="medium">OpenTelemetry Trace</Heading>
          <Box backgroundColor="color.background.neutral.subtle" padding="space.300">
            <Stack space="space.200">
              <Text>
                This session has been converted to OpenTelemetry OTLP format with {allSpans.length} spans.
              </Text>
              
              {rootSpan && (
                <Stack space="space.100">
                  <Text><Strong>Root Span:</Strong></Text>
                  <Text>• Name: {rootSpan.name}</Text>
                  <Text>• Kind: {rootSpan.kind}</Text>
                  <Text>• Attributes: {rootSpan.attributes?.length || 0}</Text>
                </Stack>
              )}

              <SectionMessage appearance="information">
                <Stack space="space.100">
                  <Text>
                    <Strong>✅ Interactive Visualization Available!</Strong>
                  </Text>
                  <Text>
                    Click the "View Interactive Trace" button above to open the full TraceViewer 
                    in a new window. The visualization includes an interactive tree view, expandable 
                    span details, search functionality, and more.
                  </Text>
                  <Text appearance="subtle" size="small">
                    Note: Requires remote backend running at {remoteBackendUrl}
                  </Text>
                </Stack>
              </SectionMessage>
            </Stack>
          </Box>
        </Stack>

        {/* Span Summary */}
        <Stack space="space.200">
          <Heading size="small">Span Types</Heading>
          <Box backgroundColor="color.background.neutral.subtle" padding="space.200">
            <Stack space="space.100">
              {(() => {
                const spansByKind = {};
                allSpans.forEach(span => {
                  const kind = span.kind || 'UNKNOWN';
                  spansByKind[kind] = (spansByKind[kind] || 0) + 1;
                });
                
                return Object.entries(spansByKind).map(([kind, count]) => (
                  <Text key={kind}>• {kind}: {count} spans</Text>
                ));
              })()}
            </Stack>
          </Box>
        </Stack>

        {/* Sample Spans Preview */}
        <Stack space="space.200">
          <Heading size="small">Sample Spans (first 5)</Heading>
          <Stack space="space.150">
            {allSpans.slice(0, 5).map((span, index) => (
              <Box 
                key={span.spanId} 
                backgroundColor="color.background.neutral.subtle" 
                padding="space.200"
              >
                <Stack space="space.050">
                  <Text><Strong>{index + 1}. {span.name}</Strong></Text>
                  <Text appearance="subtle">Kind: {span.kind}</Text>
                  <Text appearance="subtle">Span ID: {span.spanId}</Text>
                  {span.parentSpanId && (
                    <Text appearance="subtle">Parent: {span.parentSpanId}</Text>
                  )}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
};

export default SessionViewer;
