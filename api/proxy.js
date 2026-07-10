export const config = {
  api: {
    bodyParser: false,
  },
};

const BACKEND = "https://api.blyskjewels.com";

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  try {
    // Get path from rewrite
    const raw = req.query.__path;
    const path = Array.isArray(raw) ? raw.join("/") : raw || "";

    // Preserve query parameters
    const query = { ...req.query };
    delete query.__path;

    const qs = new URLSearchParams(query).toString();

    const target = `${BACKEND}/api/${path}${qs ? `?${qs}` : ""}`;

    // Copy request headers
    const headers = {};

    Object.keys(req.headers).forEach((key) => {
      const lower = key.toLowerCase();

      // Remove problematic headers
      if (
        lower === "host" ||
        lower === "origin" ||
        lower === "referer" ||
        lower === "content-length" ||
        lower === "accept-encoding"
      ) {
        return;
      }

      headers[key] = req.headers[key];
    });

    // Read request body
    let body;

    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await readBody(req);
    }

    // Forward request
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
      redirect: "follow",
    });

    // Read response
    const buffer = Buffer.from(await upstream.arrayBuffer());

    // Status
    res.status(upstream.status);

    // Copy headers except encoding headers
    upstream.headers.forEach((value, key) => {
      const lower = key.toLowerCase();

      if (
        lower === "content-encoding" ||
        lower === "content-length" ||
        lower === "transfer-encoding" ||
        lower === "connection"
      ) {
        return;
      }

      res.setHeader(key, value);
    });

    res.send(buffer);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}