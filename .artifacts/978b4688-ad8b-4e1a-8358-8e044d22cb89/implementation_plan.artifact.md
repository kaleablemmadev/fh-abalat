# Implementation Plan - Fix Eligibility Service Type Error

The build is failing due to a missing property `activePermissions` in the return object of `EligibilityService.calculateMemberScore` in `src/services/eligibility.service.ts`.

## Proposed Changes

### [Eligibility Service]

#### [MODIFY] [eligibility.service.ts](file:///C:/Users/hp/OneDrive/Documents/10_Business_Study_Plan/kaleablemmadev-portfolio/kaleab-dev-portfolio/02_CODING_PORTFOLIO/fh-abalat/src/services/eligibility.service.ts)

- Update `calculateMemberScore` to fetch and return `activePermissions`.
- Enhance `attendanceDetails` to include `excused` status and `permissionType` where available by including permissions in the Prisma query.

Specifically:
1. In `calculateMemberScore`, add `permission: { include: { permissionType: true } }` to the Prisma query include block.
2. Fetch all approved permissions for the member to populate the `activePermissions` return property.
3. Map the fetched permissions to the expected format.
4. Update the return statement to include `activePermissions`.

## Verification Plan

### Automated Tests
- Since this is a TypeScript type error, the primary verification will be running `npm run build` or `npx tsc` to ensure the type error is resolved.

### Manual Verification
- Verify that eligibility checks still work as expected in the application.
