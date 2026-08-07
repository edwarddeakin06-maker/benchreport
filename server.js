import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".s1p": "text/plain", ".s2p": "text/plain", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".xml": "application/xml", ".txt": "text/plain" };

createServer(async (req, res) => {
  const requested = decodeURIComponent((req.url || "/").split("?")[0]);
  const relative = requested === "/" ? "index.html" : requested.replace(/^\/+/, "");
  const filePath = normalize(join(root, relative));
  if (!filePath.startsWith(normalize(root))) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const info = await stat(filePath);
    const target = info.isDirectory() ? join(filePath, "index.html") : filePath;
    const body = await readFile(target);
    res.writeHead(200, { "Content-Type": types[extname(target)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(port, () => console.log(`BenchReport: http://localhost:${port}`));
