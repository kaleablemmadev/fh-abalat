# Implementation Plan - Fix NextResponse BodyInit Type Error

The build is failing because `NextResponse` expects a `BodyInit` type, but is receiving a Node.js `Buffer`. In the Next.js App Router environment, `Buffer` needs to be converted to a `Uint8Array` to satisfy the TypeScript compiler.

## Proposed Changes

### [API Routes]

#### [MODIFY] [monthly-attendance download route](file:///C:/Users/hp/OneDrive/Documents/10_Business_Study_Plan/kaleablemmadev-portfolio/kaleab-dev-portfolio/02_CODING_PORTFOLIO/fh-abalat/src/app/api/reports/monthly-attendance/download/route.ts)
- Wrap `docxBuffer` and `pdfBuffer` with `new Uint8Array()` when passing to `new NextResponse()`.

#### [MODIFY] [eligibility download route](file:///C:/Users/hp/OneDrive/Documents/10_Business_Study_Plan/kaleablemmadev-portfolio/kaleab-dev-portfolio/02_CODING_PORTFOLIO/fh-abalat/src/app/api/events/[eventId]/eligibility/download/route.ts)
- Wrap `docBuffer` with `new Uint8Array()` when passing to `new NextResponse()`.

## Verification Plan

### Automated Tests
- Run `analyze_file` on both files to ensure TypeScript no longer reports the `BodyInit` error.
- The primary verification is a successful build on Vercel.
