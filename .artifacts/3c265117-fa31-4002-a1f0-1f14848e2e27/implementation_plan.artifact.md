# Implementation Plan - Course Module "Serious Issues" Fix & Info Export

This plan addresses data consistency, missing UI pages, hardcoded dashboard stats, and adds data export capabilities to "allow others to take the info."

## User Review Required

> [!IMPORTANT]
> **Data Dependencies:** Course deletion will now be blocked if there are active offerings (`CourseYear`) or grades linked to it, ensuring database integrity.

> [!TIP]
> **Export Formats:** I will implement CSV export for course and student lists as a starting point for "taking the info," as it is highly compatible with Excel and other data tools.

## Proposed Changes

### 1. Course Dashboard & Global Improvements
- **[MODIFY] [course/page.tsx](file:///C:/Dev/fh-abalat/src/app/course/page.tsx)**:
    - Replace hardcoded `0` stats with real database counts (Enrollments, Courses, Instructors).
    - Update styling to match the new high-quality mobile-first theme.
- **[MODIFY] [course/layout.tsx](file:///C:/Dev/fh-abalat/src/app/course/layout.tsx)**: Fix any potential navigation issues.

### 2. Course Listing & Details
- **[NEW] [course/courses/[id]/page.tsx](file:///C:/Dev/fh-abalat/src/app/course/courses/[id]/page.tsx)**: Implement the missing course details page.
- **[MODIFY] [course/courses/components/CourseListClient.tsx](file:///C:/Dev/fh-abalat/src/app/course/courses/components/CourseListClient.tsx)**:
    - Add an "Export to CSV" button.
    - Add a "Delete" button with dependency checks.
    - Improve responsiveness of the course cards.

### 3. Data Integrity & API Fixes
- **[MODIFY] [api/course/courses/[id]/route.ts](file:///C:/Dev/fh-abalat/src/app/api/course/courses/[id]/route.ts)**:
    - Enhance `DELETE` logic to check for `CourseYear` dependencies.
- **[NEW] [api/course/courses/export/route.ts](file:///C:/Dev/fh-abalat/src/app/api/course/courses/export/route.ts)**: API to generate CSV for all courses.

### 4. Student Information Management
- **[MODIFY] [course/members/components/MemberListClient.tsx](file:///C:/Dev/fh-abalat/src/app/course/members/components/MemberListClient.tsx)**:
    - Add an "Export Student List" button.
    - Refactor to match the mobile-first design of the Abalat members list.

## Verification Plan

### Manual Verification
- **Dashboard:** Verify stats change when new data is added.
- **Export:** Download CSVs and verify they open correctly in Excel/Sheets with all expected columns.
- **Details Page:** Click a course and verify its full info (topics, offerings, instructor) is shown.
- **Safety:** Attempt to delete a course with active classes and verify it is blocked with a clear message.

### Automated Tests
- `npm run build` to check for type errors.
