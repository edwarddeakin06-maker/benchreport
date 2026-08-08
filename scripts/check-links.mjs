import { access, readFile } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";

const workspaceRoot = new URL("../", import.meta.url);
const sitemap = await readFile(new URL("../sitemap.xml", import.meta.url), "utf8");
const indexedPages = [...sitemap.matchAll(/<loc>https:\/\/edwarddeakin06-maker\.github\.io\/benchreport\/(.*?)<\/loc>/g)]
  .map((match) => match[1] ? `${match[1]}index.html` : "index.html");
const pages = [...new Set([...indexedPages, "404.html", "buy/index.html", "offline.html"] )];
const failures = [];

for (const page of pages) {
  const html = await readFile(new URL(page, workspaceRoot), "utf8");
  const references = [...html.matchAll(/(?:href|src)=["']([^"']+)["']/g)].map((match) => match[1]);

  for (const reference of references) {
    if (/^(?:https?:|data:|mailto:|#)/i.test(reference)) continue;
    const cleanReference = reference.split(/[?#]/)[0];
    if (!cleanReference) continue;

    let relativeTarget;
    if (cleanReference.startsWith("/benchreport/")) {
      relativeTarget = cleanReference.slice("/benchreport/".length);
    } else {
      relativeTarget = normalize(join(dirname(page), cleanReference));
    }
    if (relativeTarget.endsWith("/") || relativeTarget === "") relativeTarget = join(relativeTarget, "index.html");

    try {
      await access(new URL(relativeTarget.replaceAll("\\", "/"), workspaceRoot));
    } catch {
      failures.push(`${page}: ${reference} -> ${relativeTarget}`);
    }
  }
}

if (failures.length) {
  throw new Error(`Broken local references:\n${failures.join("\n")}`);
}

console.log(`Checked local links and assets across ${pages.length} BenchReport pages.`);
