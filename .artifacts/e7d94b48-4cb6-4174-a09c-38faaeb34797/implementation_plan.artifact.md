# Implementation Plan - Membership Transition & Dual Role ID System

Implement the dual-identity system for users who are both Course Students and Abalat Members, update the ID format to include Ethiopian registration years, and redesign the login experience.

## User Review Required

> [!IMPORTANT]
> **Database Schema Evolution**:
> - **Multi-Role Support**: The `memberType` field will be converted to an array `memberTypes memberType[]`.
> - **Dual Identifiers**: `privateId` will store the Abalat code (`FH-xxxxxx-yy`), and `coursePrivateId` will store the Course code (`FHC-xxxxxx-yy`).
> - **Registration Years**: Both IDs will end with the last 2 digits of the user's **Ethiopian registration year**, derived from the `createdAt` attribute.

> [!CAUTION]
> **ID Format Migration**: All existing member IDs will be forcefully updated to the new `[6 random digits]-[2 year digits]` format. Existing `FH-xxxx` codes will be replaced.

## Proposed Changes

### 1. Database Schema Update

#### [MODIFY] [schema.prisma](file:///C:/Dev/fh-abalat/prisma/schema.prisma)
- **User**:
    - Add `coursePrivateId String? @unique`.
    - Change `memberType` to `memberTypes memberType[]`.
- **[NEW] MembershipRecommendation**:
    - Stores students recommended for Abalat registration.
    - Fields: `id`, `studentId`, `status` (PENDING, REGISTERED), `createdAt`.

### 2. ID Generation Logic

#### [MODIFY] [utils.ts](file:///C:/Dev/fh-abalat/src/lib/utils.ts)
- Update `generateAccessCode` and `generateCourseStudentCode`:
    - Format: `(FH|FHC)-[6 random digits]-[2 year digits]`.
    - Random digits must be unique across the database for their respective fields.
    - Year is passed as a 2-digit number (e.g., `18` for 2018 E.C.).

### 3. Redesigned Member Login

#### [MODIFY] [Member Login Page](file:///C:/Dev/fh-abalat/src/app/page.tsx)
- Two numeric-only inputs with auto-focus jump (Field 1 -> Field 2 after 6 digits).
- Prevent any non-numeric characters.
- After entry, show two selection buttons: **"Abalat Member (አባል)"** and **"Course Student (ተማሪ)"**.
- Each button triggers a search in the corresponding DB field (`privateId` vs `coursePrivateId`).

### 4. Salsay Transition Workflow

#### [UI] [Course Student Detail](file:///C:/Dev/fh-abalat/src/app/course/members/%5Bid%5D/page.tsx)
- Display banner for Salsay+ students without Abalat role.
- Button to "Send Information to Abalat Admins".

#### [API/UI] [Abalat Recommendation Center](file:///C:/Dev/fh-abalat/src/app/abalat/recommendations/page.tsx)
- A dashboard for Abalat admins to view sent files.
- **Register Button**: Leads to a standard registration form that, upon completion, updates the existing `User` record with Abalat details and role.

### 5. Existing Data Migration

#### [NEW] [Migration Script](file:///C:/Dev/fh-abalat/src/scripts/migrate-member-ids.ts)
- A script to:
    1. Extract Ethiopian year from `createdAt` for every user.
    2. Convert `memberType` to `memberTypes` array.
    3. Generate and assign new 6+2 digit IDs to all existing members.

## Verification Plan

### Automated Tests
- **ID Integrity**: Script to verify no duplicate IDs exist after migration.
- **Role Isolation**: Verify that a user with only `COURSE_STUDENT` in `memberTypes` cannot log in as an "Abalat Member".

### Manual Verification
1. **Auto-Jump UX**: Verify the login page inputs shift focus correctly.
2. **Transition Flow**: Progress a student to Salsay -> Send Recommendation -> Register in Abalat -> Check Dual IDs.
3. **Keremt Progression**: Verify Keremt students who pass are enrolled in Kaleay for the next year.
