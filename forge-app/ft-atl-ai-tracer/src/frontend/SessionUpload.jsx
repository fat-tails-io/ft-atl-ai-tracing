import React, { useState } from 'react';
import {
  Box,
  Stack,
  Heading,
  Text,
  Button,
  SectionMessage,
  TextArea,
  Strong,
  Inline,
  xcss
} from '@forge/react';

const containerStyle = xcss({
  padding: 'space.300',
  backgroundColor: 'color.background.neutral.subtle'
});

const textAreaStyle = xcss({
  width: '100%',
  minHeight: '200px'
});

export const SessionUpload = ({ onUploadSuccess }) => {
  const [sessionContextText, setSessionContextText] = useState('');
  const [metadataText, setMetadataText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleUpload = async () => {
    setError(null);
    setSuccess(null);
    setUploading(true);

    try {
      // Parse the JSON inputs
      let sessionContext, metadata;
      
      try {
        sessionContext = JSON.parse(sessionContextText);
      } catch (e) {
        throw new Error('Invalid session_context.json: ' + e.message);
      }

      if (metadataText.trim()) {
        try {
          metadata = JSON.parse(metadataText);
        } catch (e) {
          throw new Error('Invalid metadata.json: ' + e.message);
        }
      }

      // Upload via resolver
      const { invoke } = await import('@forge/bridge');
      const response = await invoke('uploadSession', {
        sessionContext,
        metadata
      });

      if (response.success) {
        setSuccess(`Session "${response.session.title}" uploaded successfully! (${response.session.spanCount} spans)`);
        setSessionContextText('');
        setMetadataText('');
        
        // Notify parent component
        if (onUploadSuccess) {
          onUploadSuccess(response.session);
        }
      } else {
        setError(response.error || 'Upload failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setSessionContextText('');
    setMetadataText('');
    setError(null);
    setSuccess(null);
  };

  const loadExample = () => {
    const exampleContext = {
      id: 'example-session-' + Date.now(),
      timestamp: Math.floor(Date.now() / 1000),
      workspace_path: '/example/workspace',
      message_history: [
        {
          parts: [
            {
              content: 'Hello, this is an example session',
              part_kind: 'user-prompt',
              timestamp: new Date().toISOString()
            }
          ],
          timestamp: new Date().toISOString(),
          kind: 'request',
          run_id: 'example-run-' + Date.now(),
          instructions: null,
          metadata: null
        }
      ],
      usage: {
        input_tokens: 100,
        output_tokens: 50
      }
    };

    const exampleMetadata = {
      title: 'Example Session',
      workspace_path: '/example/workspace',
      is_manual_title: false,
      fork_data: null,
      bookmarks: []
    };

    setSessionContextText(JSON.stringify(exampleContext, null, 2));
    setMetadataText(JSON.stringify(exampleMetadata, null, 2));
  };

  return (
    <Box xcss={containerStyle}>
      <Stack space="space.300">
        <Heading size="medium">Upload Rovo Dev Session</Heading>
        
        <Text>
          Upload session files from <Strong>~/.rovodev/sessions/[session-id]/</Strong>
        </Text>

        {error && (
          <SectionMessage appearance="error" title="Upload Failed">
            <Text>{error}</Text>
          </SectionMessage>
        )}

        {success && (
          <SectionMessage appearance="success" title="Upload Successful">
            <Text>{success}</Text>
          </SectionMessage>
        )}

        <Stack space="space.200">
          <Box>
            <Text>
              <Strong>session_context.json</Strong> (required)
            </Text>
            <TextArea
              value={sessionContextText}
              onChange={(e) => setSessionContextText(e.target.value)}
              placeholder='Paste the contents of session_context.json here...'
              isDisabled={uploading}
              resize="vertical"
            />
          </Box>

          <Box>
            <Text>
              <Strong>metadata.json</Strong> (optional)
            </Text>
            <TextArea
              value={metadataText}
              onChange={(e) => setMetadataText(e.target.value)}
              placeholder='Paste the contents of metadata.json here (optional)...'
              isDisabled={uploading}
              resize="vertical"
            />
          </Box>
        </Stack>

        <Inline space="space.200">
          <Button
            appearance="primary"
            onClick={handleUpload}
            isDisabled={!sessionContextText.trim() || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Session'}
          </Button>
          
          <Button
            onClick={handleClear}
            isDisabled={uploading}
          >
            Clear
          </Button>

          <Button
            appearance="subtle"
            onClick={loadExample}
            isDisabled={uploading}
          >
            Load Example
          </Button>
        </Inline>

        <Box>
          <Text appearance="subtle" size="small">
            Tip: Copy session files using: cat ~/.rovodev/sessions/[session-id]/session_context.json
          </Text>
        </Box>
      </Stack>
    </Box>
  );
};

export default SessionUpload;
