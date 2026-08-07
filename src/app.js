import { evaluateLimit, frequencyLabel, measurementStatistics, parseTouchstone } from "./touchstone.js";

const palette = ["#36e0a1", "#62a9ff", "#ffb454", "#d68cff", "#ff6b7a", "#82d5e8"];
const defaultRule = () => ({ id: crypto.randomUUID(), name: "Passband insertion loss", parameter: "s21", operator: "min", startMHz: 900, stopMHz: 1100, thresholdDb: -2 });
const state = { measurements: [], rules: [defaultRule()], logoData: "" };
const $ = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);

function decorateMeasurement(parsed, index = state.measurements.length) {
  return { ...parsed, id: crypto.randomUUID(), name: parsed.filename.replace(/\.s\d+p$/i, ""), color: palette[index % palette.length], visible: true, reference: index === 0 };
}

function visibleMeasurements() { return state.measurements.filter((measurement) => measurement.visible); }
function activeParameter() { return state.rules[0]?.parameter || "s21"; }
function ruleSymbol(rule) { return rule.operator === "max" ? "≤" : "≥"; }
function download(name, contents, type) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([contents], { type })); link.download = name; link.style.display = "none"; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 500);
}

async function loadFiles(files) {
  const errors = [];
  for (const file of [...files]) {
    try {
      const parsed = decorateMeasurement(parseTouchstone(await file.text(), file.name));
      if (!state.measurements.some((item) => item.filename === parsed.filename)) state.measurements.push(parsed);
    } catch (error) { errors.push(`${file.name}: ${error.message}`); }
  }
  if (errors.length) alert(errors.join("\n")); render();
}

async function loadSamples() {
  const paths = ["samples/filter-golden.s2p", "samples/filter-unit-017.s2p", "samples/filter-unit-042-fail.s2p"];
  state.measurements = await Promise.all(paths.map(async (path, index) => decorateMeasurement(parseTouchstone(await fetch(path).then((response) => response.text()), path.split("/").pop()), index)));
  state.rules = [
    { ...defaultRule(), name: "Passband insertion loss" },
    { id: crypto.randomUUID(), name: "Input return loss", parameter: "s11", operator: "max", startMHz: 900, stopMHz: 1100, thresholdDb: -8 },
    { id: crypto.randomUUID(), name: "Lower stopband rejection", parameter: "s21", operator: "max", startMHz: 800, stopMHz: 850, thresholdDb: -10 },
  ];
  render();
}

function evaluateAll() {
  return state.rules.flatMap((rule) => visibleMeasurements().map((measurement) => ({
    rule, measurement,
    result: evaluateLimit(measurement, rule.parameter, rule.startMHz * 1e6, rule.stopMHz * 1e6, rule.operator, rule.thresholdDb),
  })));
}

function overallStatus(results) {
  if (!results.length) return "—";
  if (results.some(({ result }) => result.status === "FAIL")) return "FAIL";
  if (results.some(({ result }) => result.status === "NO DATA")) return "REVIEW";
  return "PASS";
}

