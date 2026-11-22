import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  getServerPortfolioStore,
  readJsonBody,
  sendJson,
  setServerPortfolioStore,
  verifySessionToken,
} from '../server/authService.ts';

function isSafeExternalUrl(url: unknown): boolean {
  if (typeof url !== 'string' || !url.trim() || url.startsWith('#')) return true;
  if (url.startsWith('data:image/webp;base64,') || url.startsWith('data:image/png;base64,') || url.startsWith('data:image/jpeg;base64,')) {
    return true;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  if (req.method === 'GET') {
    sendJson(res, 200, { portfolio: getServerPortfolioStore() });
    return;
  }

  if (req.method === 'POST') {
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
}
