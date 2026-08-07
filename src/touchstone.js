const frequencyScale = { hz: 1, khz: 1e3, mhz: 1e6, ghz: 1e9 };

function toComplex(a, b, format) {
  if (format === "ri") return { re: a, im: b };
  const magnitude = format === "db" ? 10 ** (a / 20) : a;
  const radians = (b * Math.PI) / 180;
  return { re: magnitude * Math.cos(radians), im: magnitude * Math.sin(radians) };
}

function db(complex) {
  const magnitude = Math.hypot(complex.re, complex.im);
  return 20 * Math.log10(Math.max(magnitude, 1e-15));
}

export function parseTouchstone(text, filename = "measurement.s2p") {
  const match = filename.toLowerCase().match(/\.s(\d+)p$/);
  if (!match) throw new Error("Use a Touchstone file ending in .s1p or .s2p.");
  const ports = Number(match[1]);
  if (![1, 2].includes(ports)) throw new Error("This prototype supports one-port and two-port Touchstone files.");

  let unit = "ghz";
  let format = "ma";
  let parameter = "s";
  const numericLines = [];
  const warnings = [];
  let optionLineSeen = false;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.split("!")[0].trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      const options = line.slice(1).trim().toLowerCase().split(/\s+/);
      optionLineSeen = true;
      if (!options.some((item) => item in frequencyScale)) throw new Error("The Touchstone option line has an unsupported or missing frequency unit.");
      if (!options.some((item) => ["ma", "db", "ri"].includes(item))) throw new Error("The Touchstone option line must specify DB, MA, or RI data.");
      unit = options.find((item) => item in frequencyScale) || unit;
      parameter = options.find((item) => ["s", "y", "z", "h", "g"].includes(item)) || parameter;
      format = options.find((item) => ["ma", "db", "ri"].includes(item)) || format;
      continue;
    }
    if (line.startsWith("[")) continue;
    numericLines.push(...line.split(/[\s,]+/).map(Number));
  }

  if (parameter !== "s") throw new Error("Only S-parameter Touchstone data is supported.");
  if (!optionLineSeen) warnings.push("No option line was present; GHz S MA R 50 defaults were applied.");
  const width = 1 + ports * ports * 2;
  if (numericLines.length < width || numericLines.length % width !== 0 || numericLines.some(Number.isNaN)) {
    throw new Error("The Touchstone numeric data is incomplete or malformed.");
  }

  const points = [];
  for (let offset = 0; offset < numericLines.length; offset += width) {
    const frequencyHz = numericLines[offset] * frequencyScale[unit];
    if (!Number.isFinite(frequencyHz) || frequencyHz < 0) throw new Error("Every frequency must be a finite, non-negative number.");
    const values = numericLines.slice(offset + 1, offset + width);
    const point = { frequencyHz };
    if (ports === 1) {
      point.s11 = db(toComplex(values[0], values[1], format));
    } else {
      // Touchstone two-port order is S11, S21, S12, S22.
      ["s11", "s21", "s12", "s22"].forEach((name, index) => {
        point[name] = db(toComplex(values[index * 2], values[index * 2 + 1], format));
      });
    }
    points.push(point);
  }

  points.sort((a, b) => a.frequencyHz - b.frequencyHz);
  const uniquePoints = [];
  for (const point of points) {
    if (uniquePoints.at(-1)?.frequencyHz === point.frequencyHz) {
      uniquePoints[uniquePoints.length - 1] = point;
      if (!warnings.includes("Duplicate frequency rows were found; the last row at each frequency was kept.")) warnings.push("Duplicate frequency rows were found; the last row at each frequency was kept.");
    } else uniquePoints.push(point);
  }
  return { filename, ports, format, unit, points: uniquePoints, warnings };
}

export function evaluateLimit(measurement, parameter, startHz, stopHz, operator, thresholdDb) {
  if (!Number.isFinite(startHz) || !Number.isFinite(stopHz) || startHz > stopHz) return { status: "INVALID RULE", worst: null, worstFrequencyHz: null, count: 0 };
  if (!Number.isFinite(thresholdDb) || !["min", "max"].includes(operator)) return { status: "INVALID RULE", worst: null, worstFrequencyHz: null, count: 0 };
  const selected = measurement.points.filter((point) => point.frequencyHz >= startHz && point.frequencyHz <= stopHz && Number.isFinite(point[parameter]));
  if (!selected.length) return { status: "NO DATA", worst: null, worstFrequencyHz: null, count: 0 };
  const worstPoint = selected.reduce((worst, point) => operator === "max"
    ? (point[parameter] > worst[parameter] ? point : worst)
    : (point[parameter] < worst[parameter] ? point : worst));
  const worst = worstPoint[parameter];
  const passed = operator === "max" ? worst <= thresholdDb : worst >= thresholdDb;
  return { status: passed ? "PASS" : "FAIL", worst, worstFrequencyHz: worstPoint.frequencyHz, count: selected.length };
}

export function measurementStatistics(measurement, parameter) {
  const points = measurement.points.filter((point) => Number.isFinite(point[parameter]));
  if (!points.length) return null;
  const minimum = points.reduce((best, point) => point[parameter] < best[parameter] ? point : best);
  const maximum = points.reduce((best, point) => point[parameter] > best[parameter] ? point : best);
  const peak = maximum[parameter];
  const cutoff = peak - 3;
  const inBand = points.filter((point) => point[parameter] >= cutoff);
  const lowHz = inBand.length ? inBand[0].frequencyHz : null;
  const highHz = inBand.length ? inBand[inBand.length - 1].frequencyHz : null;
  return {
    minimumDb: minimum[parameter], minimumFrequencyHz: minimum.frequencyHz,
    maximumDb: maximum[parameter], maximumFrequencyHz: maximum.frequencyHz,
    bandwidth3dBHz: lowHz === null ? null : highHz - lowHz,
    centreFrequencyHz: lowHz === null ? null : (lowHz + highHz) / 2,
    peakInsertionLossDb: parameter === "s21" ? Math.abs(Math.min(0, peak)) : null,
  };
}

export function frequencyLabel(hz) {
  if (Math.abs(hz) >= 1e9) return `${(hz / 1e9).toFixed(3)} GHz`;
  if (Math.abs(hz) >= 1e6) return `${(hz / 1e6).toFixed(3)} MHz`;
  if (Math.abs(hz) >= 1e3) return `${(hz / 1e3).toFixed(3)} kHz`;
  return `${hz.toFixed(0)} Hz`;
}
