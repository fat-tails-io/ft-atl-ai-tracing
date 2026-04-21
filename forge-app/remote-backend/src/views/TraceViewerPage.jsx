import React, { useState, useEffect } from 'react';
import { openTelemetrySpanAdapter } from '@evilmartians/agent-prism-data';
import { TraceViewer } from '../components/agent-prism/TraceViewer/TraceViewer';
import '../components/agent-prism/theme/theme.css';

export const TraceViewerPage = ({ sessionId, forgeAppUrl }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [traceViewerData, setTraceViewerData] = useState(null);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch session data from Forge app API
      const response = await fetch(`${forgeAppUrl}/api/session/${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load session: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load session');
      }

      setSession(data.session);
      convertToTraceViewerData(data.session);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const convertToTraceViewerData = (sessionData) => {
    try {
      if (!sessionData?.otlpDocument) {
        throw new Error('No OTLP document found in session');
      }

      // Convert OTLP document to spans using agent-prism adapter
      const spans = openTelemetrySpanAdapter.convertRawDocumentsToSpans([sessionData.otlpDocument]);
      
      // Build hierarchical tree structure
      const spanTree = openTelemetrySpanAdapter.convertRawSpansToSpanTree(spans);

      // Create trace record
      const rootSpan = sessionData.otlpDocument?.resourceSpans?.[0]?.scopeSpans?.[0]?.spans?.[0];
      const traceRecord = {
        id: rootSpan?.traceId || sessionData.id,
        name: sessionData.title,
        startedAt: sessionData.timestamp || Date.now(),
        endedAt: sessionData.timestamp || Date.now(),
      };

      // Create badges with session metadata
      const badges = [
        { label: `${sessionData.messageCount} messages`, variant: 'blue' },
        { label: `${sessionData.spanCount} spans`, variant: 'purple' },
      ];

      if (sessionData.usage?.input_tokens) {
        badges.push({ 
          label: `${sessionData.usage.input_tokens.toLocaleString()} input tokens`, 
          variant: 'green' 
        });
      }

      if (sessionData.usage?.output_tokens) {
        badges.push({ 
          label: `${sessionData.usage.output_tokens.toLocaleString()} output tokens`, 
          variant: 'yellow' 
        });
      }

      setTraceViewerData([{
        traceRecord,
        badges,
        spans: spanTree,
      }]);
    } catch (err) {
      console.error('Error converting OTLP to TraceViewer format:', err);
      setError(`Conversion error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>🔄 Loading session...</div>
          <div style={{ color: '#666' }}>Session ID: {sessionId}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ 
          maxWidth: '600px', 
          padding: '32px', 
          backgroundColor: '#fee', 
          borderRadius: '8px',
          border: '2px solid #c00'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '16px', color: '#c00' }}>
            ❌ Error Loading Session
          </div>
          <div style={{ color: '#600', marginBottom: '16px' }}>{error}</div>
          <button 
            onClick={() => loadSession()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#c00',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!traceViewerData) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div>No trace data available</div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ 
        padding: '16px 24px', 
        backgroundColor: '#0052CC',
        color: 'white',
        borderBottom: '2px solid #0747A6',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
          AI Traceability Tracker - Interactive Trace Viewer
        </h1>
        <div style={{ marginTop: '8px', fontSize: '14px', opacity: 0.9 }}>
          {session?.title} • {session?.workspace}
        </div>
      </div>

      {/* TraceViewer */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <TraceViewer data={traceViewerData} />
      </div>
    </div>
  );
};
