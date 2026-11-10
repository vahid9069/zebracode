import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('out');
const port = Number(process.env.PORT || 3004);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

http.createServer(async (req, res) => {
    if (!['GET', 'HEAD'].includes(req.method || '')) { res.writeHead(405); res.end(); return; }
    try {
        const url = new URL(req.url || '/', 'http://localhost');
        if (url.pathname === '/' || url.pathname === '/blog') { res.writeHead(302, { Location: '/blog/' }); res.end(); return; }
        if (!url.pathname.startsWith('/blog/')) { res.writeHead(404); res.end('Not found'); return; }
        const relative = decodeURIComponent(url.pathname.slice('/blog/'.length));
        let file = path.resolve(root, relative || 'index.html');
        if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
        if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
        const body = await readFile(file);
        res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
        res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        try { res.end(req.method === 'HEAD' ? undefined : await readFile(path.join(root, '404.html'))); }
        catch { res.end('Run npm run build before starting the static preview.'); }
    }
}).listen(port, '127.0.0.1', () => console.log(`Static blog preview: http://127.0.0.1:${port}/blog/`));
