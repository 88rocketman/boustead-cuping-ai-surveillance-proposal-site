const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = 8787;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const buildTarget = (targetHost) => {
  const cleaned = String(targetHost || "").trim().replace(/\/+$/, "");
  if (!cleaned) {
    throw new Error("Missing targetHost");
  }
  const base = cleaned.match(/^https?:\/\//) ? new URL(cleaned) : new URL(`https://${cleaned}`);

  const looksPathLike = base.pathname && base.pathname !== "/" && base.pathname !== "";
  if (!looksPathLike) {
    base.pathname = "/chat/completions";
  }
  return base;
};

const collectBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body || ""));
    req.on("error", reject);
  });

const postToModelStudio = (url, apiKey, bodyText) =>
  new Promise((resolve, reject) => {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Content-Length": Buffer.byteLength(bodyText),
      },
      rejectUnauthorized: false,
    };
    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode || 500,
          headers: {
            "content-type": res.headers["content-type"] || "application/json",
          },
          body: data,
        });
      });
    });
    req.on("error", reject);
    req.write(bodyText);
    req.end();
  });

const sendIndex = (res) => {
  const indexPath = path.join(process.cwd(), "index.html");
  if (!fs.existsSync(indexPath)) {
    res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "index.html not found in project root." }));
    return;
  }
  const html = fs.readFileSync(indexPath, "utf-8");
  res.writeHead(200, { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
};

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    sendIndex(res);
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", uptimeMs: Date.now() }));
    return;
  }

  if (req.method !== "POST" || req.url !== "/proxy") {
    res.writeHead(404, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found. Use POST /proxy." }));
    return;
  }

  try {
    const raw = await collectBody(req);
    const parsed = raw ? JSON.parse(raw) : {};
    const targetHost = parsed.targetHost || process.env.MS_HOST;
    const apiKey = parsed.apiKey || process.env.MS_API_KEY;
    const payload = parsed.payload || {};

    if (!targetHost || !apiKey) {
      throw new Error("Missing targetHost or apiKey. Send both in body or set MS_HOST / MS_API_KEY env vars.");
    }

    const target = buildTarget(targetHost);
    const bodyText = JSON.stringify(payload);
    const upstream = await postToModelStudio(target.toString(), apiKey, bodyText);
    res.writeHead(upstream.statusCode, { ...corsHeaders, "Content-Type": upstream.headers["content-type"] });
    res.end(upstream.body);
  } catch (err) {
    const message = err?.message || "Proxy error";
    console.error("[proxy]", message);
    res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: message,
      })
    );
  }
});

server.listen(PORT, () => {
  console.log(`modelstudio-proxy running at http://127.0.0.1:${PORT}`);
  console.log(`open: http://127.0.0.1:${PORT}/`);
});
