import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("Pro page exposes a complete and consistent purchase path", async () => {
  const html = await read("pro/index.html");
  assert.match(html, /https:\/\/deakinator80\.gumroad\.com\/l\/benchreport-pro/);
  assert.match(html, /Buy BenchReport Pro — £29/);
  assert.match(html, /Try the free workflow/);
  assert.match(html, /30-day money-back guarantee/);
  assert.match(html, /not code-signed/);
  assert.match(html, /BF47ADFB5369149F72965E9CB2424CE20888D733F7261D4CE0CEB6640FE179C7/);
  assert.match(html, /benchreport-workflow\.png/);
  assert.equal((html.match(/href="\.\.\/buy\/"/g) || []).length, 2);
  assert.match(html, /Ready to stop rebuilding the report\?/);
});

test("Checkout handoff records purchase intent before opening Gumroad", async () => {
  const html = await read("buy/index.html");
  assert.match(html, /static\.cloudflareinsights\.com\/beacon\.min\.js/);
  assert.match(html, /https:\/\/deakinator80\.gumroad\.com\/l\/benchreport-pro\?utm_source=benchreport&amp;utm_medium=website&amp;utm_campaign=pro/);
  assert.match(html, /window\.setTimeout/);
  assert.match(html, /Continue to Gumroad/);
  assert.match(html, /noindex,nofollow/);
});

test("Support page publishes licence, update, refund and integrity terms", async () => {
  const html = await read("support/index.html");
  assert.match(html, /one individual user/);
  assert.match(html, /0\.x release series/);
  assert.match(html, /30-day money-back guarantee/);
  assert.match(html, /99,677,579 bytes/);
  assert.doesNotMatch(html, /edwarddeakin06@gmail\.com/i);
});

test("Free edition links users to the priced Pro comparison", async () => {
  const html = await read("index.html");
  assert.match(html, /one-time £29 Windows licence/);
  assert.match(html, /href="pro\/"/);
  assert.match(html, /href="support\/"/);
  assert.match(html, /Save the project, reuse the limits, send your own report/);
  assert.doesNotMatch(html, /BenchReport prototype/);
});

test("Free edition offers a self-contained guided demo", async () => {
  const [html, app] = await Promise.all([read("index.html"), read("src/app.js")]);
  assert.match(html, /id="startDemo"/);
  assert.match(html, /60-second guided demo/);
  assert.match(html, /id="demoCoach"/);
  assert.match(app, /await loadSamples\(\)/);
  assert.match(app, /One unit fails the passband limit/);
  assert.match(app, /window\.location\.href = "pro\/"/);
});

test("Landing page explains S-parameters in plain English", async () => {
  const html = await read("index.html");
  assert.match(html, /New to S-parameters\?/);
  assert.match(html, /transmitted through or reflected by a component at different frequencies/);
});

test("Indexed search pages include privacy-friendly analytics", async () => {
  const sitemap = await read("sitemap.xml");
  const paths = [...sitemap.matchAll(/benchreport\/(.*?)<\/loc>/g)]
    .map((match) => match[1])
    .map((path) => path ? `${path}index.html` : "index.html");
  for (const path of paths) {
    const html = await read(path);
    assert.match(html, /static\.cloudflareinsights\.com\/beacon\.min\.js/, `${path} should be measurable`);
  }
});

test("Touchstone viewer page is a complete search landing page", async () => {
  const html = await read("tools/touchstone-viewer/index.html");
  assert.match(html, /"@type": "WebApplication"/);
  assert.match(html, /"@type": "FAQPage"/);
  assert.match(html, /What the free Touchstone viewer does/);
  assert.match(html, /How to inspect an S1P or S2P file/);
  assert.match(html, /href="\.\.\/\.\.\/pro\/"/);
});

test("VNA report page documents a complete and accurate workflow", async () => {
  const html = await read("tools/vna-report-generator/index.html");
  assert.match(html, /"@type":"HowTo"/);
  assert.match(html, /"@type":"FAQPage"/);
  assert.match(html, /From VNA export to PDF/);
  assert.match(html, /−2\.35 dB at 1\.10 GHz/);
  assert.match(html, /does not perform VNA calibration/);
  assert.match(html, /href="\.\.\/\.\.\/pro\/"/);
});

test("Sitemap publishes valid modification dates", async () => {
  const sitemap = await read("sitemap.xml");
  assert.equal((sitemap.match(/<url>/g) || []).length, (sitemap.match(/<lastmod>2026-08-08<\/lastmod>/g) || []).length);
});

test("S2P comparison guide provides a useful search workflow", async () => {
  const html = await read("tools/compare-s2p-files/index.html");
  assert.match(html, /How to compare S2P files and identify failed RF limits/);
  assert.match(html, /"@type": "HowTo"/);
  assert.match(html, /Worst S21/);
  assert.match(html, /−2\.35 dB/);
  assert.match(html, /href="\.\.\/\.\.\/#startDemo"/);
  assert.match(html, /does not replace a calibrated instrument/);
});
