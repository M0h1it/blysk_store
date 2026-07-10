// Serverless proxy for /api/*  (routed here by the rewrite in vercel.json).
//
// 1. Strips the Origin/Referer headers — the backend's CORS layer returns 500
//    whenever an Origin header is present.
// 2. Injects login credentials for /api/auth/login from SERVER-SIDE env vars
//    (API_AUTH_EMAIL / API_AUTH_PASSWORD — NO "VITE_" prefix, so they never end
//    up in the browser bundle).

export const config = { api: { bodyParser: false } };

const BACKEND = 'https://api.blyskjewels.com';

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  try {
    // The rewrite passes the real path in ?__path=... ; other query params pass through.
    const raw = req.query.__path;
    const path = Array.isArray(raw) ? raw.join('/') : raw || '';
    const rest = { ...req.query };
    delete rest.__path;
    const qs = new URLSearchParams(rest).toString();
    const target = `${BACKEND}/api/${path}${qs ? `?${qs}` : ''}`;

    const method = req.method || 'GET';

    const headers = { ...req.headers };
    delete headers.origin;
    delete headers.referer;
    delete headers.host;
    delete headers['content-length'];
    delete headers['accept-encoding'];

    let body = method === 'GET' || method === 'HEAD' ? undefined : await readRawBody(req);

    // Inject real credentials server-side for the login route.
    if (method === 'POST' && path.startsWith('auth/login')) {
      const email = process.env.API_AUTH_EMAIL;
      const password = process.env.API_AUTH_PASSWORD;
      if (email && password) {
        body = JSON.stringify({ email, password });
        headers['content-type'] = 'application/json';
      }
    }

    const upstream = await fetch(target, { method, headers, body });
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.status(upstream.status);
    const ct = upstream.headers.get('content-type');
    if (ct) res.setHeader('content-type', ct);
    res.send(buf);
  } catch (err) {
    res.status(502).json({ error: { code: 'PROXY_ERROR', message: String(err) } });
  }
}