function drawChart() {
  const canvas = $("chart"); const ctx = canvas.getContext("2d"); const parameter = activeParameter();
  const measurements = visibleMeasurements().filter((measurement) => measurement.points.some((point) => Number.isFinite(point[parameter])));
  const all = measurements.flatMap((measurement) => measurement.points.filter((point) => Number.isFinite(point[parameter])));
  if (!all.length) return;
  const relevantRules = state.rules.filter((rule) => rule.parameter === parameter);
  const minX = Math.min(...all.map((point) => point.frequencyHz)); const maxX = Math.max(...all.map((point) => point.frequencyHz));
  const values = all.map((point) => point[parameter]).concat(relevantRules.map((rule) => rule.thresholdDb));
  let minY = Math.floor(Math.min(...values) / 5) * 5 - 2; let maxY = Math.ceil(Math.max(...values) / 5) * 5 + 2;
  if (minY === maxY) { minY -= 5; maxY += 5; }
  const box = { left: 78, top: 35, right: canvas.width - 28, bottom: canvas.height - 65 };
  const x = (value) => box.left + ((value - minX) / Math.max(maxX - minX, 1)) * (box.right - box.left);
  const y = (value) => box.bottom - ((value - minY) / (maxY - minY)) * (box.bottom - box.top);
  ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = "#0d151d"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = "12px system-ui"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
  for (let i = 0; i <= 6; i++) { const value = minY + ((maxY - minY) * i) / 6; const py = y(value); ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.beginPath(); ctx.moveTo(box.left, py); ctx.lineTo(box.right, py); ctx.stroke(); ctx.fillStyle = "#7e8c98"; ctx.fillText(`${value.toFixed(1)} dB`, box.left - 12, py); }
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  for (let i = 0; i <= 5; i++) { const value = minX + ((maxX - minX) * i) / 5; const px = x(value); ctx.strokeStyle = "rgba(255,255,255,.06)"; ctx.beginPath(); ctx.moveTo(px, box.top); ctx.lineTo(px, box.bottom); ctx.stroke(); ctx.fillStyle = "#7e8c98"; ctx.fillText(frequencyLabel(value), px, box.bottom + 15); }
  relevantRules.forEach((rule, index) => {
    const bandLeft = x(Math.max(minX, rule.startMHz * 1e6)); const bandRight = x(Math.min(maxX, rule.stopMHz * 1e6));
    ctx.fillStyle = index % 2 ? "rgba(98,169,255,.035)" : "rgba(255,180,84,.045)"; ctx.fillRect(bandLeft, box.top, Math.max(0, bandRight - bandLeft), box.bottom - box.top);
    ctx.setLineDash([8, 6]); ctx.strokeStyle = index % 2 ? "#62a9ff" : "#ffb454"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bandLeft, y(rule.thresholdDb)); ctx.lineTo(bandRight, y(rule.thresholdDb)); ctx.stroke(); ctx.setLineDash([]);
  });
  measurements.forEach((measurement) => { ctx.strokeStyle = measurement.color; ctx.lineWidth = measurement.reference ? 3.5 : 2.2; ctx.beginPath(); measurement.points.forEach((point, index) => { const px = x(point.frequencyHz); const py = y(point[parameter]); index ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.stroke(); });
  ctx.fillStyle = "#aab6bf"; ctx.font = "13px system-ui"; ctx.textAlign = "center"; ctx.fillText("Frequency", (box.left + box.right) / 2, canvas.height - 18);
  ctx.save(); ctx.translate(18, (box.top + box.bottom) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(`${parameter.toUpperCase()} magnitude (dB)`, 0, 0); ctx.restore();
}

function renderMeasurements() {
  $("fileList").innerHTML = state.measurements.map((measurement) => `<div class="file-item measurement-item" data-id="${measurement.id}">
    <input class="trace-visible" type="checkbox" ${measurement.visible ? "checked" : ""} title="Show trace" />
    <input class="trace-color" type="color" value="${measurement.color}" title="Trace colour" />
    <div class="trace-name-wrap"><input class="trace-name" value="${escapeHtml(measurement.name)}" /><small>${escapeHtml(measurement.filename)} · ${measurement.points.length} points</small></div>
    <label class="reference-control" title="Golden/reference measurement"><input class="trace-reference" name="reference" type="radio" ${measurement.reference ? "checked" : ""} /> Ref</label>
    <button class="trace-remove" title="Remove">×</button></div>`).join("");
  document.querySelectorAll(".measurement-item").forEach((row) => {
    const measurement = state.measurements.find((item) => item.id === row.dataset.id);
    row.querySelector(".trace-visible").onchange = (event) => { measurement.visible = event.target.checked; render(); };
    row.querySelector(".trace-color").oninput = (event) => { measurement.color = event.target.value; render(); };
    row.querySelector(".trace-name").onchange = (event) => { measurement.name = event.target.value.trim() || measurement.filename; render(); };
    row.querySelector(".trace-reference").onchange = () => { state.measurements.forEach((item) => item.reference = item.id === measurement.id); render(); };
    row.querySelector(".trace-remove").onclick = () => { state.measurements = state.measurements.filter((item) => item.id !== measurement.id); if (state.measurements.length && !state.measurements.some((item) => item.reference)) state.measurements[0].reference = true; render(); };
  });
}

function renderRules() {
  $("ruleList").innerHTML = state.rules.map((rule, index) => `<div class="rule-card" data-id="${rule.id}">
    <div class="rule-card-head"><span>Rule ${index + 1}</span><button class="rule-remove" ${state.rules.length === 1 ? "disabled" : ""}>×</button></div>
    <label>Name<input data-key="name" value="${escapeHtml(rule.name)}" /></label>
    <div class="rule-fields"><label>Trace<select data-key="parameter">${["s11","s21","s12","s22"].map((value) => `<option value="${value}" ${value === rule.parameter ? "selected" : ""}>${value.toUpperCase()}</option>`).join("")}</select></label>
    <label>Rule<select data-key="operator"><option value="min" ${rule.operator === "min" ? "selected" : ""}>At least</option><option value="max" ${rule.operator === "max" ? "selected" : ""}>At most</option></select></label>
    <label>Start MHz<input data-key="startMHz" type="number" value="${rule.startMHz}" /></label><label>Stop MHz<input data-key="stopMHz" type="number" value="${rule.stopMHz}" /></label>
    <label class="full">Threshold dB<input data-key="thresholdDb" type="number" step="0.1" value="${rule.thresholdDb}" /></label></div></div>`).join("");
  document.querySelectorAll(".rule-card").forEach((card) => {
    const rule = state.rules.find((item) => item.id === card.dataset.id);
    card.querySelectorAll("[data-key]").forEach((control) => control.onchange = (event) => { const key = event.target.dataset.key; rule[key] = ["startMHz","stopMHz","thresholdDb"].includes(key) ? Number(event.target.value) : event.target.value; render(); });
    card.querySelector(".rule-remove").onclick = () => { state.rules = state.rules.filter((item) => item.id !== rule.id); render(); };
  });
}

function renderTemplates() {
  const templates = JSON.parse(localStorage.getItem("benchreport.templates") || "{}"); const current = $("templateSelect").value;
  $("templateSelect").innerHTML = `<option value="">Current rules</option>${Object.keys(templates).sort().map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("")}`;
  if (templates[current]) $("templateSelect").value = current;
}

function renderResults(results, status) {
  const parameter = activeParameter();
  $("chartTitle").textContent = `${parameter.toUpperCase()} comparison`; $("overallStatus").textContent = status; $("overallStatus").className = `status ${status.toLowerCase()}`;
  $("resultCards").innerHTML = visibleMeasurements().map((measurement) => {
    const ownResults = results.filter((item) => item.measurement.id === measurement.id); const ownStatus = overallStatus(ownResults); const stats = measurementStatistics(measurement, parameter);
    return `<article><div><i style="background:${measurement.color}"></i><strong>${escapeHtml(measurement.name)}${measurement.reference ? " · reference" : ""}</strong></div><span class="mini-status ${ownStatus.toLowerCase()}">${ownStatus}</span><p>${parameter.toUpperCase()} peak: <b>${stats ? `${stats.maximumDb.toFixed(2)} dB` : "—"}</b></p></article>`;
  }).join("");
  $("ruleCount").textContent = `${state.rules.length} rules · ${visibleMeasurements().length} measurements`;
  $("ruleResultRows").innerHTML = results.map(({ rule, measurement, result }) => `<tr><td>${escapeHtml(rule.name)}</td><td>${escapeHtml(measurement.name)}</td><td>${result.worst === null ? "—" : `${result.worst.toFixed(2)} dB`}</td><td>${result.worstFrequencyHz === null ? "—" : frequencyLabel(result.worstFrequencyHz)}</td><td><b class="table-status ${result.status.toLowerCase().replace(" ", "-")}">${result.status}</b></td></tr>`).join("");
  $("statisticsCards").innerHTML = visibleMeasurements().map((measurement) => { const stats = measurementStatistics(measurement, parameter); if (!stats) return ""; return `<article><div class="stats-title"><i style="background:${measurement.color}"></i><strong>${escapeHtml(measurement.name)}</strong></div><dl><div><dt>Minimum</dt><dd>${stats.minimumDb.toFixed(2)} dB<br><small>${frequencyLabel(stats.minimumFrequencyHz)}</small></dd></div><div><dt>Maximum</dt><dd>${stats.maximumDb.toFixed(2)} dB<br><small>${frequencyLabel(stats.maximumFrequencyHz)}</small></dd></div><div><dt>3 dB bandwidth</dt><dd>${frequencyLabel(stats.bandwidth3dBHz)}</dd></div><div><dt>Centre</dt><dd>${frequencyLabel(stats.centreFrequencyHz)}</dd></div><div><dt>Peak IL</dt><dd>${stats.peakInsertionLossDb === null ? "N/A" : `${stats.peakInsertionLossDb.toFixed(2)} dB`}</dd></div></dl></article>`; }).join("");
}

function renderReport(results, status) {
  const parameter = activeParameter();
  $("reportTitleOut").textContent = $("reportTitle").value || "RF Measurement Report"; $("dutOut").textContent = $("dut").value || "—"; $("projectOut").textContent = $("projectName").value || "—"; $("reportIdOut").textContent = $("reportId").value || "—"; $("engineerOut").textContent = $("engineer").value || "—";
  $("companyOut").textContent = $("company").value || "BenchReport measurement record"; $("dateOut").textContent = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date()); $("notesOut").textContent = $("notes").value || "No notes supplied.";
  $("reportStatus").textContent = status; $("reportStatus").className = `report-status ${status.toLowerCase()}`; $("reportChart").src = $("chart").toDataURL("image/png");
  $("reportLogo").hidden = !state.logoData; if (state.logoData) $("reportLogo").src = state.logoData;
  $("reportRows").innerHTML = results.map(({ rule, measurement, result }) => `<tr><td>${escapeHtml(rule.name)}</td><td>${escapeHtml(measurement.name)}</td><td>${frequencyLabel(rule.startMHz * 1e6)} – ${frequencyLabel(rule.stopMHz * 1e6)}</td><td>${rule.parameter.toUpperCase()} ${ruleSymbol(rule)} ${rule.thresholdDb.toFixed(1)} dB</td><td>${result.worst === null ? "—" : `${result.worst.toFixed(2)} dB / ${frequencyLabel(result.worstFrequencyHz)}`}</td><td><b class="table-status ${result.status.toLowerCase().replace(" ", "-")}">${result.status}</b></td></tr>`).join("");
  $("reportStatistics").innerHTML = visibleMeasurements().map((measurement) => { const stats = measurementStatistics(measurement, parameter); return stats ? `<tr><td>${escapeHtml(measurement.name)} (${parameter.toUpperCase()})</td><td>${stats.minimumDb.toFixed(2)} dB @ ${frequencyLabel(stats.minimumFrequencyHz)}</td><td>${stats.maximumDb.toFixed(2)} dB @ ${frequencyLabel(stats.maximumFrequencyHz)}</td><td>${frequencyLabel(stats.bandwidth3dBHz)}</td><td>${frequencyLabel(stats.centreFrequencyHz)}</td><td>${stats.peakInsertionLossDb === null ? "N/A" : `${stats.peakInsertionLossDb.toFixed(2)} dB`}</td></tr>` : ""; }).join("");
}

function render() {
  $("fileCount").textContent = state.measurements.length; $("emptyState").hidden = state.measurements.length > 0; $("analysis").hidden = !state.measurements.length;
  renderMeasurements(); renderRules(); renderTemplates(); if (!state.measurements.length) return;
  const results = evaluateAll(); const status = overallStatus(results); drawChart(); renderResults(results, status); renderReport(results, status);
}

function projectData() {
  const fields = Object.fromEntries(["reportTitle","dut","engineer","projectName","reportId","company","notes"].map((id) => [id, $(id).value]));
  return { format: "benchreport-project", version: 1, savedAt: new Date().toISOString(), measurements: state.measurements, rules: state.rules, logoData: state.logoData, fields };
}

async function openProject(file) {
  try {
    const project = JSON.parse(await file.text()); if (project.format !== "benchreport-project" || !Array.isArray(project.measurements) || !Array.isArray(project.rules)) throw new Error("Not a BenchReport project file.");
    state.measurements = project.measurements; state.rules = project.rules; state.logoData = project.logoData || "";
    Object.entries(project.fields || {}).forEach(([id, value]) => { if ($(id)) $(id).value = value; }); render(); $("projectMessage").textContent = `Opened ${file.name}`;
  } catch (error) { alert(`Could not open project: ${error.message}`); }
}

$("fileInput").addEventListener("change", (event) => loadFiles(event.target.files));
$("dropZone").addEventListener("dragover", (event) => { event.preventDefault(); $("dropZone").classList.add("dragging"); });
$("dropZone").addEventListener("dragleave", () => $("dropZone").classList.remove("dragging"));
$("dropZone").addEventListener("drop", (event) => { event.preventDefault(); $("dropZone").classList.remove("dragging"); loadFiles(event.dataTransfer.files); });
$("loadSamples").addEventListener("click", loadSamples);
$("addRule").addEventListener("click", () => { state.rules.push({ ...defaultRule(), name: `Acceptance rule ${state.rules.length + 1}` }); render(); });
$("saveProject").addEventListener("click", () => { const filename = `${($("dut").value || "benchreport-project").replace(/[^a-z0-9_-]+/gi, "-")}.brp`; download(filename, JSON.stringify(projectData(), null, 2), "application/json"); $("projectMessage").textContent = `Saved ${filename}`; });
$("openProject").addEventListener("click", () => $("projectInput").click()); $("projectInput").addEventListener("change", (event) => event.target.files[0] && openProject(event.target.files[0]));
$("printReport").addEventListener("click", () => { render(); window.print(); });
$("logoInput").addEventListener("change", (event) => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { state.logoData = reader.result; render(); }; reader.readAsDataURL(file); });
$("saveTemplate").addEventListener("click", () => { const name = $("templateName").value.trim(); if (!name) { $("projectMessage").textContent = "Enter a template name first."; return; } const templates = JSON.parse(localStorage.getItem("benchreport.templates") || "{}"); templates[name] = state.rules.map((rule) => ({ ...rule, id: crypto.randomUUID() })); localStorage.setItem("benchreport.templates", JSON.stringify(templates)); render(); $("templateSelect").value = name; $("templateName").value = ""; $("projectMessage").textContent = `Saved template: ${name}`; });
$("deleteTemplate").addEventListener("click", () => { const name = $("templateSelect").value; if (!name) return; const templates = JSON.parse(localStorage.getItem("benchreport.templates") || "{}"); delete templates[name]; localStorage.setItem("benchreport.templates", JSON.stringify(templates)); render(); });
$("templateSelect").addEventListener("change", (event) => { const templates = JSON.parse(localStorage.getItem("benchreport.templates") || "{}"); if (templates[event.target.value]) { state.rules = templates[event.target.value].map((rule) => ({ ...rule, id: crypto.randomUUID() })); render(); $("templateSelect").value = event.target.value; } });
["reportTitle","dut","engineer","projectName","reportId","company","notes"].forEach((id) => $(id).addEventListener("input", render));

render();
