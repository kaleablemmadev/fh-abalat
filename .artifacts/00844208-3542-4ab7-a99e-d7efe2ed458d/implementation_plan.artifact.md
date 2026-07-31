# Attendance and Permission Enhancements

This plan addresses three refinements: removing the "Late" attendance option, improving the permission date input UI, and implementing automatic permission pre-filling in the attendance grid.

## User Review Required

> [!IMPORTANT]
> - **Auto-fill Behavior**: The system will automatically mark a member as "Permission" (P) in the attendance grid if they have an approved permission covering that date.
> - **Precedence**: Actual attendance records stored in the database always take precedence over auto-filled permissions. If an admin manually marks someone as "Attended" or "Absent", that manual mark stays.
> - **Date Consistency**: The new structured date input for permissions will ensure the string stored in the database (e.g., "Hamle 1, 2018") is consistent and can be correctly parsed by the auto-fill logic.

## Proposed Changes

### [Attendance Module]

#### [MODIFY] [MultiMonthGrid (MultiMonthGrid.tsx)](file:///C:/Dev/fh-abalat/src/app/abalat/attendance/components/MultiMonthGrid.tsx)
- Accept `autoFillRecords` as a prop.
- In `useState` initialization for `attendanceData`, merge `initialAttendance` with `autoFillRecords`.
- Filter out the "Late" button from the rendering loop.

#### [MODIFY] [MultiMonthAttendancePage (page.tsx)](file:///C:/Dev/fh-abalat/src/app/abalat/attendance/[type]/page.tsx)
- Filter out the "Late" attendance type from the `attendanceTypes` passed to the grid.
- Fetch `APPROVED` permissions for the members currently being viewed.
- Use `isMemberExcusedForEvent` from `permission.service.ts` to pre-calculate which cells should be auto-filled.

### [Member Management Module]

#### [MODIFY] [MemberDetailClient (MemberDetailClient.tsx)](file:///C:/Dev/fh-abalat/src/app/abalat/members/components/MemberDetailClient.tsx)
- Replace the single text input for "Ethiopian Start Date" with three separate inputs:
  - A `<select>` for the Ethiopian month.
  - A `<input type="number">` for the day (1-30).
  - A `<input type="number">` for the year.
- Update `handleAddPermission` to format these into the standard "Month Day, Year" string before sending to the API.

### [Permission Service]

#### [MODIFY] [permission.service.ts](file:///C:/Dev/fh-abalat/src/services/permission.service.ts)
- Export `isMemberExcusedForEvent` so it can be used on the server side in the page component.

## Verification Plan

### Manual Verification
1. **Late Button**: Open an attendance page and verify the "Late" button is gone.
2. **Structured Permission Date**:
   - Go to a member's detail page.
   - Click "Add Permission".
   - Verify the new month dropdown and numeric day/year inputs.
   - Save a permission and verify it appears in the list correctly formatted.
3. **Auto-fill Logic**:
   - Give a member a permission starting Hamle 1, 2018 for 3 months.
   - Open the attendance page for those months.
   - Verify that cells for that member are automatically showing "P".
   - Manually change one to "Attended" and save.
   - Refresh and verify the "Attended" status persists over the auto-fill.
