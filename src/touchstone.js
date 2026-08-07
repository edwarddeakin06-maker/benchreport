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

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.split("!")[0].trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      const options = line.slice(1).trim().toLowerCase().split(/\s+/);
      unit = options.find((item) => item in frequencyScale) || unit;
      parameter = options.find((item) => ["s", "y", "z", "h", "g"].includes(item)) || parameter;
      format = options.find((item) => ["ma", "db", "ri"].includes(item)) || format;
      continue;
    }
    if (line.startsWith("[")) continue;
    numericLines.push(...line.split(/[\s,]+/).map(Number));
  }

  if (parameter !== "s") throw new Error("Only S-parameter Touchstone data is supported.");
  const width = 1 + ports * ports * 2;
  if (numericLines.length < width || numericLines.length % width !== 0 || numericLines.some(Number.isNaN)) {
    throw new Error("The Touchstone numeric data is incomplete or malformed.");
  }

  const points = [];
  for (let offset = 0; offset < numericLines.length; offset += width) {
    const frequencyHz = numericLines[offset] * frequencyScale[unit];
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
  return { filename, ports, format, unit, points };
}

export function evaluateLimit(measurement, parameter, startHz, stopHz, operator, thresholdDb) {
  const selected = measurement.points.filter((point) => point.frequencyHz >= startHz && point.frequencyHz <= stopHz && Number.isFinite(point[parameter]));
  if (!selected.length) return { status: "NO DATA", worst: null, count: 0 };
  const values = selected.map((point) => point[parameter]);
  const worst = operator === "max" ? Math.max(...values) : Math.min(...values);
  const passed = operator === "max" ? worst <= thresholdDb : worst >= thresholdDb;
  return { status: passed ? "PASS" : "FAIL", worst, count: selected.length };
}

export function frequencyLabel(hz) {
  if (Math.abs(hz) >= 1e9) return `${(hz / 1e9).toFixed(3)} GHz`;
  if (Math.abs(hz) >= 1e6) return `${(hz / 1e6).toFixed(3)} MHz`;
  if (Math.abs(hz) >= 1e3) return `${(hz / 1e3).toFixed(3)} kHz`;
  return `${hz.toFixed(0)} Hz`;
}
