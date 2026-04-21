import React, { useState, useEffect } from 'react';
import {
  Box,
  Stack,
  Heading,
  Text,
  Button,
  Table,
  Head,
  Row,
  Cell,
  SectionMessage,
  Spinner,
  Strong,
  Inline,
  Badge
} from '@forge/react';
import { invoke } from '@forge/bridge';

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp * 1000); // Convert from Unix seconds
  return date.toLocaleString();
};

const formatNumber = (num) => {
  if (!num) return '0';
  return num.toLocaleString();
};

export const SessionList = ({ onSessionSelect, refreshTrigger }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadSessions = async () => {
    console.log('SessionList: Starting to load sessions...');
    setLoading(true);
    setError(null);

    try {
      console.log('SessionList: Invoking listSessions...');
      const sessionsResponse = await invoke('listSessions');
      console.log('SessionList: listSessions response:', sessionsResponse);

      console.log('SessionList: Invoking getSessionStats...');
      const statsResponse = await invoke('getSessionStats');
      console.log('SessionList: getSessionStats response:', statsResponse);

      if (sessionsResponse.success) {
        console.log('SessionList: Setting sessions:', sessionsResponse.sessions);
        setSessions(sessionsResponse.sessions || []);
      } else {
        console.error('SessionList: Failed to load sessions:', sessionsResponse.error);
        setError(sessionsResponse.error || 'Failed to load sessions');
      }

      if (statsResponse.success) {
        console.log('SessionList: Setting stats:', statsResponse.stats);
        setStats(statsResponse.stats);
      }
    } catch (err) {
      console.error('SessionList: Error loading sessions:', err);
      setError(err.message || 'An error occurred');
    } finally {
      console.log('SessionList: Finished loading, setting loading=false');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [refreshTrigger]);

  const handleDelete = async (sessionId) => {
    // Note: confirm() may not work in Forge - just proceed with delete
    setDeletingId(sessionId);
    try {
      const response = await invoke('deleteSession', { sessionId });
      
      if (response.success) {
        await loadSessions(); // Reload the list
      } else {
        console.error('Failed to delete:', response.error);
      }
    } catch (err) {
      console.error('Error deleting session:', err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    // Note: confirm() may not work in Forge - just proceed
    setLoading(true);
    try {
      const response = await invoke('clearAllSessions');
      
      if (response.success) {
        await loadSessions();
      } else {
        console.error('Failed to clear sessions:', response.error);
      }
    } catch (err) {
      console.error('Error clearing sessions:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box padding="space.300">
        <Stack space="space.200" alignInline="center">
          <Spinner size="large" />
          <Text>Loading sessions...</Text>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding="space.300">
        <SectionMessage appearance="error" title="Error Loading Sessions">
          <Text>{error}</Text>
          <Button onClick={loadSessions}>Retry</Button>
        </SectionMessage>
      </Box>
    );
  }

  return (
    <Box padding="space.300">
      <Stack space="space.400">
        {/* Header */}
        <Stack space="space.200">
          <Inline space="space.200" alignBlock="center" spread="space-between">
            <Heading size="medium">Uploaded Sessions</Heading>
            <Button onClick={loadSessions}>Refresh</Button>
          </Inline>
        </Stack>

        {/* Statistics */}
        {stats && (
          <Box backgroundColor="color.background.accent.blue.subtlest" padding="space.200">
            <Stack space="space.150">
              <Heading size="small">Statistics</Heading>
              <Inline space="space.400">
                <Box>
                  <Text><Strong>Sessions:</Strong> {stats.totalSessions}</Text>
                </Box>
                <Box>
                  <Text><Strong>Messages:</Strong> {formatNumber(stats.totalMessages)}</Text>
                </Box>
                <Box>
                  <Text><Strong>Spans:</Strong> {formatNumber(stats.totalSpans)}</Text>
                </Box>
              </Inline>
              <Inline space="space.400">
                <Box>
                  <Text><Strong>Input Tokens:</Strong> {formatNumber(stats.totalInputTokens)}</Text>
                </Box>
                <Box>
                  <Text><Strong>Output Tokens:</Strong> {formatNumber(stats.totalOutputTokens)}</Text>
                </Box>
                <Box>
                  <Text><Strong>Cache Reads:</Strong> {formatNumber(stats.totalCacheReadTokens)}</Text>
                </Box>
              </Inline>
            </Stack>
          </Box>
        )}

        {/* Sessions Table */}
        {sessions.length === 0 ? (
          <SectionMessage appearance="information" title="No Sessions">
            <Text>No sessions have been uploaded yet. Use the Upload tab to add sessions.</Text>
          </SectionMessage>
        ) : (
          <Stack space="space.200">
            <Table>
              <Head>
                <Cell>
                  <Text><Strong>Title</Strong></Text>
                </Cell>
                <Cell>
                  <Text><Strong>Workspace</Strong></Text>
                </Cell>
                <Cell>
                  <Text><Strong>Date</Strong></Text>
                </Cell>
                <Cell>
                  <Text><Strong>Messages</Strong></Text>
                </Cell>
                <Cell>
                  <Text><Strong>Spans</Strong></Text>
                </Cell>
                <Cell>
                  <Text><Strong>Tokens</Strong></Text>
                </Cell>
                <Cell>
                  <Text><Strong>Actions</Strong></Text>
                </Cell>
              </Head>
              {sessions.map((session) => (
                <Row key={session.id}>
                  <Cell>
                    <Text>{session.title}</Text>
                  </Cell>
                  <Cell>
                    <Text appearance="subtle">{session.workspace}</Text>
                  </Cell>
                  <Cell>
                    <Text>{formatTimestamp(session.timestamp)}</Text>
                  </Cell>
                  <Cell>
                    <Text>{session.messageCount}</Text>
                  </Cell>
                  <Cell>
                    <Badge text={session.spanCount.toString()} />
                  </Cell>
                  <Cell>
                    <Text>
                      {formatNumber((session.usage?.input_tokens || 0) + (session.usage?.output_tokens || 0))}
                    </Text>
                  </Cell>
                  <Cell>
                    <Inline space="space.100">
                      <Button
                        appearance="primary"
                        onClick={() => onSessionSelect(session.id)}
                      >
                        View
                      </Button>
                      <Button
                        appearance="danger"
                        onClick={() => handleDelete(session.id)}
                        isDisabled={deletingId === session.id}
                      >
                        {deletingId === session.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </Inline>
                  </Cell>
                </Row>
              ))}
            </Table>

            <Box>
              <Button
                appearance="danger"
                onClick={handleClearAll}
                isDisabled={sessions.length === 0}
              >
                Clear All Sessions
              </Button>
            </Box>
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

export default SessionList;
