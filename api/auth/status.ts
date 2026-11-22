import type { IncomingMessage, ServerResponse } from 'node:http';
import { getAuthState, sendJson, verifySessionToken } from '../../server/authService.ts';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const state = getAuthState();
  const session = verifySessionToken(req.headers.authorization);

  sendJson(res, 200, {
    configured: state.configured,
    needsSetup: state.needsSetup,
    source: state.source,
    authenticated: session.valid,
    username: session.valid ? session.username : undefined,
  });
}
