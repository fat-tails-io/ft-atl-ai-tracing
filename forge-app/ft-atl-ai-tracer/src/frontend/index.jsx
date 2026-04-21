import React, { useEffect, useState } from 'react';
import ForgeReconciler, { 
  Text, 
  Heading, 
  Strong,
  Box,
  Inline,
  Stack,
  Table,
  Head,
  Row,
  Cell,
  SectionMessage,
  Spinner,
  Button,
  Tabs,
  TabList,
  Tab,
  TabPanel
} from '@forge/react';
import { invoke } from '@forge/bridge';
import SessionUpload from './SessionUpload';
import SessionList from './SessionList';
import SessionViewer from './SessionViewer';

const App = () => {
  const [agentSummary, setAgentSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [lastSyncMessage, setLastSyncMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('sessions');
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadAgents = () => {
    setLoading(true);
    setError(null);
    
    invoke('getAgentSummary')
      .then((response) => {
        if (response.success) {
          setAgentSummary(response.data);
          setError(null);
        } else {
          setError(response.error || 'Failed to fetch agents');
        }
      })
      .catch((err) => {
        setError(err.message || 'An error occurred');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const syncAgents = () => {
    setSyncing(true);
    setError(null);
    setLastSyncMessage(null);
    
    invoke('syncAgents')
      .then((response) => {
        console.log('Sync response:', response);
        
        if (response.success) {
          setLastSyncMessage(`Synced ${response.agentsCount || 0} agents`);
          // Wait a moment for storage to be written, then reload
          setTimeout(loadAgents, 1000);
        } else {
          // Display the error from the backend
          const errorMessage = response.error || 'Sync failed';
          setError(errorMessage);
          console.error('Sync failed:', errorMessage);
        }
      })
      .catch((err) => {
        const errorMessage = err.message || 'Sync error occurred';
        setError(errorMessage);
        console.error('Sync error:', err);
      })
      .finally(() => {
        setSyncing(false);
      });
  };

  useEffect(() => {
    // Only load agents if on agents tab
    if (activeTab === 'agents') {
      loadAgents();
    }
  }, [activeTab]);

  const handleUploadSuccess = (session) => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('sessions');
  };

  const handleSessionSelect = (sessionId) => {
    setSelectedSessionId(sessionId);
  };

  const handleBackToSessions = () => {
    setSelectedSessionId(null);
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading && activeTab === 'agents') {
    return (
      <Box padding="space.300">
        <Stack space="space.200" alignInline="center">
          <Spinner size="large" />
          <Text>Loading AI agents...</Text>
        </Stack>
      </Box>
    );
  }

  return (
    <Box padding="space.300">
      <Stack space="space.400">
        {/* Header */}
        <Stack space="space.100">
          <Heading size="large">AI Traceability Tracker</Heading>
          <Text>Track and visualize Rovo Dev sessions with OpenTelemetry</Text>
        </Stack>

        {/* Tabs */}
        <Tabs 
          onChange={(index) => setActiveTab(['sessions', 'upload', 'agents'][index])} 
          id="main-tabs"
        >
          <TabList>
            <Tab>Sessions</Tab>
            <Tab>Upload Session</Tab>
            <Tab>AI Agents</Tab>
          </TabList>

          {/* Sessions Tab */}
          <TabPanel>
            {selectedSessionId ? (
              <SessionViewer 
                sessionId={selectedSessionId}
                onBack={handleBackToSessions}
              />
            ) : (
              <SessionList 
                onSessionSelect={handleSessionSelect}
                refreshTrigger={refreshTrigger}
              />
            )}
          </TabPanel>

          {/* Upload Session Tab */}
          <TabPanel>
            <SessionUpload onUploadSuccess={handleUploadSuccess} />
          </TabPanel>

          {/* AI Agents Tab */}
          <TabPanel>
            <Stack space="space.400">
              {error && (
                <SectionMessage 
                  appearance="error" 
                  title="API Access Denied - Missing Scope"
                >
                  <Stack space="space.200">
                    <Text>{error}</Text>
                    <Text>
                      The GraphQL API query requires the <Strong>rovo:atlassian-external</Strong> OAuth scope, 
                      which is currently not available to Forge apps using the Forge Installation Token (FIT).
                    </Text>
                    <Text>
                      This demonstrates a governance gap: Forge apps cannot programmatically access 
                      AI agent metadata for traceability and compliance purposes.
                    </Text>
                  </Stack>
                </SectionMessage>
              )}

              {/* Sync Controls */}
              <Box>
                <Button 
                  appearance="primary" 
                  onClick={syncAgents} 
                  isDisabled={syncing || loading}
                >
                  {syncing ? 'Syncing...' : 'Sync Agents from GraphQL API'}
                </Button>
                {lastSyncMessage && (
                  <Box paddingBlock="space.100">
                    <Text appearance="subtle">{lastSyncMessage}</Text>
                  </Box>
                )}
              </Box>

              {/* Summary Stats */}
              {agentSummary && (
                <Box 
                  backgroundColor="color.background.accent.blue.subtlest" 
                  padding="space.200"
                >
                  <Stack space="space.100">
                    <Inline space="space.200" alignBlock="center">
                      <Strong>Total Agents:</Strong>
                      <Text>{agentSummary?.totalAgents || 0}</Text>
                    </Inline>
                    {agentSummary?.hasMore && (
                      <Text>
                        <em>+ more agents available (pagination not yet implemented)</em>
                      </Text>
                    )}
                  </Stack>
                </Box>
              )}

              {/* Agents Table */}
              <Stack space="space.200">
                <Heading size="medium">AI Agents</Heading>
                
                {agentSummary?.agents && agentSummary.agents.length > 0 ? (
                  <Table>
                    <Head>
                      <Cell>
                        <Text><Strong>Name</Strong></Text>
                      </Cell>
                      <Cell>
                        <Text><Strong>Description</Strong></Text>
                      </Cell>
                      <Cell>
                        <Text><Strong>ID</Strong></Text>
                      </Cell>
                    </Head>
                    {agentSummary.agents.map((agent) => (
                      <Row key={agent.id}>
                        <Cell>
                          <Text>{agent.name || 'Unnamed Agent'}</Text>
                        </Cell>
                        <Cell>
                          <Text>{agent.description || 'No description'}</Text>
                        </Cell>
                        <Cell>
                          <Text appearance="subtle">{agent.id}</Text>
                        </Cell>
                      </Row>
                    ))}
                  </Table>
                ) : (
                  <SectionMessage appearance="information" title="No agents found">
                    <Text>No AI agents were found in this workspace.</Text>
                  </SectionMessage>
                )}
              </Stack>
            </Stack>
          </TabPanel>
        </Tabs>
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
