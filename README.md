# BenchReport

BenchReport is a local-first RF measurement reporting prototype. Load one-port or two-port Touchstone files, compare traces, apply a frequency-band acceptance limit, and produce a clean printable report without uploading measurement data.

## Prototype features

- Parses `.s1p` and `.s2p` Touchstone files in DB/angle, magnitude/angle, or real/imaginary form
- Compares S11, S21, S12, or S22 across multiple measurements
- Applies an “at most” or “at least” dB limit over a selected frequency band
- Shows per-file and overall pass/fail results
- Produces an A4 landscape report using the browser print dialog
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
