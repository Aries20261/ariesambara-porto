import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

interface ClaimedAdminRecord {
  username: string;
  salt: string;
  hashHex: string;
}

interface TokenPayload {
  sub: string;
  role: 'admin';
  iat: number;
  exp: number;
}

// Signing secret read from server process.env with a runtime random fallback.
const SESSION_SECRET = process.env.AUTH_SECRET?.trim() || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_SECONDS = 60 * 60 * 12; // 12 hours

// Use globalThis so state persists across HMR/module reloads within the same server process.
const globalState = globalThis as unknown as {
  __ariesClaimedAdmin?: ClaimedAdminRecord | null;
  __ariesPortfolioStore?: unknown;
  __ariesInquiriesStore?: unknown[];
  __ariesLoginFailures?: Map<string, { count: number; resetAt: number }>;
};

const CLAIM_STORE_PATH = path.join(os.tmpdir(), 'aries-portfolio-admin-claim.json');

function readClaimedAdmin(): ClaimedAdminRecord | null {
  if (globalState.__ariesClaimedAdmin) {
    return globalState.__ariesClaimedAdmin;
  }
  try {
    if (fs.existsSync(CLAIM_STORE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(CLAIM_STORE_PATH, 'utf8')) as Partial<ClaimedAdminRecord>;
      if (parsed.username && parsed.salt && parsed.hashHex) {
        const record: ClaimedAdminRecord = {
          username: parsed.username,
          salt: parsed.salt,
          hashHex: parsed.hashHex,
        };
        globalState.__ariesClaimedAdmin = record;
        return record;
      }
    }
  } catch {
    // Ignore unreadable temp store
  }
  return null;
}

function writeClaimedAdmin(record: ClaimedAdminRecord): void {
  globalState.__ariesClaimedAdmin = record;
  try {
    fs.writeFileSync(CLAIM_STORE_PATH, JSON.stringify(record), { encoding: 'utf8', mode: 0o600 });
  } catch {
    // Ignore read-only fs errors
  }
}

if (globalState.__ariesClaimedAdmin === undefined) {
  globalState.__ariesClaimedAdmin = readClaimedAdmin();
}
if (!globalState.__ariesInquiriesStore) {
  globalState.__ariesInquiriesStore = [];
}
if (!globalState.__ariesLoginFailures) {
  globalState.__ariesLoginFailures = new Map();
}

function sha256Buffer(value: string): Buffer {
  return crypto.createHash('sha256').update(value, 'utf8').digest();
}

export function constantTimeEqual(a: string, b: string): boolean {
  return crypto.timingSafeEqual(sha256Buffer(a), sha256Buffer(b));
}

function hashPasswordWithSalt(password: string, saltHex: string): string {
  return crypto.scryptSync(password, saltHex, 64).toString('hex');
}

export function isEnvAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim().length > 0);
}

export function getAuthState() {
  const envConfigured = isEnvAdminConfigured();
  const hasClaimed = readClaimedAdmin() !== null;
  return {
    configured: envConfigured || hasClaimed,
    needsSetup: !envConfigured && !hasClaimed,
    source: envConfigured ? 'env' : hasClaimed ? 'setup' : 'unconfigured',
  };
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((input.length + 3) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

export function createSessionToken(username: string): { token: string; expiresAt: number } {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + TOKEN_TTL_SECONDS;
  const payload: TokenPayload = {
    sub: username,
    role: 'admin',
    iat: now,
    exp,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = base64UrlEncode(
    crypto.createHmac('sha256', SESSION_SECRET).update(encodedPayload).digest()
  );
  return {
    token: `${encodedPayload}.${signature}`,
    expiresAt: exp * 1000,
  };
}

export function verifySessionToken(authHeader?: string | string[]): { valid: boolean; username?: string } {
  const raw = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!raw || !raw.startsWith('Bearer ')) {
    return { valid: false };
  }
  const token = raw.slice('Bearer '.length).trim();
  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false };
  }

  const [encodedPayload, providedSig] = parts;
  const expectedSig = base64UrlEncode(
    crypto.createHmac('sha256', SESSION_SECRET).update(encodedPayload).digest()
  );

  if (!constantTimeEqual(providedSig, expectedSig)) {
    return { valid: false };
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as TokenPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.role !== 'admin' || !payload.sub || typeof payload.exp !== 'number' || payload.exp < now) {
      return { valid: false };
    }
    return { valid: true, username: payload.sub };
  } catch {
    return { valid: false };
  }
}

