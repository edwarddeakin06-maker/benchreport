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
});
