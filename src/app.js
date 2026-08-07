import { evaluateLimit, frequencyLabel, parseTouchstone } from "./touchstone.js";

const colors = ["#36e0a1", "#62a9ff", "#ffb454", "#d68cff", "#ff6b7a", "#82d5e8"];
const state = { measurements: [] };
const $ = (id) => document.getElementById(id);

const controls = ["parameter", "operator", "startMHz", "stopMHz", "threshold", "reportTitle", "dut", "engineer", "notes"];
controls.forEach((id) => $(id).addEventListener("input", render));

$("fileInput").addEventListener("change", (event) => loadFiles(event.target.files));
$("dropZone").addEventListener("dragover", (event) => { event.preventDefault(); $("dropZone").classList.add("dragging"); });
$("dropZone").addEventListener("dragleave", () => $("dropZone").classList.remove("dragging"));
$("dropZone").addEventListener("drop", (event) => { event.preventDefault(); $("dropZone").classList.remove("dragging"); loadFiles(event.dataTransfer.files); });
$("loadSamples").addEventListener("click", loadSamples);
$("printReport").addEventListener("click", () => { render(); window.print(); });

async function loadFiles(files) {
  const errors = [];
  for (const file of [...files]) {
    try {
      const parsed = parseTouchstone(await file.text(), file.name);
      if (!state.measurements.some((item) => item.filename === parsed.filename)) state.measurements.push(parsed);
    } catch (error) { errors.push(`${file.name}: ${error.message}`); }
  }
  if (errors.length) alert(errors.join("\n"));
  render();
}

async function loadSamples() {
  const paths = ["samples/filter-golden.s2p", "samples/filter-unit-017.s2p", "samples/filter-unit-042-fail.s2p"];
  state.measurements = await Promise.all(paths.map(async (path) => parseTouchstone(await fetch(path).then((response) => response.text()), path.split("/").pop())));
  render();
}

function settings() {
  return {
    parameter: $("parameter").value.toLowerCase(), operator: $("operator").value,
    startHz: Number($("startMHz").value) * 1e6, stopHz: Number($("stopMHz").value) * 1e6,
    threshold: Number($("threshold").value),
  };
}

