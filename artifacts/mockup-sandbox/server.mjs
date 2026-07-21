/**
 * Minimal SPA-friendly static file server — no external dependencies.
 *
 * Replaces `serve -s` to avoid the Express 5 path-to-regexp issue where bare
 * `'*'` wildcard routes throw `PathError: Missing parameter name at index 1: *`.
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "public");
const PORT = Number(process.env.PORT ?? 3000);

/** Extension → MIME type map. */
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
};

function serveFile(res, filePath, status = 200) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";
  res.writeHead(status, { "Content-Type": contentType });
  createReadStream(filePath).pipe(res);
}

const server = createServer((req, res) => {
  try {
    // Strip query string. Use decodeURIComponent inside try so malformed
    // percent-encoded paths (e.g. /%E0%A4%A) return 400 instead of crashing.
    let rawPath;
    try {
      rawPath = decodeURIComponent(req.url.split("?")[0]);
    } catch {
      res.writeHead(400);
      res.end("Bad Request");
      return;
    }

    const filePath = path.join(PUBLIC, rawPath);

    // Security: prevent path traversal outside PUBLIC
    if (!filePath.startsWith(PUBLIC + path.sep) && filePath !== PUBLIC) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    const stat = existsSync(filePath) && statSync(filePath);
    if (stat && stat.isFile()) {
      // Serve the file directly
      serveFile(res, filePath);
    } else if (stat && stat.isDirectory()) {
      // Try index.html inside the directory
      const indexPath = path.join(filePath, "index.html");
      if (existsSync(indexPath)) {
        serveFile(res, indexPath);
      } else {
        // SPA fallback
        serveFile(res, path.join(PUBLIC, "index.html"));
      }
    } else {
      // SPA fallback — return index.html for all unmatched routes
      serveFile(res, path.join(PUBLIC, "index.html"));
    }
  } catch (err) {
    console.error("Error serving", req.url, err);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end("Internal Server Error");
    }
  }
});

server.listen(PORT, () => {
  console.log(`Serving ${PUBLIC} on port ${PORT}`);
});
