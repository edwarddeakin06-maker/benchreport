const { app, BrowserWindow, shell } = require("electron");
const { createServer } = require("node:http");
const { readFile, stat } = require("node:fs/promises");
const { extname, join, normalize } = require("node:path");

const types = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".s1p":"text/plain", ".s2p":"text/plain", ".svg":"image/svg+xml", ".webmanifest":"application/manifest+json", ".xml":"application/xml", ".txt":"text/plain" };
let localServer;

function startLocalServer() {
  const root = app.getAppPath();
  localServer = createServer(async (request, response) => {
    const requested = decodeURIComponent((request.url || "/").split("?")[0]);
    const relative = requested === "/" ? "index.html" : requested.replace(/^\/+/, "");
    const filePath = normalize(join(root, relative));
    if (!filePath.startsWith(normalize(root))) { response.writeHead(403).end("Forbidden"); return; }
    try {
      const info = await stat(filePath); const target = info.isDirectory() ? join(filePath, "index.html") : filePath;
      response.writeHead(200, { "Content-Type": types[extname(target)] || "application/octet-stream", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }); response.end(await readFile(target));
    } catch { response.writeHead(404).end("Not found"); }
  });
  return new Promise((resolve) => localServer.listen(0, "127.0.0.1", () => resolve(localServer.address().port)));
}

async function createWindow() {
  const port = await startLocalServer();
  const smokeTest = process.env.BENCHREPORT_SMOKE_TEST === "1";
  const window = new BrowserWindow({ show: !smokeTest, width: 1480, height: 960, minWidth: 1040, minHeight: 700, backgroundColor: "#071016", title: "BenchReport Pro", webPreferences: { preload: join(__dirname, "preload.cjs"), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  window.removeMenu();
  window.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: "deny" }; });
  window.webContents.on("will-navigate", (event, url) => { if (!url.startsWith(`http://127.0.0.1:${port}/`)) { event.preventDefault(); shell.openExternal(url); } });
  await window.loadURL(`http://127.0.0.1:${port}/`);
  if (smokeTest) {
    const result = await window.webContents.executeJavaScript(`({ edition: window.benchReportDesktop?.edition, bodyClass: document.body.className, addRuleVisible: getComputedStyle(document.getElementById("addRule")).display !== "none" })`);
    console.log(JSON.stringify(result)); app.quit();
  }
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (localServer) localServer.close(); if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