function drawChart() {
  const canvas = $("chart");
  const ctx = canvas.getContext("2d");
  const { parameter, startHz, stopHz, threshold, operator } = settings();
  const all = state.measurements.flatMap((m) => m.points.filter((p) => Number.isFinite(p[parameter])));
  if (!all.length) return;
  const minX = Math.min(...all.map((p) => p.frequencyHz));
  const maxX = Math.max(...all.map((p) => p.frequencyHz));
  const values = all.map((p) => p[parameter]).concat(threshold);
  let minY = Math.floor(Math.min(...values) / 5) * 5 - 2;
  let maxY = Math.ceil(Math.max(...values) / 5) * 5 + 2;
  if (minY === maxY) { minY -= 5; maxY += 5; }
  const box = { left: 78, top: 35, right: canvas.width - 28, bottom: canvas.height - 65 };
  const x = (value) => box.left + ((value - minX) / Math.max(maxX - minX, 1)) * (box.right - box.left);
  const y = (value) => box.bottom - ((value - minY) / (maxY - minY)) * (box.bottom - box.top);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0d151d"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = "12px system-ui"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
  for (let i = 0; i <= 6; i++) {
    const value = minY + ((maxY - minY) * i) / 6; const py = y(value);
    ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.beginPath(); ctx.moveTo(box.left, py); ctx.lineTo(box.right, py); ctx.stroke();
    ctx.fillStyle = "#7e8c98"; ctx.fillText(`${value.toFixed(1)} dB`, box.left - 12, py);
  }
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  for (let i = 0; i <= 5; i++) {
    const value = minX + ((maxX - minX) * i) / 5; const px = x(value);
    ctx.strokeStyle = "rgba(255,255,255,.06)"; ctx.beginPath(); ctx.moveTo(px, box.top); ctx.lineTo(px, box.bottom); ctx.stroke();
    ctx.fillStyle = "#7e8c98"; ctx.fillText(frequencyLabel(value), px, box.bottom + 15);
  }
  const bandLeft = x(Math.max(minX, startHz)); const bandRight = x(Math.min(maxX, stopHz));
  ctx.fillStyle = "rgba(255,180,84,.07)"; ctx.fillRect(bandLeft, box.top, Math.max(0, bandRight - bandLeft), box.bottom - box.top);
  ctx.setLineDash([8, 6]); ctx.strokeStyle = operator === "max" ? "#ffb454" : "#d68cff"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(bandLeft, y(threshold)); ctx.lineTo(bandRight, y(threshold)); ctx.stroke(); ctx.setLineDash([]);
  state.measurements.forEach((measurement, index) => {
    ctx.strokeStyle = colors[index % colors.length]; ctx.lineWidth = 2.5; ctx.beginPath();
    measurement.points.forEach((point, pointIndex) => { const px = x(point.frequencyHz); const py = y(point[parameter]); pointIndex ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.stroke();
  });
  ctx.fillStyle = "#aab6bf"; ctx.font = "13px system-ui"; ctx.textAlign = "center"; ctx.fillText("Frequency", (box.left + box.right) / 2, canvas.height - 18);
  ctx.save(); ctx.translate(18, (box.top + box.bottom) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(`${parameter.toUpperCase()} magnitude (dB)`, 0, 0); ctx.restore();
}

function render() {
  const config = settings();
  const results = state.measurements.map((measurement) => ({ measurement, result: evaluateLimit(measurement, config.parameter, config.startHz, config.stopHz, config.operator, config.threshold) }));
  const status = !results.length ? "—" : results.some(({ result }) => result.status === "FAIL") ? "FAIL" : results.some(({ result }) => result.status === "NO DATA") ? "REVIEW" : "PASS";
  $("fileCount").textContent = state.measurements.length;
  $("emptyState").hidden = state.measurements.length > 0; $("analysis").hidden = !state.measurements.length;
  $("fileList").innerHTML = state.measurements.map((m, i) => `<div class="file-item"><i style="background:${colors[i % colors.length]}"></i><span>${m.filename}<small>${m.ports}-port · ${m.points.length} points</small></span><button data-remove="${i}" title="Remove">×</button></div>`).join("");
  document.querySelectorAll("[data-remove]").forEach((button) => button.onclick = () => { state.measurements.splice(Number(button.dataset.remove), 1); render(); });
  if (!state.measurements.length) return;
  $("chartTitle").textContent = `${config.parameter.toUpperCase()} comparison`;
  $("overallStatus").textContent = status; $("overallStatus").className = `status ${status.toLowerCase()}`;
  $("resultCards").innerHTML = results.map(({ measurement, result }, i) => `<article><div><i style="background:${colors[i % colors.length]}"></i><strong>${measurement.filename}</strong></div><span class="mini-status ${result.status.toLowerCase().replace(" ", "-")}">${result.status}</span><p>Worst: <b>${result.worst === null ? "—" : `${result.worst.toFixed(2)} dB`}</b></p></article>`).join("");
  const ruleWord = config.operator === "max" ? "≤" : "≥";
  $("ruleSummary").textContent = `${config.parameter.toUpperCase()} ${ruleWord} ${config.threshold.toFixed(1)} dB`;
  $("bandSummary").textContent = `${frequencyLabel(config.startHz)} – ${frequencyLabel(config.stopHz)}`;
  drawChart();

  $("reportTitleOut").textContent = $("reportTitle").value || "RF Measurement Report"; $("dutOut").textContent = $("dut").value || "—"; $("engineerOut").textContent = $("engineer").value || "—";
  $("dateOut").textContent = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date());
  $("notesOut").textContent = $("notes").value || "No notes supplied."; $("reportStatus").textContent = status; $("reportStatus").className = `report-status ${status.toLowerCase()}`;
  $("reportChart").src = $("chart").toDataURL("image/png");
  $("reportRows").innerHTML = results.map(({ measurement, result }) => `<tr><td>${measurement.filename}</td><td>${config.parameter.toUpperCase()}</td><td>${frequencyLabel(config.startHz)} – ${frequencyLabel(config.stopHz)}</td><td>${ruleWord} ${config.threshold.toFixed(1)} dB</td><td>${result.worst === null ? "—" : `${result.worst.toFixed(2)} dB`}</td><td><b class="table-status ${result.status.toLowerCase().replace(" ", "-")}">${result.status}</b></td></tr>`).join("");
}

render();
