# Implementation Plan - Roles & TargetRoles Schema Cleanup

This plan addresses the TypeScript compilation errors by completing the migration from `memberTypes` to `roles` (User model) and `targetMemberTypes` to `targetRoles` (Event model).

## User Review Required

> [!IMPORTANT]
> **Terminology Standard**: I am standardizing the codebase to use `roles` for user memberships and `targetRoles` for event targeting. This resolves the ambiguity between "Member Types" and "User Roles".

> [!WARNING]
> **Data Integrity**: I will re-run the migration script to ensure all existing users have their `roles` field populated based on their registration date and previous status.

## Proposed Changes

### 1. Schema Standardization

#### [MODIFY] [schema.prisma](file:///C:/Dev/fh-abalat/prisma/schema.prisma)
- **Event**: Rename `targetMemberTypes` to `targetRoles`.
- This ensures consistency across the entire database.

### 2. Codebase Refactoring

#### [REPLACE] `memberTypes` -> `roles`
I will update all remaining occurrences in:
- Attendance pages (Abalat, Mezmur)
- Member export and list routes
- Enrollment management pages
- Dashboard statistics
- Migration scripts

#### [REPLACE] `targetMemberTypes` -> `targetRoles`
I will update all occurrences in:
- Event creation forms
- Event API routes (List, Create, Update)
- Course event generator library

### 3. Migration and Stabilization

#### [MODIFY/RUN] [migrate-member-ids.ts](file:///C:/Dev/fh-abalat/src/scripts/migrate-member-ids.ts)
- Update the script to use the new `roles` field.
- Execute the script to re-populate user roles and standardized IDs (`FH-XXXX-YY`).

### 4. Build Verification

#### [RUN] `npx tsc --noEmit`
- Ensure no TypeScript errors remain across the project.

## Verification Plan

### Automated Tests
- **Schema Validation**: Run `npx prisma validate`.
- **Type Check**: Run `npx tsc --noEmit`.

### Manual Verification
1. **Login**: Verify a user can log in with their new `FH-XXXX-YY` code.
2. **Dashboard**: Check that "Total Members" count is accurate on Abalat/Mezmur/Course dashboards.
3. **Event Targeting**: Create a new event in Abalat and verify that targeting works as expected with the new `targetRoles` field.
