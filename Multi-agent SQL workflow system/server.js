"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".xml": "application/xml; charset=utf-8",
  ".ico": "image/x-icon",
};

function send(res, status, body, headers) {
  res.writeHead(status, headers);
  res.end(body);
}

function sendJson(res, status, obj) {
  send(res, status, JSON.stringify(obj), {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
}

function safeJoin(root, rel) {
  const resolved = path.resolve(root, rel);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

async function identityToken(audience) {
  const meta =
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=" +
    encodeURIComponent(audience);
  const res = await fetch(meta, { headers: { "Metadata-Flavor": "Google" } });
  if (!res.ok) {
    throw new Error("Could not mint an identity token for the model gateway (" + res.status + ")");
  }
  return res.text();
}

function extractText(payload) {
  const parts = payload && payload.candidates && payload.candidates[0] && payload.candidates[0].content && payload.candidates[0].content.parts;
  if (!Array.isArray(parts)) return "";
  return parts.map((p) => (p && p.text) || "").join("");
}

async function generateContent(system, user, maxOutputTokens) {
  const gateway = process.env.VVV_AI_MODEL_GATEWAY_URL;
  if (!gateway) {
    const err = new Error("VVV_AI_MODEL_GATEWAY_URL is not set");
    err.status = 503;
    throw err;
  }
  const token = await identityToken(gateway);
  const clamped = Math.max(1, Math.min(Number(maxOutputTokens) || 1024, 8192));
  const body = {
    systemInstruction: { parts: [{ text: system || "" }] },
    contents: [{ role: "user", parts: [{ text: user || "" }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: clamped,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  let attempt = 0;
  while (true) {
    const res = await fetch(gateway.replace(/\/$/, "") + "/api/ai/generateContent", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let parsed = {};
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      parsed = { message: text };
    }
    if (res.status === 429 && attempt < 4) {
      const wait = Number(res.headers.get("Retry-After") || 2);
      await new Promise((r) => setTimeout(r, Math.max(1, wait) * 1000));
      attempt += 1;
      continue;
    }
    if (!res.ok) {
      const err = new Error(parsed.message || parsed.code || ("gateway HTTP " + res.status));
      err.status = res.status;
      err.payload = parsed;
      throw err;
    }
    return extractText(parsed);
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let n = 0;
    req.on("data", (c) => {
      n += c.length;
      if (n > 2 * 1024 * 1024) {
        reject(new Error("request too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath).replace(/^\/+/, "");
  if (!rel || rel === "index.html") rel = "Index.html";
  const file = safeJoin(ROOT, rel);
  if (!file) {
    send(res, 400, "Bad path");
    return;
  }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      send(res, 404, "Not found");
      return;
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://127.0.0.1");
  if (req.method === "GET" && url.pathname === "/health") {
    send(res, 200, "ok");
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/complete") {
    try {
      const raw = await readBody(req);
      const input = raw ? JSON.parse(raw) : {};
      const text = await generateContent(input.system, input.user, input.maxOutputTokens);
      sendJson(res, 200, { text });
    } catch (err) {
      const status = err.status || (err.message === "request too large" ? 413 : 500);
      sendJson(res, status, err.payload || { code: "VVV_PLATFORM_ERROR", message: err.message || String(err) });
    }
    return;
  }
  if (req.method === "GET" || req.method === "HEAD") {
    serveStatic(req, res, url.pathname);
    return;
  }
  send(res, 405, "Method not allowed");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("listening on " + PORT);
});
