/**
 * TypeScript type definitions for Rovo Dev session data structures
 */

export interface RovoDevSessionMetadata {
  bookmarks: any[];
  fork_data: any | null;
  is_manual_title: boolean;
  title: string;
  workspace_path: string;
}

export interface RovoDevMessagePart {
  content?: string;
  timestamp?: string;
  dynamic_ref?: string | null;
  part_kind: 
    | 'system-prompt'
    | 'user-prompt'
    | 'text'
    | 'tool-call'
    | 'tool-return'
    | 'thinking'
    | string;
  
  // Tool-specific fields
  tool_name?: string;
  tool_call_id?: string;
  args?: string;
  
  // Provider info
  id?: string | null;
  provider_name?: string | null;
  provider_details?: any | null;
  
  // Metadata
  metadata?: any | null;
}

export interface RovoDevMessage {
  parts: RovoDevMessagePart[];
  timestamp: string;
  instructions: string | null;
  kind: 'request' | 'response' | string;
  run_id: string;
  metadata: any | null;
}

export interface RovoDevUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_tokens?: number;
  cache_write_tokens?: number;
  input_audio_tokens?: number;
  output_audio_tokens?: number;
}

export interface RovoDevSessionContext {
  id: string;
  deps: {
    artifacts: {
      'metadata.json': RovoDevSessionMetadata;
    };
  };
  message_history: RovoDevMessage[];
  deferred_results?: any;
  usage?: RovoDevUsage;
  timestamp?: number;
  initial_prompt?: string;
  prompts?: any;
  latest_result?: any;
  workspace_path?: string;
  base_log_dir?: string;
  is_subagent?: boolean;
  subagent_tool_call_id?: string | null;
}

export interface RovoDevSession {
  context: RovoDevSessionContext;
  metadata: RovoDevSessionMetadata;
}
