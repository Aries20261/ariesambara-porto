import type { IncomingMessage, ServerResponse } from 'node:http';
import { claimInitialAdmin, readJsonBody, sendJson } from '../../server/authService.ts';

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const body = await readJsonBody(req);
  const result = claimInitialAdmin(body.username, body.password);

  if (!result.ok) {
    sendJson(res, result.status, { error: result.error });
    return;
  }

  sendJson(res, 200, {
    token: result.token,
    username: result.username,
    expiresAt: result.expiresAt,
  });
}
