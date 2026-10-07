// Servidor local simples para testar o jogo (sem dependências).
//   node tools/serve.mjs        → http://localhost:8080
// Também fica acessível na rede local, para testar no telemóvel ligado ao mesmo Wi-Fi.
// A página tools/logo.html pode guardar as imagens do logótipo em assets/ (só a partir deste
// computador): POST /__guardar/<nome>.png com o PNG no corpo do pedido.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const LOCAL = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const SAVEABLE = /^(share|share-square|icon-\d{3})\.png$/;

http.createServer((req, res) => {
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (err) { rel = '/'; }
  if (req.method === 'POST' && rel.startsWith('/__guardar/')) {
    const name = rel.slice('/__guardar/'.length);
    if (!LOCAL.has(req.socket.remoteAddress) || !SAVEABLE.test(name)) { res.writeHead(403).end('Proibido'); return; }
    const parts = [];
    req.on('data', (d) => parts.push(d));
    req.on('end', () => {
      const data = Buffer.concat(parts);
      if (data.length < 8 || data.readUInt32BE(0) !== 0x89504e47 || data.length > 4e6) { res.writeHead(400).end('Não é um PNG'); return; }
      fs.writeFileSync(path.join(ROOT, 'assets', name), data);
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Guardado em assets/' + name);
    });
    return;
  }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep)) {
    res.writeHead(403).end('Proibido');
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Não encontrado');
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Jogo disponível em http://localhost:${PORT}`);
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) {
      if (a.family === 'IPv4' && !a.internal) console.log(`Na rede local:     http://${a.address}:${PORT}`);
    }
  }
});
