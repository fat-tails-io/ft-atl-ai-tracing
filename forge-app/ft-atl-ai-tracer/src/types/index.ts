/**
 * TypeScript types for ft-atl-ai-tracer
 * AI App Summary and Traceability
 */

// ============================================================================
// AI App Summary Types
// ============================================================================

/**
 * Represents a single AI app created or used in the Atlassian environment
 */
export interface AIApp {
  /** Unique identifier for the AI app */
  id: string;
  /** Human-readable name of the AI app */
  name: string;
  /** App type (e.g., 'rovo-agent', 'custom-skill', 'ai-integration') */
  type: AIAppType;
  /** Current status of the app */
  status: AIAppStatus;
  /** When the app was created */
  createdDate: string; // ISO 8601 date string
  /** Who created the app */
  createdBy: string;
  /** When the app was last modified */
  lastModified?: string;
  /** Brief description of what the app does */
  description?: string;
  /** Associated Atlassian site/space */
  site?: string;
}

/**
 * Types of AI apps we can track
 */
export type AIAppType = 
  | 'rovo-agent'        // Rovo AI agent
  | 'custom-skill'      // Custom AI skill
  | 'ai-integration'    // Third-party AI integration
  | 'copilot'           // AI Copilot instances
  | 'automation'        // AI-powered automation
  | 'other';

/**
 * Status states for AI apps
 */
export type AIAppStatus = 
  | 'active'      // Currently running/in use
  | 'draft'       // Created but not deployed
  | 'disabled'    // Temporarily disabled
  | 'archived';   // No longer in use

/**
 * Summary statistics for AI apps
 */
export interface AIAppSummary {
  /** Total number of AI apps */
  totalApps: number;
  /** Count by type */
  byType: Record<AIAppType, number>;
  /** Count by status */
  byStatus: Record<AIAppStatus, number>;
  /** When this summary was generated */
  generatedAt: string;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Response from GraphQL API queries
 */
export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: GraphQLError[];
}

/**
 * GraphQL error structure
 */
export interface GraphQLError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: string[];
  extensions?: Record<string, unknown>;
}

/**
 * REST API response wrapper
 */
export interface RESTResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

// ============================================================================
// Resolver Request/Response Types
// ============================================================================

/**
 * Request payload from frontend to resolvers
 */
export interface ResolverRequest<T = unknown> {
  payload?: T;
  context: {
    accountId?: string;
    siteId?: string;
    projectId?: string;
    projectKey?: string;
  };
}

/**
 * Response from resolver functions
 */
export interface ResolverResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// Frontend State Types
// ============================================================================

/**
 * Loading state for async operations
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Component state for AI app list
 */
export interface AIAppListState {
  apps: AIApp[];
  summary: AIAppSummary | null;
  loadingState: LoadingState;
  error: string | null;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * App configuration settings
 */
export interface AppConfig {
  /** Enable GraphQL API queries */
  enableGraphQL: boolean;
  /** Enable REST API queries */
  enableREST: boolean;
  /** Cache duration in seconds */
  cacheDuration: number;
  /** Maximum number of apps to display */
  maxAppsToDisplay: number;
}
