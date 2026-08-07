# BenchReport 0.2

BenchReport is a local-first RF measurement reporting prototype. Load one-port or two-port Touchstone files, compare traces, apply a frequency-band acceptance limit, and produce a clean printable report without uploading measurement data.

## Features

- Parses `.s1p` and `.s2p` Touchstone files in DB/angle, magnitude/angle, or real/imaginary form
- Compares S11, S21, S12, or S22 across multiple measurements
- Applies multiple named “at most” or “at least” limits over independent frequency bands and traces
- Records worst-case values and their exact frequencies
- Calculates minima, maxima, 3 dB bandwidth, centre frequency, and S21 peak insertion loss
- Saves reusable limit templates in the browser
- Renames, recolours, hides, and marks golden/reference traces
- Saves and reopens complete portable `.brp` project files, including measurement data
- Produces a branded, multi-rule A4 landscape report with project metadata, logo, statistics, and pass/fail results
- Includes three entirely synthetic filter measurements for evaluation
- Runs without application dependencies or external services

## Run locally

Install Node.js 18 or later, then run:

```powershell
npm start
```

Open `http://localhost:4173`. Select **Load synthetic filter samples** for an immediate demonstration. To create a PDF, select **Export / print report**, then choose **Save as PDF** in the print dialog.

## Test

```powershell
npm test
```

## Current scope

This is a product-validation prototype, not calibrated test software. It supports Touchstone 1.0-style one-port and two-port S-parameter data. It does not yet support Touchstone 2.0 matrix ordering options, noise parameters, de-embedding, uncertainty calculations, instrument control, or signed report records.

## Independence and data handling

Measurement processing occurs in the browser. No file contents are sent anywhere. All included measurements are synthetic and do not represent employer, customer, defence, or real device data.

## Product direction

The intended commercial split is a free viewer and a paid reporting edition with reusable templates, limit masks, batch processing, branded output, and packaged desktop distribution.
