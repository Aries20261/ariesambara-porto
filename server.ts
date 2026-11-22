import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import statusHandler from './api/auth/status.ts';
import setupHandler from './api/auth/setup.ts';
import loginHandler from './api/auth/login.ts';
import logoutHandler from './api/auth/logout.ts';
import portfolioHandler from './api/portfolio.ts';
import inquiriesHandler from './api/inquiries.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // Mount API routes matching Vercel Serverless Functions
  app.all('/api/auth/status', (req, res) => {
    void statusHandler(req, res);
  });
  app.all('/api/auth/setup', (req, res) => {
    void setupHandler(req, res);
  });
  app.all('/api/auth/login', (req, res) => {
    void loginHandler(req, res);
  });
  app.all('/api/auth/logout', (req, res) => {
    void logoutHandler(req, res);
  });
  app.all('/api/portfolio', (req, res) => {
    void portfolioHandler(req, res);
  });
  app.all('/api/inquiries', (req, res) => {
    void inquiriesHandler(req, res);
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
