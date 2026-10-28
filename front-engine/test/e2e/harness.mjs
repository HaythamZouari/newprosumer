// Outils E2E : serveur statique sur dist/ + navigateur Chromium (Playwright global).
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
export const DIST = join(here, '..', '..', 'dist');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.eot': 'application/vnd.ms-fontobject' };

export function startServer({ root = DIST, spaFallback = false } = {}) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    let p = join(root, decodeURIComponent(url.pathname));
    if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
    if (!existsSync(p)) {
      if (spaFallback && !/^\/(build|app|src|api)\//.test(url.pathname) && !extname(url.pathname)) p = join(root, 'index.html');
      else { res.writeHead(404); res.end('not found'); return; }
    }
    const ct = MIME[extname(p)] || 'application/octet-stream';
    res.writeHead(200, { 'content-type': /^(text|application\/json)/.test(ct) ? ct + '; charset=utf-8' : ct });
    res.end(readFileSync(p));
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${server.address().port}` })));
}

export async function launch() {
  const globalRoot = execSync('npm root -g').toString().trim();
  const { chromium } = require(join(globalRoot, 'playwright'));
  const browser = await chromium.launch();
  return { browser };
}
