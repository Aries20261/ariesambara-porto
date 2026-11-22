import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson } from '../../server/authService.ts';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  sendJson(res, 200, { ok: true });
}
