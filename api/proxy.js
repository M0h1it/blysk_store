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
    const raw = req.query.__path;
    const path = Array.isArray(raw) ? raw.join("/") : raw || "";

    const query = { ...req.query };
    delete query.__path;

    const qs = new URLSearchParams(query).toString();

    const url = `${BACKEND}/api/${path}${qs ? `?${qs}` : ""}`;

    const headers = { ...req.headers };

    delete headers.host;
    delete headers.origin;
    delete headers.referer;
    delete headers["content-length"];
    delete headers["accept-encoding"];

    let body;

    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await readBody(req);
    }

    const response = await fetch(url, {
      method: req.method,
      headers,
      body,
    });

    const data = Buffer.from(await response.arrayBuffer());

    res.status(response.status);

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.send(data);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
}