export function claimInitialAdmin(
  usernameRaw: unknown,
  passwordRaw: unknown
): { ok: true; token: string; expiresAt: number; username: string } | { ok: false; status: number; error: string } {
  const state = getAuthState();
  if (!state.needsSetup) {
    return {
      ok: false,
      status: 409,
      error: 'Akun admin sudah dikonfigurasi dan terkunci.',
    };
  }

  const username = typeof usernameRaw === 'string' ? usernameRaw.trim() : '';
  const password = typeof passwordRaw === 'string' ? passwordRaw : '';

  if (username.length < 2 || username.length > 40 || !/^[a-zA-Z0-9._-]+$/.test(username)) {
    return {
      ok: false,
      status: 400,
      error: 'Username harus 2–40 karakter (huruf, angka, titik, atau garis bawah).',
    };
  }

  if (password.length < 6 || password.length > 128) {
    return {
      ok: false,
      status: 400,
      error: 'Kata sandi harus terdiri dari 6–128 karakter.',
    };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hashHex = hashPasswordWithSalt(password, salt);
  writeClaimedAdmin({ username, salt, hashHex });

  const session = createSessionToken(username);
  return {
    ok: true,
    username,
    token: session.token,
    expiresAt: session.expiresAt,
  };
}

function checkRateLimit(clientKey: string): boolean {
  const map = globalState.__ariesLoginFailures!;
  const now = Date.now();
  const entry = map.get(clientKey);
  if (!entry || entry.resetAt < now) {
    return true;
  }
  return entry.count < 10;
}

function recordFailure(clientKey: string) {
  const map = globalState.__ariesLoginFailures!;
  const now = Date.now();
  const entry = map.get(clientKey);
  if (!entry || entry.resetAt < now) {
    map.set(clientKey, { count: 1, resetAt: now + 10 * 60 * 1000 });
  } else {
    entry.count += 1;
  }
}

function clearFailures(clientKey: string) {
  globalState.__ariesLoginFailures!.delete(clientKey);
}

export function authenticateAdmin(
  usernameRaw: unknown,
  passwordRaw: unknown,
  clientKey = 'default'
): { ok: true; token: string; expiresAt: number; username: string } | { ok: false; status: number; error: string } {
  if (!checkRateLimit(clientKey)) {
    return {
      ok: false,
      status: 429,
      error: 'Terlalu banyak percobaan masuk. Coba lagi beberapa menit lagi.',
    };
  }

  const username = typeof usernameRaw === 'string' ? usernameRaw.trim() : '';
  const password = typeof passwordRaw === 'string' ? passwordRaw : '';

  if (!username || !password) {
    return {
      ok: false,
      status: 400,
      error: 'Username dan kata sandi wajib diisi.',
    };
  }

  if (isEnvAdminConfigured()) {
    const envUser = (process.env.ADMIN_USERNAME?.trim() || 'admin');
    const envPass = process.env.ADMIN_PASSWORD!;
    const userOk = constantTimeEqual(username, envUser);
    const passOk = constantTimeEqual(password, envPass);
    if (!userOk || !passOk) {
      recordFailure(clientKey);
      return {
        ok: false,
        status: 401,
        error: 'Username atau kata sandi admin tidak valid.',
      };
    }
    clearFailures(clientKey);
    const session = createSessionToken(envUser);
    return { ok: true, username: envUser, token: session.token, expiresAt: session.expiresAt };
  }

  const claimed = readClaimedAdmin();
  if (claimed) {
    const record = claimed;
    const candidateHash = hashPasswordWithSalt(password, record.salt);
    const userOk = constantTimeEqual(username, record.username);
    const passOk = constantTimeEqual(candidateHash, record.hashHex);
    if (!userOk || !passOk) {
      recordFailure(clientKey);
      return {
        ok: false,
        status: 401,
        error: 'Username atau kata sandi admin tidak valid.',
      };
    }
    clearFailures(clientKey);
    const session = createSessionToken(record.username);
    return { ok: true, username: record.username, token: session.token, expiresAt: session.expiresAt };
  }

  return {
    ok: false,
    status: 400,
    error: 'Akun admin belum diatur. Lengkapi pengaturan awal terlebih dahulu.',
  };
}

export function getClientIp(req: IncomingMessage): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) {
    return fwd.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

export async function readJsonBody(req: IncomingMessage & { body?: unknown }): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    return req.body as Record<string, unknown>;
  }
  if (typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }

  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    const MAX_BYTES = 2 * 1024 * 1024; // 2 MB limit
    req.on('data', (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes <= MAX_BYTES) {
        chunks.push(chunk);
      }
    });
    req.on('end', () => {
      if (totalBytes > MAX_BYTES || chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        const parsed = JSON.parse(text);
        resolve(parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

export function getServerPortfolioStore(): unknown {
  return globalState.__ariesPortfolioStore ?? null;
}

export function setServerPortfolioStore(data: unknown): void {
  globalState.__ariesPortfolioStore = data;
}

export function getServerInquiriesStore(): unknown[] {
  return globalState.__ariesInquiriesStore ?? [];
}

export function addServerInquiry(item: unknown): void {
  globalState.__ariesInquiriesStore = [item, ...(globalState.__ariesInquiriesStore ?? [])].slice(0, 100);
}
