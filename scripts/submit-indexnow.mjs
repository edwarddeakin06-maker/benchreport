import { readFile } from "node:fs/promises";

const key = "8c400ac253534ed3ae8f372911f18c83";
const siteRoot = "https://edwarddeakin06-maker.github.io/benchreport/";
const sitemap = await readFile(new URL("../sitemap.xml", import.meta.url), "utf8");
const requestedUrls = process.argv.slice(2);
const urlList = requestedUrls.length
  ? requestedUrls
  : [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);

if (!urlList.length || urlList.some((url) => !url.startsWith(siteRoot))) {
  throw new Error("Sitemap contains no URLs or a URL outside the BenchReport site root.");
}

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: "edwarddeakin06-maker.github.io",
    key,
    keyLocation: `${siteRoot}${key}.txt`,
    urlList
  })
});

if (![200, 202].includes(response.status)) {
  throw new Error(`IndexNow rejected the submission with HTTP ${response.status}: ${await response.text()}`);
}

console.log(`IndexNow accepted ${urlList.length} BenchReport URLs (HTTP ${response.status}).`);
