// Serverless proxy for /api/*.
//
// Two jobs:
// 1. Strip the Origin/Referer headers — the backend's CORS layer returns a 500
//    whenever an Origin header is present, so we remove it before forwarding.
// 2. Inject the login credentials for /api/auth/login from SERVER-SIDE env vars
//    (API_AUTH_EMAIL / API_AUTH_PASSWORD — note: NO "VITE_" prefix, so they are
//    never bundled into the browser JavaScript). This keeps the admin password
//    off the client entirely.
//
// Because the browser calls this on our own origin, no CORS applies to responses.

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
    const target = `${BACKEND}${req.url}`;
    const method = req.method || 'GET';

    // Copy headers, minus the ones that break the backend or mislead it.
    const headers = { ...req.headers };
    delete headers.origin;
    delete headers.referer;
    delete headers.host;
    delete headers['content-length'];
    delete headers['accept-encoding'];

    let body = method === 'GET' || method === 'HEAD' ? undefined : await readRawBody(req);

    // Inject real credentials server-side for the login route.
    if (method === 'POST' && req.url.startsWith('/api/auth/login')) {
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