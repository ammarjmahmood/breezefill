import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

function readArg(flag, fallback) {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const host = readArg("--host", "127.0.0.1");
const port = Number(readArg("--port", "4173"));

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8"
};

function resolveFilePath(urlPathname) {
  const safePathname = decodeURIComponent(urlPathname.split("?")[0] || "/");
  const relativePath = safePathname === "/" ? "/test-form.html" : safePathname;
  const absolutePath = path.resolve(rootDir, `.${relativePath}`);

  if (!absolutePath.startsWith(rootDir)) {
    throw new Error("Forbidden path");
  }

  return absolutePath;
}

const server = http.createServer(async (request, response) => {
  try {
    const filePath = resolveFilePath(request.url || "/");
    const stat = await fs.stat(filePath);

    if (!stat.isFile()) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const fileContents = await fs.readFile(filePath);
    const contentType =
      mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";

    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": contentType
    });
    response.end(fileContents);
  } catch (error) {
    const statusCode = error && /Forbidden/.test(error.message) ? 403 : 404;
    response.writeHead(statusCode, { "content-type": "text/plain; charset=utf-8" });
    response.end(statusCode === 403 ? "Forbidden" : "Not found");
  }
});

server.listen(port, host, () => {
  console.log(`BreezeFill test server listening on http://${host}:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => {
      process.exit(0);
    });
  });
}
