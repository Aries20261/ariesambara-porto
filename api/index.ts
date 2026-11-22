import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  addServerInquiry,
  authenticateAdmin,
  claimInitialAdmin,
  getAuthState,
  getClientIp,
  getServerInquiriesStore,
  getServerPortfolioStore,
  readJsonBody,
  sendJson,
  setServerPortfolioStore,
  verifySessionToken,
} from '../server/authService.ts';

function isSafeExternalUrl(url: unknown): boolean {
  if (typeof url !== 'string' || !url.trim() || url.startsWith('#')) return true;
  if (
    url.startsWith('data:image/webp;base64,') ||
    url.startsWith('data:image/png;base64,') ||
    url.startsWith('data:image/jpeg;base64,')
  ) {
    return true;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export default async function handler(
  req: IncomingMessage & { body?: unknown; url?: string },
  res: ServerResponse
) {
  const rawUrl = req.url || '/';
  const pathname = rawUrl.split('?')[0].replace(/\/+$/, '');
  const method = (req.method || 'GET').toUpperCase();

  // /api/auth/status
  if (pathname === '/api/auth/status') {
    if (method !== 'GET') {
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
    return;
  }

  // /api/auth/setup
  if (pathname === '/api/auth/setup') {
    if (method !== 'POST') {
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
    return;
  }

  // /api/auth/login
  if (pathname === '/api/auth/login') {
    if (method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }
    const body = await readJsonBody(req);
    const clientIp = getClientIp(req);
    const result = authenticateAdmin(body.username, body.password, clientIp);
    if (!result.ok) {
      sendJson(res, result.status, { error: result.error });
      return;
    }
    sendJson(res, 200, {
      token: result.token,
      username: result.username,
      expiresAt: result.expiresAt,
    });
    return;
  }

  // /api/auth/logout
  if (pathname === '/api/auth/logout') {
    if (method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }
    sendJson(res, 200, { ok: true });
    return;
  }

  // /api/portfolio
  if (pathname === '/api/portfolio') {
    if (method === 'GET') {
      sendJson(res, 200, { portfolio: getServerPortfolioStore() });
      return;
    }
    if (method === 'POST') {
      const session = verifySessionToken(req.headers.authorization);
      if (!session.valid) {
        sendJson(res, 401, { error: 'Sesi admin tidak valid atau telah berakhir.' });
        return;
      }
      const body = await readJsonBody(req);
      const portfolio = body.portfolio as Record<string, unknown> | undefined;
      if (
        !portfolio ||
        typeof portfolio !== 'object' ||
        Array.isArray(portfolio) ||
        !portfolio.profile ||
        typeof portfolio.profile !== 'object' ||
        !Array.isArray(portfolio.experiences)
      ) {
        sendJson(res, 400, { error: 'Struktur data portofolio tidak valid.' });
        return;
      }
      const profile = portfolio.profile as Record<string, unknown>;
      if (!isSafeExternalUrl(profile.avatar_url) || !isSafeExternalUrl(profile.cv_url)) {
        sendJson(res, 400, { error: 'Tautan avatar atau CV mengandung protokol yang tidak diizinkan.' });
        return;
      }
      setServerPortfolioStore(portfolio);
      sendJson(res, 200, { ok: true, updatedBy: session.username });
      return;
    }
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  // /api/inquiries
  if (pathname === '/api/inquiries') {
    if (method === 'GET') {
      const session = verifySessionToken(req.headers.authorization);
      if (!session.valid) {
        sendJson(res, 401, { error: 'Otentikasi admin diperlukan untuk melihat inbox.' });
        return;
      }
      sendJson(res, 200, { inquiries: getServerInquiriesStore() });
      return;
    }
    if (method === 'POST') {
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
    return;
  }

  sendJson(res, 404, { error: 'API endpoint not found' });
}
