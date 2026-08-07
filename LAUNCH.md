# BenchReport launch kit

## Primary launch post — r/rfelectronics

### Title

I built a free local Touchstone reporting tool — looking for RF engineers to break it

### Body

I work with RF measurements and wanted a quicker route from S1P/S2P files to a presentable test report without rebuilding the same spreadsheet each time, so I built BenchReport.

The free browser version can:

- open S1P and S2P files in DB, MA, or RI format
- overlay measurements and compare them with a reference trace
- apply a frequency-bounded pass/fail rule
- show the worst value and its exact frequency
- calculate useful S21 statistics
- export a clean report

Everything runs locally in the browser. Measurement files are not uploaded, there is no account, and the included demo data is synthetic.

Free tool: https://edwarddeakin06-maker.github.io/benchreport/

GitHub: https://github.com/edwarddeakin06-maker/benchreport

I also made a paid Windows edition with unlimited files/rules, saved projects, templates and branded reports, but the browser tool is genuinely useful on its own. I am the developer, so this is self-promotion.

I would especially value feedback on parser edge cases, the pass/fail workflow, and what would make the generated report credible in your lab.

## LinkedIn launch post

I built BenchReport: a local-first tool for turning Touchstone measurements into consistent RF test reports.

It started from a familiar workflow problem—S1P/S2P measurements are easy to capture, but comparing units, applying acceptance limits and producing a readable report often means rebuilding a spreadsheet or script.

The free browser edition loads measurement files locally, overlays traces, applies pass/fail limits, identifies worst-case frequencies and exports a structured report. Files are processed on the device and are not uploaded.

Try the free version: https://edwarddeakin06-maker.github.io/benchreport/

For repeat workflows, BenchReport Pro adds unlimited measurements and rules, reusable templates, saved projects and branded reporting as a Windows application.

I would appreciate feedback from RF, test and validation engineers—particularly on the reporting workflow and Touchstone compatibility.

#RFEngineering #TestEngineering #SParameters #Touchstone #EngineeringSoftware

## EEVblog Projects forum draft

### Subject

BenchReport — local S1P/S2P comparison and RF acceptance reports

### Body

I have built a small local-first reporting tool for repetitive RF measurement work and would value technical feedback from the forum.

BenchReport reads S1P/S2P Touchstone files, overlays measurements, applies frequency-bounded acceptance rules, reports the worst sampled value/frequency, and generates a printable report. DB/angle, magnitude/angle and real/imaginary data are supported. Processing happens in the browser and measurement contents are not sent to a server.

The public version is free and includes synthetic samples:
https://edwarddeakin06-maker.github.io/benchreport/

Source and parser tests:
https://github.com/edwarddeakin06-maker/benchreport

There is also a £29 Windows Pro edition for unlimited measurements/rules, reusable projects and branded reports. I am the developer and am posting this for feedback as well as disclosure of the paid edition.

Useful criticism is welcome, particularly malformed Touchstone cases, reporting omissions, and anything that would prevent use in a real bench workflow.

## First-day sequence

1. Publish the r/rfelectronics post first, after checking the current community rules and choosing any required self-promotion flair.
2. Reply to technical feedback; do not repeatedly post the purchase link.
3. Publish the LinkedIn post two to four hours later using the product cover image.
4. Post the EEVblog thread only after reading the current forum rules and choosing the Projects or RF section that best fits.
5. Record visits, free-tool usage, checkout clicks and sales after 24 hours.

## Response templates

### Why not use scikit-rf or commercial RF software?

Those are more capable analysis environments. BenchReport is deliberately narrower: it is for quickly turning a small batch of measurements and acceptance rules into a consistent report without writing code or uploading data.

### Is measurement data uploaded?

No. The browser and desktop editions process Touchstone contents locally. The public site is static.

### Why is the Windows version paid?

The free edition covers quick inspection. The paid edition is for repeat reporting work and adds unlimited measurements and rules, templates, saved projects and company branding.

### Does this replace calibrated RF software?

No. BenchReport is analysis and documentation software, not a calibrated instrument or approved test process. Results still require competent engineering review.
