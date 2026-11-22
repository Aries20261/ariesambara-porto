import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  addServerInquiry,
  getServerInquiriesStore,
  readJsonBody,
  sendJson,
  verifySessionToken,
} from '../server/authService.ts';

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  if (req.method === 'GET') {
    const session = verifySessionToken(req.headers.authorization);
    if (!session.valid) {
      sendJson(res, 401, { error: 'Otentikasi admin diperlukan untuk melihat inbox.' });
      return;
    }
    sendJson(res, 200, { inquiries: getServerInquiriesStore() });
    return;
  }

  if (req.method === 'POST') {
    const body = await readJsonBody(req);
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
    const contact = typeof body.contact === 'string' ? body.contact.trim().slice(0, 160) : '';
    const scope = typeof body.scope === 'string' ? body.scope.trim().slice(0, 160) : '';
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : '';

    if (!name || !contact || !message) {
      sendJson(res, 400, { error: 'Nama, kontak, dan pesan wajib diisi.' });
      return;
    }

    const record = {
      id: `inq-${Date.now()}`,
      name,
      contact,
      scope: scope || 'Konsultasi Umum',
      message,
      submitted_at: new Date().toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    };

    addServerInquiry(record);
    sendJson(res, 201, { ok: true, inquiry: record });
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
}
