/**
 * Session management resolver for storing and retrieving Rovo Dev sessions
 */
import { storage } from '@forge/api';

// Import the converter utility
// Note: Using relative path since we're in the resolver context
const { convertRovoDevSessionToOTLP } = require('../utils/rovoDevSessionConverter.js');

const SESSIONS_STORAGE_KEY = 'rovodev-sessions';
const SESSION_PREFIX = 'session:';

/**
 * Upload and convert a Rovo Dev session to storage
 * Accepts session_context and metadata JSON, converts to OTLP, and stores
 */
export async function uploadSession(req) {
  try {
    const { sessionContext, metadata } = req.payload;
    
    if (!sessionContext || !sessionContext.id) {
      return {
        success: false,
        error: 'Invalid session data: missing session context or ID'
      };
    }

    console.log('Uploading session:', sessionContext.id);

    // Convert to OTLP format
    let otlpDocument;
    try {
      otlpDocument = convertRovoDevSessionToOTLP(sessionContext, metadata);
    } catch (conversionError) {
      console.error('Conversion error:', conversionError);
      return {
        success: false,
        error: `Failed to convert session: ${conversionError.message}`
      };
    }

    // Create session record
    const sessionRecord = {
      id: sessionContext.id,
      title: metadata?.title || 'Untitled Session',
      workspace: sessionContext.workspace_path || metadata?.workspace_path || 'Unknown',
      timestamp: sessionContext.timestamp || Date.now(),
      uploadedAt: Date.now(),
      messageCount: sessionContext.message_history?.length || 0,
      spanCount: otlpDocument.resourceSpans[0]?.scopeSpans[0]?.spans?.length || 0,
      usage: sessionContext.usage || {},
      otlpDocument: otlpDocument
    };

    // Store the session
    const sessionKey = `${SESSION_PREFIX}${sessionContext.id}`;
    await storage.set(sessionKey, sessionRecord);

    // Update the sessions index
    let sessionsList = await storage.get(SESSIONS_STORAGE_KEY) || [];
    
    // Remove existing entry if re-uploading
    sessionsList = sessionsList.filter(s => s.id !== sessionContext.id);
    
    // Add new entry (without the full OTLP document to keep index small)
    sessionsList.push({
      id: sessionRecord.id,
      title: sessionRecord.title,
      workspace: sessionRecord.workspace,
      timestamp: sessionRecord.timestamp,
      uploadedAt: sessionRecord.uploadedAt,
      messageCount: sessionRecord.messageCount,
      spanCount: sessionRecord.spanCount,
      usage: sessionRecord.usage
    });

    // Sort by timestamp descending (newest first)
    sessionsList.sort((a, b) => b.timestamp - a.timestamp);

    await storage.set(SESSIONS_STORAGE_KEY, sessionsList);

    console.log('Session uploaded successfully:', sessionContext.id);

    return {
      success: true,
      session: {
        id: sessionRecord.id,
        title: sessionRecord.title,
        spanCount: sessionRecord.spanCount,
        messageCount: sessionRecord.messageCount
      }
    };

  } catch (error) {
    console.error('Upload session error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload session'
    };
  }
}

/**
 * Get list of all uploaded sessions (metadata only, not full OTLP)
 */
export async function listSessions(req) {
  try {
    const sessionsList = await storage.get(SESSIONS_STORAGE_KEY) || [];
    
    return {
      success: true,
      sessions: sessionsList,
      count: sessionsList.length
    };
  } catch (error) {
    console.error('List sessions error:', error);
    return {
      success: false,
      error: error.message || 'Failed to list sessions',
      sessions: [],
      count: 0
    };
  }
}

/**
 * Get a specific session with full OTLP document
 */
export async function getSession(req) {
  try {
    const { sessionId } = req.payload;
    
    if (!sessionId) {
      return {
        success: false,
        error: 'Session ID is required'
      };
    }

    const sessionKey = `${SESSION_PREFIX}${sessionId}`;
    const sessionRecord = await storage.get(sessionKey);

    if (!sessionRecord) {
      return {
        success: false,
        error: 'Session not found'
      };
    }

    return {
      success: true,
      session: sessionRecord
    };

  } catch (error) {
    console.error('Get session error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get session'
    };
  }
}

/**
 * Delete a session from storage
 */
export async function deleteSession(req) {
  try {
    const { sessionId } = req.payload;
    
    if (!sessionId) {
      return {
        success: false,
        error: 'Session ID is required'
      };
    }

    // Remove from storage
    const sessionKey = `${SESSION_PREFIX}${sessionId}`;
    await storage.delete(sessionKey);

    // Update the index
    let sessionsList = await storage.get(SESSIONS_STORAGE_KEY) || [];
    sessionsList = sessionsList.filter(s => s.id !== sessionId);
    await storage.set(SESSIONS_STORAGE_KEY, sessionsList);

    return {
      success: true,
      message: 'Session deleted successfully'
    };

  } catch (error) {
    console.error('Delete session error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete session'
    };
  }
}

/**
 * Clear all sessions from storage
 */
export async function clearAllSessions(req) {
  try {
    // Get all session IDs
    const sessionsList = await storage.get(SESSIONS_STORAGE_KEY) || [];
    
    // Delete each session
    for (const session of sessionsList) {
      const sessionKey = `${SESSION_PREFIX}${session.id}`;
      await storage.delete(sessionKey);
    }

    // Clear the index
    await storage.set(SESSIONS_STORAGE_KEY, []);

    return {
      success: true,
      message: `Cleared ${sessionsList.length} sessions`,
      count: sessionsList.length
    };

  } catch (error) {
    console.error('Clear all sessions error:', error);
    return {
      success: false,
      error: error.message || 'Failed to clear sessions'
    };
  }
}

/**
 * Get session statistics
 */
export async function getSessionStats(req) {
  try {
    const sessionsList = await storage.get(SESSIONS_STORAGE_KEY) || [];
    
    const stats = {
      totalSessions: sessionsList.length,
      totalMessages: 0,
      totalSpans: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheReadTokens: 0,
      totalCacheWriteTokens: 0,
      workspaces: new Set(),
      oldestSession: null,
      newestSession: null
    };

    for (const session of sessionsList) {
      stats.totalMessages += session.messageCount || 0;
      stats.totalSpans += session.spanCount || 0;
      
      if (session.usage) {
        stats.totalInputTokens += session.usage.input_tokens || 0;
        stats.totalOutputTokens += session.usage.output_tokens || 0;
        stats.totalCacheReadTokens += session.usage.cache_read_tokens || 0;
        stats.totalCacheWriteTokens += session.usage.cache_write_tokens || 0;
      }
      
      if (session.workspace) {
        stats.workspaces.add(session.workspace);
      }
      
      if (!stats.oldestSession || session.timestamp < stats.oldestSession.timestamp) {
        stats.oldestSession = session;
      }
      
      if (!stats.newestSession || session.timestamp > stats.newestSession.timestamp) {
        stats.newestSession = session;
      }
    }

    stats.workspaces = Array.from(stats.workspaces);

    return {
      success: true,
      stats
    };

  } catch (error) {
    console.error('Get session stats error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get session stats'
    };
  }
}
