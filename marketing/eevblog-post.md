# EEVblog launch post

Recommended section: **RF, Microwave, Ham Radio**

Do not publish from a brand-new account created only for this post. EEVblog's rules prohibit accounts primarily used to promote a business. Participate normally first, then use this draft when the account has a genuine contribution history.

## Subject

Local browser tool for comparing S1P/S2P files and documenting RF limits

## Body

I have been working on a small tool for the repetitive step between exporting Touchstone measurements and producing a reviewable pass/fail record.

BenchReport opens S1P and S2P files locally in the browser, overlays measurements against a selected reference, applies a frequency-bounded limit to each unit, and reports the worst sampled value and its exact frequency. It then assembles the chart, results and test context into a printable report.

As a concrete example, the included synthetic filter data applies an S21 minimum of -2.00 dB from 900 MHz to 1.1 GHz. The golden unit reaches -1.20 dB, a second unit reaches -1.45 dB, and the deliberately degraded unit fails at -2.35 dB at 1.1 GHz.

The current parser supports common Touchstone 1.0-style S1P/S2P files in DB/angle, magnitude/angle and real/imaginary representations, with Hz, kHz, MHz or GHz frequency units. Limits are evaluated at the samples in the source file; there is no interpolation at band boundaries. It is deliberately a reporting workflow rather than a replacement for a VNA, calibration process, scikit-rf or a full RF analysis package.

The browser edition is free, requires no account, and sends no measurement contents to a server. Three synthetic files are included, so the complete workflow can be tried without providing any data:

https://edwarddeakin06-maker.github.io/benchreport/

I also wrote up the comparison method and exact sample results here:

https://edwarddeakin06-maker.github.io/benchreport/tools/compare-s2p-files/

The source and parser tests are public:

https://github.com/edwarddeakin06-maker/benchreport

I am the developer. There is also an optional paid Windows edition for unlimited measurements/rules, saved projects, templates and company branding, so I want to disclose that clearly. The free browser workflow is usable on its own.

Technical criticism is welcome, particularly around Touchstone files the parser rejects incorrectly, misleading RF terminology, and information missing from the report. This is analysis and documentation software, not a calibrated instrument or approved test process.

## Attachment

Attach `assets/benchreport-demo.gif` if the forum accepts the 466 KB animated GIF. If animation is not supported, use `assets/benchreport-workflow.png` instead.

## Before posting

- Re-read the current EEVblog forum rules.
- Confirm the RF, Microwave, Ham Radio section is still the best fit.
- Use a normal personal/neutral account, not a fake customer or brand endorsement.
- Do not ask anyone to upvote, bump or promote the thread.
- Do not repeat the Gumroad purchase link in the opening post.
- Stay available to answer technical questions in your own words.
