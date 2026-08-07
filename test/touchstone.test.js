import test from "node:test";
import assert from "node:assert/strict";
import { evaluateLimit, measurementStatistics, parseTouchstone } from "../src/touchstone.js";

test("parses two-port DB data in Touchstone order", () => {
  const result = parseTouchstone("# MHz S DB R 50\n100 -10 0 -1 0 -30 0 -12 0\n", "filter.s2p");
  assert.equal(result.ports, 2);
  assert.equal(result.points[0].frequencyHz, 100e6);
  assert.equal(Math.round(result.points[0].s21), -1);
  assert.equal(Math.round(result.points[0].s12), -30);
});

test("converts magnitude-angle values to dB", () => {
  const result = parseTouchstone("# GHz S MA R 50\n1 0.1 45\n", "antenna.s1p");
  assert.ok(Math.abs(result.points[0].s11 + 20) < 1e-9);
});

test("evaluates maximum and minimum limits", () => {
  const measurement = parseTouchstone("# MHz S DB R 50\n100 -12 0\n200 -9 0\n", "antenna.s1p");
  assert.equal(evaluateLimit(measurement, "s11", 90e6, 210e6, "max", -10).status, "FAIL");
  assert.equal(evaluateLimit(measurement, "s11", 90e6, 210e6, "min", -13).status, "PASS");
  assert.equal(evaluateLimit(measurement, "s11", 90e6, 210e6, "max", -10).worstFrequencyHz, 200e6);
});

test("calculates RF trace statistics and 3 dB bandwidth", () => {
  const measurement = parseTouchstone("# MHz S DB R 50\n100 -20 0\n200 -2 0\n300 -1 0\n400 -2 0\n500 -20 0\n", "filter.s1p");
  const stats = measurementStatistics(measurement, "s11");
  assert.equal(stats.maximumFrequencyHz, 300e6);
  assert.equal(stats.bandwidth3dBHz, 200e6);
  assert.equal(stats.centreFrequencyHz, 300e6);
});

test("sorts data and keeps the final duplicate frequency row", () => {
  const measurement = parseTouchstone("# MHz S DB R 50\n200 -8 0\n100 -12 0\n200 -9 0\n", "duplicate.s1p");
  assert.deepEqual(measurement.points.map((point) => point.frequencyHz), [100e6, 200e6]);
  assert.equal(measurement.points[1].s11, -9);
  assert.equal(measurement.warnings.length, 1);
});

test("rejects unsupported option lines and invalid rule ranges", () => {
  assert.throws(() => parseTouchstone("# furlong S DB R 50\n1 -10 0\n", "bad.s1p"), /frequency unit/);
  const measurement = parseTouchstone("# MHz S DB R 50\n100 -10 0\n", "valid.s1p");
  assert.equal(evaluateLimit(measurement, "s11", 200e6, 100e6, "max", -10).status, "INVALID RULE");
});

test("reports no data when a valid rule band has no samples", () => {
  const measurement = parseTouchstone("# MHz S DB R 50\n100 -10 0\n", "valid.s1p");
  assert.equal(evaluateLimit(measurement, "s11", 200e6, 300e6, "max", -10).status, "NO DATA");
});
