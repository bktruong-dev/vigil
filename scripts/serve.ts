// Serves the built site (dist/) locally with the same security headers as
// vercel.json, so the Content-Security-Policy can be tested before deploying.
// Run: npm.cmd run build, then npm.cmd run serve

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
const headers: Record<string, string> = {};
for (const h of config.headers[0].headers) headers[h.key] = h.value;
// Local http can't be upgraded to https.
headers['Content-Security-Policy'] = headers['Content-Security-Policy'].replace('; upgrade-insecure-requests', '');
delete headers['Strict-Transport-Security'];

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.png': 'image/png',
};

createServer(async (req, res) => {
  let path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  let file = join(root, path);
  try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); } catch { file = join(root, path + '.html'); }
  try {
    const body = await readFile(file);
    res.writeHead(200, { ...headers, 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, headers); res.end('Not found');
  }
}).listen(4322, () => console.log('Serving dist/ with production headers at http://localhost:4322'));
