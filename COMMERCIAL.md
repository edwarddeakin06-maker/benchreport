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

## Planned launch offer

- Price: £29 GBP
- Licence: one user, one-time purchase
- Fulfilment: automatic installer delivery from the merchant platform
- Refund and update terms: must be written before checkout opens

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

## Remaining merchant handoff

1. Create the merchant account in the owner's legal name.
2. Complete payout, tax, and identity details.
3. Create a £29 digital software product.
4. Upload the verified installer.
5. Copy the checkout URL into `pro/index.html`.
6. Add refund, licence, and update terms.
7. Complete a real low-value test purchase before launch.

## Distribution caveat

The current installer is not Authenticode-signed. Windows SmartScreen may warn users because the publisher has no established signing reputation. Do not describe the installer as signed. Code signing can be added later if sales justify its cost.
