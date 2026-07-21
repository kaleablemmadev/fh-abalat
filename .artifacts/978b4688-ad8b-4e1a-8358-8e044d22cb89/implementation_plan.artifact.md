# Implementation Plan - Unstick Action Bars

The user wants to remove the fixed positioning of the "Save Changes" / "Save Attendance" bars in the attendance pages and other places, so they flow naturally with the content instead of being stuck at the bottom of the viewport.

## Proposed Changes

### [Attendance Components]

#### [MODIFY] [MultiMonthGrid.tsx](file:///C:/Users/hp/OneDrive/Documents/10_Business_Study_Plan/kaleablemmadev-portfolio/kaleab-dev-portfolio/02_CODING_PORTFOLIO/fh-abalat/src/app/attendance/components/MultiMonthGrid.tsx)
- Change the "Sticky save bar" from `fixed bottom-0 ...` to a normal `div` that flows at the end of the content.
- Update styling to remove viewport-relative positioning (`left-0`, `md:left-56`, `right-0`) and add margin/padding/rounding suitable for a content-integrated bar.

#### [MODIFY] [AttendanceGrid.tsx](file:///C:/Users/hp/OneDrive/Documents/10_Business_Study_Plan/kaleablemmadev-portfolio/kaleab-dev-portfolio/02_CODING_PORTFOLIO/fh-abalat/src/app/events/[eventId]/attendance/components/AttendanceGrid.tsx)
- Similar to above, change the fixed bar to a naturally flowing bar.

## Verification Plan

### Manual Verification
- **Attendance Page**: Verify that the "Save Attendance" bar now appears directly below the table and scrolls with the page.
- **Event Attendance Page**: Verify the same for the event-specific attendance grid.
- **Mobile View**: Verify that these bars are no longer overlapping with the mobile bottom navigation bar.
