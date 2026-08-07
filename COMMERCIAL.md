# BenchReport commercial release checklist

## Product boundary

### Free browser edition

- Up to three measurements
- One acceptance rule
- Touchstone plotting and RF statistics
- Reference-trace selection
- Basic local report export

### BenchReport Pro for Windows

- Unlimited measurements
- Unlimited acceptance rules
- Reusable rule templates
- Portable `.brp` project files
- Company, project, and report metadata
- Embedded company logo
- Branded multi-rule PDF report
- Local Windows application

## Launch offer

- Price: £29 GBP
- Licence: one user, one-time purchase
- Fulfilment: automatic installer delivery through Gumroad
- Checkout: https://deakinator80.gumroad.com/l/benchreport-pro
- Refund: 30-day money-back guarantee through Gumroad
- Updates: all BenchReport Pro 0.x maintenance releases
- Published terms: https://edwarddeakin06-maker.github.io/benchreport/support/

## Build and verification

```powershell
npm ci
npm test
$env:BENCHREPORT_SMOKE_TEST='1'
npm run desktop
npm run dist:win
Get-FileHash dist\BenchReport-Pro-0.4.0-Setup.exe -Algorithm SHA256
```

Do not attach the Pro installer to a public GitHub release. The repository workflow creates a build artifact only when manually dispatched.

## Merchant handoff status

1. Gumroad product published at the checkout URL above.
2. Installer uploaded for automatic delivery.
3. Receipt, licence summary, SmartScreen notice, cover, and thumbnail configured.
4. Public licence, refund, support, update, and integrity information published.
5. Outstanding: replace the personal Gumroad support email with a dedicated BenchReport mailbox.
6. Repeat Gumroad's test-purchase flow after every installer update.

## Distribution caveat

The current installer is not Authenticode-signed. Windows SmartScreen may warn users because the publisher has no established signing reputation. Do not describe the installer as signed. Code signing can be added later if sales justify its cost.
