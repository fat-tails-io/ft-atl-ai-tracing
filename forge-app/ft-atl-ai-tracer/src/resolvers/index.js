import Resolver from '@forge/resolver';
import { 
  syncAgents,
  getAgents,
  getAgentSummary
} from './remote-resolver.js';
import {
  uploadSession,
  listSessions,
  getSession,
  deleteSession,
  clearAllSessions,
  getSessionStats
} from './session-resolver.js';

const resolver = new Resolver();

// Legacy test resolver
resolver.define('getText', (req) => {
  console.log(req);
  return 'Hello, world!';
});

// Remote-based AI Agent resolvers
resolver.define('syncAgents', syncAgents);
resolver.define('getAgents', getAgents);
resolver.define('getAgentSummary', getAgentSummary);

// Session management resolvers
resolver.define('uploadSession', uploadSession);
resolver.define('listSessions', listSessions);
resolver.define('getSession', getSession);
resolver.define('deleteSession', deleteSession);
resolver.define('clearAllSessions', clearAllSessions);
resolver.define('getSessionStats', getSessionStats);

export const handler = resolver.getDefinitions();
